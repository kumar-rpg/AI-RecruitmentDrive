import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';
import DeclarationForm from './DeclarationForm';

export default async function DeclarationPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/ea/login');

  const { data: draft } = await supabase
    .from('employment_applications')
    .select('declaration_name, declaration_date, status')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  return <DeclarationForm initialData={draft} />;
}
