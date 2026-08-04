'use server';

import { randomUUID } from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const BUCKET = 'applications';
const VALID_CATEGORIES = ['intern', 'grad', 'working'];
const NAME_PATTERN = /^[A-Za-z]+(?:\s[A-Za-z]+)*$/;
const PHONE_PATTERN = /^\d{3}-\d{4,8}$/;

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

  return {
    id,
    resume: { path: resumeData.path, token: resumeData.token },
    transcript,
  };
}

// Step 2: called after the browser has successfully uploaded the PDF(s)
// straight to Storage. This just logs the metadata row — no file bytes pass
// through here, so it's a small, fast request safe for any Vercel plan.
export async function submitApplication(payload) {
  const { id, name, email, phone, position, category, org, program, resumePath, transcriptPath } =
    payload;

  if (
    !id ||
    !name?.trim() ||
    !email?.trim() ||
    !phone?.trim() ||
    !position?.trim() ||
    !VALID_CATEGORIES.includes(category)
  ) {
    throw new Error('Missing required fields.');
  }
  if (!NAME_PATTERN.test(name.trim())) {
    throw new Error('Name must contain letters only.');
  }
  if (!PHONE_PATTERN.test(phone.trim())) {
    throw new Error('Phone number must be in the format 016-4028507.');
  }
  if (category !== 'working' && (!org?.trim() || !program?.trim())) {
    throw new Error('University and Program are required for this category.');
  }
  if (!resumePath) {
    throw new Error('Resume was not uploaded.');
  }
  if (category !== 'working' && !transcriptPath) {
    throw new Error('Transcript is required for this category.');
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

  const { error } = await admin.from('applicants').insert({
    id,
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    position: position.trim(),
    category,
    org: org.trim(),
    program_or_role: program.trim(),
    resume_path: resumePath,
    transcript_path: category === 'working' ? null : transcriptPath,
    status: 'New',
  });

  if (error) throw new Error('Could not save application: ' + error.message);

  return { ok: true };
}
