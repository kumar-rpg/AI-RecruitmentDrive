'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseServer } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { validateApplicant, monthsBetween } from '@/lib/validation';

const BUCKET = 'applications';
// Must stay in step with the CHECK constraint on applicants.status — see the
// latest status migration under supabase/migrations/ — and with STATUSES in
// DashboardClient.js and STATUS_META in StatsPanel.js.
const VALID_STATUSES = [
  'New', 'Reviewing', 'Shortlisted', 'Interview', 'Offered', 'Hired', 'Rejected',
];

// Defense in depth: middleware.js already blocks unauthenticated visits to
// /dashboard, but Server Actions are separately callable endpoints, so every
// action here re-checks that a real admin session is attached to the request.
async function requireAdmin() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated.');
  return user;
}

export async function updateStatus(id, status) {
  await requireAdmin();
  if (!VALID_STATUSES.includes(status)) throw new Error('Invalid status.');

  const { error } = await supabaseAdmin().from('applicants').update({ status }).eq('id', id);
  if (error) throw new Error('Could not update status: ' + error.message);
  return { ok: true };
}

export async function updateApplicant(id, payload) {
  await requireAdmin();
  if (!id) throw new Error('Missing applicant id.');

  // Same rules the public form enforces — one shared validator, so an admin
  // edit can never write a record the form itself would have rejected.
  const problem = validateApplicant(payload);
  if (problem) throw new Error(problem);

  const { name, email, phone, position, category, org, program, internStart, internEnd } = payload;
  const admin = supabaseAdmin();

  // The position must still exist. Closed positions are allowed here (unlike on
  // the public form) so an admin can reassign someone to a role that has since
  // been closed.
  const { data: validPosition } = await admin
    .from('positions')
    .select('id')
    .eq('title', position.trim())
    .maybeSingle();
  if (!validPosition) {
    throw new Error(`"${position.trim()}" is not a position on record. Pick one from the list.`);
  }

  const isWorking = category === 'working';
  const isIntern = category === 'intern';
  // Recomputed here rather than trusted from the client — same reasoning as
  // the public submit action.
  const duration = isIntern ? monthsBetween(internStart, internEnd) : null;

  const { error } = await admin
    .from('applicants')
    .update({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      position: position.trim(),
      category,
      org: isWorking ? '' : org.trim(),
      program_or_role: isWorking ? '' : program.trim(),
      internship_start_date: isIntern ? internStart : null,
      internship_end_date: isIntern ? internEnd : null,
      internship_duration_months: duration?.months ?? null,
    })
    .eq('id', id);
  if (error) throw new Error('Could not save changes: ' + error.message);

  revalidatePath('/dashboard');
  return { ok: true };
}

export async function deleteApplicant(id) {
  await requireAdmin();

  const { error } = await supabaseAdmin().from('applicants').delete().eq('id', id);
  if (error) throw new Error('Could not delete applicant: ' + error.message);
  return { ok: true };
}

// Returns a short-lived signed URL so the admin can view a resume/transcript
// without the storage bucket ever being public.
export async function getDocUrl(path) {
  await requireAdmin();
  if (!path) throw new Error('No document on file.');

  const { data, error } = await supabaseAdmin()
    .storage.from(BUCKET)
    .createSignedUrl(path, 300);
  if (error) throw new Error('Could not generate document link: ' + error.message);
  return data.signedUrl;
}

export async function createPosition(title) {
  await requireAdmin();
  const trimmed = title?.trim();
  if (!trimmed) throw new Error('Position title cannot be empty.');

  const { error } = await supabaseAdmin().from('positions').insert({ title: trimmed });
  if (error) {
    if (error.code === '23505') throw new Error('A position with that title already exists.');
    throw new Error('Could not create position: ' + error.message);
  }

  // Managing positions now lives on its own page, so the dashboard has to be
  // invalidated explicitly — otherwise navigating back would show the position
  // filter and the by-position panel built from a stale cached render.
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/positions');
  return { ok: true };
}

export async function togglePositionActive(id, isActive) {
  await requireAdmin();

  const { error } = await supabaseAdmin()
    .from('positions')
    .update({ is_active: isActive })
    .eq('id', id);
  if (error) throw new Error('Could not update position: ' + error.message);

  // Managing positions now lives on its own page, so the dashboard has to be
  // invalidated explicitly — otherwise navigating back would show the position
  // filter and the by-position panel built from a stale cached render.
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/positions');
  return { ok: true };
}

export async function renamePosition(id, newTitle) {
  await requireAdmin();

  const trimmed = newTitle?.trim();
  if (!trimmed) throw new Error('Position title cannot be empty.');

  const admin = supabaseAdmin();

  const { data: current, error: readError } = await admin
    .from('positions')
    .select('title')
    .eq('id', id)
    .maybeSingle();
  if (readError) throw new Error('Could not read position: ' + readError.message);
  if (!current) throw new Error('That position no longer exists.');
  if (current.title === trimmed) return { ok: true, applicationsUpdated: 0 };

  const { error } = await admin.from('positions').update({ title: trimmed }).eq('id', id);
  if (error) {
    if (error.code === '23505') throw new Error('A position with that title already exists.');
    throw new Error('Could not rename position: ' + error.message);
  }

  // Applicants store the position as text, not a foreign key, so the rename has
  // to be carried across by hand or past applications would detach from the
  // role. Renaming the position first means that if this second step fails, the
  // applications simply keep the old title (they surface as "Removed" in the
  // by-position panel) rather than pointing at a title that never existed —
  // and renaming back recovers it.
  const { data: moved, error: cascadeError } = await admin
    .from('applicants')
    .update({ position: trimmed })
    .eq('position', current.title)
    .select('id');
  if (cascadeError) {
    throw new Error(
      `Position renamed, but its existing applications could not be moved: ${cascadeError.message}. ` +
        `Rename it back to "${current.title}" and try again.`
    );
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/positions');
  return { ok: true, applicationsUpdated: moved?.length ?? 0 };
}

export async function deletePosition(id) {
  await requireAdmin();

  const { error } = await supabaseAdmin().from('positions').delete().eq('id', id);
  if (error) throw new Error('Could not delete position: ' + error.message);

  // Managing positions now lives on its own page, so the dashboard has to be
  // invalidated explicitly — otherwise navigating back would show the position
  // filter and the by-position panel built from a stale cached render.
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/positions');
  return { ok: true };
}

export async function signOut() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect('/login');
}
