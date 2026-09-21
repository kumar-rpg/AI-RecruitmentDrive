'use server';

import { supabaseServer } from './supabaseServer';
import { supabaseAdmin } from './supabaseAdmin';
import { redirect } from 'next/navigation';

// ---------- Draft helpers ----------

export async function getOrCreateDraft() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Check for existing draft/submission
  const { data: existing } = await supabase
    .from('employment_applications')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (existing) return existing;

  // First login — pre-fill from applicants table
  const { data: applicant } = await supabaseAdmin()
    .from('applicants')
    .select('id, name, email, phone, position, org')
    .eq('email', user.email)
    .eq('status', 'Interview')
    .maybeSingle();

  const prefill = {
    auth_user_id: user.id,
    applicant_id: applicant?.id ?? null,
    full_name: applicant?.name ?? '',
    email: applicant?.email ?? user.email,
    phone_mobile: applicant?.phone ?? '',
    position_applied: applicant?.position ?? '',
    last_saved_at: new Date().toISOString(),
  };

  const { data: created, error } = await supabase
    .from('employment_applications')
    .insert(prefill)
    .select('*')
    .single();

  if (error) {
    // Race condition: another request created it — fetch it
    const { data: raceResult } = await supabase
      .from('employment_applications')
      .select('*')
      .eq('auth_user_id', user.id)
      .maybeSingle();
    return raceResult;
  }

  return created;
}

export async function saveDraft(section) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('employment_applications')
    .upsert(
      { auth_user_id: user.id, ...section, last_saved_at: new Date().toISOString() },
      { onConflict: 'auth_user_id' }
    );

  if (error) return { error: error.message };
  return { success: true };
}

export async function submitApplication() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/ea/login');

  const { data: draft, error: fetchError } = await supabase
    .from('employment_applications')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  if (fetchError || !draft) return { error: 'No draft found. Please save your form first.' };

  const required = [
    'full_name', 'ic_or_passport', 'gender', 'age', 'nationality',
    'race', 'religion', 'date_of_birth', 'phone_mobile', 'email',
    'residential_address', 'country', 'marital_status',
  ];
  const missing = required.filter((f) => !draft[f]);
  if (missing.length > 0) {
    const labels = {
      full_name: 'Full Name', ic_or_passport: 'IC/Passport No', gender: 'Gender',
      age: 'Age', nationality: 'Nationality', race: 'Race', religion: 'Religion',
      date_of_birth: 'Date of Birth', phone_mobile: 'Mobile Phone', email: 'Email',
      residential_address: 'Residential Address', country: 'Country', marital_status: 'Marital Status',
    };
    return { error: `Please complete all required Personal Information fields: ${missing.map((f) => labels[f] || f).join(', ')}` };
  }

  const { error } = await supabase
    .from('employment_applications')
    .update({ status: 'submitted', submitted_at: new Date().toISOString() })
    .eq('auth_user_id', user.id);

  if (error) return { error: error.message };
  redirect('/ea/success');
}

export async function signOutApplicant() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect('/ea/login');
}

// ---------- Admin actions ----------

export async function getInterviewApplicants() {
  const applicants = await supabaseAdmin()
    .from('applicants')
    .select('id, name, email, position, status')
    .eq('status', 'Interview')
    .order('name', { ascending: true });

  if (applicants.error) return { error: applicants.error.message };

  // Check which ones have submitted an employment application
  const emails = (applicants.data || []).map((a) => a.email);
  const { data: apps } = await supabaseAdmin()
    .from('employment_applications')
    .select('email, status, submitted_at')
    .in('email', emails);

  const appMap = {};
  (apps || []).forEach((a) => { appMap[a.email] = a; });

  return {
    applicants: (applicants.data || []).map((a) => ({
      ...a,
      formStatus: appMap[a.email]?.status ?? null,
      submittedAt: appMap[a.email]?.submitted_at ?? null,
    })),
  };
}

export async function sendInvite(email) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-recruitment-drive.vercel.app';
  const { error } = await supabaseAdmin().auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?type=invite`,
  });
  if (error) return { error: error.message };
  return { success: true };
}

export async function resetApplicantPassword(email) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-recruitment-drive.vercel.app';
  // Uses the standard forgot-password email flow
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?type=recovery`,
  });
  if (error) return { error: error.message };
  return { success: true };
}
