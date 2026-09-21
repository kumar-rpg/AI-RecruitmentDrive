import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';
import EducationForm from './EducationForm';

export default async function EducationPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/ea/login');

  const { data: draft } = await supabase
    .from('employment_applications')
    .select('education, professional_training, languages, status')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  return <EducationForm initialData={draft} />;
}
