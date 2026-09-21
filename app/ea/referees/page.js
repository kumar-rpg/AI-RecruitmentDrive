import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';
import RefereesForm from './RefereesForm';

export default async function RefereesPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/ea/login');

  const { data: draft } = await supabase
    .from('employment_applications')
    .select('referee_1, referee_2, contact_present_employer, contact_previous_employer, emergency_contact, status')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  return <RefereesForm initialData={draft} />;
}
