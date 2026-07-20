'use server';

import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const BUCKET = 'applications';
const VALID_STATUSES = ['New', 'Reviewing', 'Shortlisted', 'Rejected'];

// Defense in depth: middleware.js already blocks unauthenticated visits to
// /dashboard, but Server Actions are separately callable endpoints, so every
// action here re-checks that a real admin session is attached to the request.
async function requireAdmin() {
  const supabase = supabaseServer();
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

export async function signOut() {
  const supabase = supabaseServer();
  await supabase.auth.signOut();
  redirect('/login');
}
