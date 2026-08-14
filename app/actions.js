'use server';

import { randomUUID } from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { validateApplicant, monthsBetween } from '@/lib/validation';

const BUCKET = 'applications';
const VALID_CATEGORIES = ['intern', 'grad', 'working'];

// Step 1: called before any file is uploaded. Creates a unique application id
// and short-lived, single-use signed upload URLs so the browser can send the
// PDF bytes directly to Supabase Storage — never through this server, so
// there's no Vercel function body-size limit to worry about.
export async function getUploadTargets(category) {
  if (!VALID_CATEGORIES.includes(category)) {
    throw new Error('Invalid category.');
  }

  const id = randomUUID();
  const admin = supabaseAdmin();

  const resumePath = `${id}/resume.pdf`;
  const { data: resumeData, error: resumeError } = await admin.storage
    .from(BUCKET)
    .createSignedUploadUrl(resumePath);
  if (resumeError) throw new Error('Could not prepare resume upload: ' + resumeError.message);

  let transcript = null;
  if (category !== 'working') {
    const transcriptPath = `${id}/transcript.pdf`;
    const { data: transcriptData, error: transcriptError } = await admin.storage
      .from(BUCKET)
      .createSignedUploadUrl(transcriptPath);
    if (transcriptError)
      throw new Error('Could not prepare transcript upload: ' + transcriptError.message);
    transcript = {
      path: transcriptData.path,
      token: transcriptData.token,
    };
  }

  let salarySip = null;
  if (category === 'working') {
    const salarySlipPath = `${id}/salary_slip.pdf`;
    const { data: salarySlipData, error: salarySlipError } = await admin.storage
      .from(BUCKET)
      .createSignedUploadUrl(salarySlipPath);
    if (salarySlipError)
      throw new Error('Could not prepare salary slip upload: ' + salarySlipError.message);
    salarySip = {
      path: salarySlipData.path,
      token: salarySlipData.token,
    };
  }

  return {
    id,
    resume: { path: resumeData.path, token: resumeData.token },
    transcript,
    salarySip,
  };
}

// Step 2: called after the browser has successfully uploaded the PDF(s)
// straight to Storage. This just logs the metadata row — no file bytes pass
// through here, so it's a small, fast request safe for any Vercel plan.
export async function submitApplication(payload) {
  const {
    id,
    name,
    email,
    phone,
    position,
    category,
    org,
    program,
    internStart,
    internEnd,
    resumePath,
    transcriptPath,
    salarySlipPath,
  } = payload;

  if (!id) throw new Error('Missing required fields.');

  const problem = validateApplicant({
    name,
    email,
    phone,
    position,
    category,
    org,
    program,
    internStart,
    internEnd,
  });
  if (problem) throw new Error(problem);

  if (!resumePath) {
    throw new Error('Resume was not uploaded.');
  }
  if (category !== 'working' && !transcriptPath) {
    throw new Error('Transcript is required for this category.');
  }
  if (category === 'working' && !salarySlipPath) {
    throw new Error('Salary slip is required for working applicants.');
  }

  const admin = supabaseAdmin();

  const { data: validPosition } = await admin
    .from('positions')
    .select('id')
    .eq('title', position.trim())
    .eq('is_active', true)
    .maybeSingle();
  if (!validPosition) {
    throw new Error('That position is no longer open. Please refresh and pick another.');
  }

  const isIntern = category === 'intern';
  // Recomputed here rather than trusted from the client — the payload is
  // just a Server Action argument, callable directly with any values.
  const duration = isIntern ? monthsBetween(internStart, internEnd) : null;

  const { error } = await admin.from('applicants').insert({
    id,
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    position: position.trim(),
    category,
    org: org.trim(),
    program_or_role: program.trim(),
    internship_start_date: isIntern ? internStart : null,
    internship_end_date: isIntern ? internEnd : null,
    internship_duration_months: duration?.months ?? null,
    resume_path: resumePath,
    transcript_path: category === 'working' ? null : transcriptPath,
    salary_slip_path: category === 'working' ? salarySlipPath : null,
    status: 'New',
  });

  if (error) throw new Error('Could not save application: ' + error.message);

  return { ok: true };
}
