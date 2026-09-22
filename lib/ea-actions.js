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

// ---------- Registration ----------

export async function registerApplicant(email, pin) {
  if (!email || !pin) return { error: 'Email and PIN are required.' };
  if (!/^\d{6}$/.test(pin)) return { error: 'PIN must be exactly 6 digits.' };

  // Verify the email is on the Interview shortlist
  const { data: applicant, error: lookupError } = await supabaseAdmin()
    .from('applicants')
    .select('id')
    .eq('email', email)
    .eq('status', 'Interview')
    .maybeSingle();

  if (lookupError) return { error: 'Could not verify your email. Please try again.' };
  if (!applicant) return { error: 'This email is not on our Interview shortlist. Please contact HR.' };

  // Create the auth user (email_confirm: true skips the confirmation email)
  const { error: createError } = await supabaseAdmin().auth.admin.createUser({
    email,
    password: pin,
    email_confirm: true,
    app_metadata: { role: 'applicant' },
  });

  if (createError) {
    if (createError.message?.includes('already been registered') || createError.message?.includes('already exists')) {
      return { error: 'An account with this email already exists. Please use "Returning Applicant" to sign in.' };
    }
    return { error: createError.message };
  }

  return { success: true };
}

// ---------- Admin helpers ----------

async function requireAdmin() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  return user;
}

// ---------- Admin actions ----------

export async function getInterviewApplicants() {
  await requireAdmin();
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

export async function resetApplicantPin(email) {
  await requireAdmin();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-recruitment-drive.vercel.app';
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?type=recovery`,
  });
  if (error) return { error: error.message };
  return { success: true };
}
