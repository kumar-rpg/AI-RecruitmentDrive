import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';
import EmploymentForm from './EmploymentForm';

export default async function EmploymentPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/ea/login');

  const { data: draft } = await supabase
    .from('employment_applications')
    .select('family_members, current_employment, previous_employment, status')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  return <EmploymentForm initialData={draft} />;
}
