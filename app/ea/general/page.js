import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';
import GeneralForm from './GeneralForm';

export default async function GeneralPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/ea/login');

  const { data: draft } = await supabase
    .from('employment_applications')
    .select(`expected_salary, notice_period_months, expected_join_date,
             vacancy_source, vacancy_source_employee_name, vacancy_source_agency,
             criminal_conviction, criminal_conviction_details,
             health_condition, health_condition_details,
             is_pregnant, pregnancy_due_date, cortex_connections, position_applied, gender, status`)
    .eq('auth_user_id', user.id)
    .maybeSingle();

  return <GeneralForm initialData={draft} />;
}
