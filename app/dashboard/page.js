import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: applicants, error } = await supabaseAdmin()
    .from('applicants')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (error) {
    throw new Error('Could not load applicants: ' + error.message);
  }

  return <DashboardClient initialApplicants={applicants || []} userEmail={user.email} />;
}
