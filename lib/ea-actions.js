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

  // Always fetch the applicants row so position_applied stays current.
  // Use ilike for email so Supabase-normalized lowercase user.email matches
  // whatever case HR entered in the applicants table.
  const { data: applicant } = await supabaseAdmin()
    .from('applicants')
    .select('id, name, email, phone, position, org')
    .ilike('email', user.email)
    .eq('status', 'Interview')
    .maybeSingle();

  if (existing) {
    // Backfill any prefill fields that are empty — covers the case where the
    // draft was created before the applicants-lookup worked (e.g. case-mismatch
    // bug created a blank draft on first load).
    if (applicant) {
      const patch = {};
      if (!existing.full_name && applicant.name)         patch.full_name = applicant.name;
      if (!existing.phone_mobile && applicant.phone)     patch.phone_mobile = applicant.phone;
      if (!existing.position_applied && applicant.position) patch.position_applied = applicant.position;
      if (!existing.applicant_id && applicant.id)        patch.applicant_id = applicant.id;

      if (Object.keys(patch).length > 0) {
        await supabaseAdmin()
          .from('employment_applications')
          .update(patch)
          .eq('auth_user_id', user.id);
        return { ...existing, ...patch };
      }
    }
    return existing;
  }

  // First login — pre-fill from applicants table

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

  // Verify the email is on the Interview shortlist (ilike = case-insensitive)
  const { data: applicant, error: lookupError } = await supabaseAdmin()
    .from('applicants')
    .select('id')
    .ilike('email', email)
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

  // Fetch auth user IDs so the admin panel can set PINs directly
  const { data: authData } = await supabaseAdmin().auth.admin.listUsers({ perPage: 1000 });
  const authMap = {};
  (authData?.users || []).forEach((u) => { authMap[u.email] = u.id; });

  return {
    applicants: (applicants.data || []).map((a) => ({
      ...a,
      authUserId: authMap[a.email] ?? null,
      formStatus: appMap[a.email]?.status ?? null,
      submittedAt: appMap[a.email]?.submitted_at ?? null,
    })),
  };
}

export async function setApplicantPin(authUserId, newPin) {
  await requireAdmin();
  if (!authUserId) return { error: 'User not found.' };
  if (!/^\d{6}$/.test(newPin)) return { error: 'PIN must be exactly 6 digits.' };
  const { error } = await supabaseAdmin().auth.admin.updateUserById(authUserId, { password: newPin });
  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteApplicantApplication(authUserId) {
  await requireAdmin();
  if (!authUserId) return { error: 'User not found.' };

  // Fetch app row to check for a stored photo
  const { data: app } = await supabaseAdmin()
    .from('employment_applications')
    .select('photo_path')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  // Remove storage photo if one was uploaded
  if (app?.photo_path) {
    await supabaseAdmin().storage.from('applications').remove([app.photo_path]);
  }

  // Delete the form data
  await supabaseAdmin()
    .from('employment_applications')
    .delete()
    .eq('auth_user_id', authUserId);

  // Delete the auth user (removes login credentials)
  const { error } = await supabaseAdmin().auth.admin.deleteUser(authUserId);
  if (error) return { error: error.message };

  return { success: true };
}
