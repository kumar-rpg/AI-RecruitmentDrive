import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';
import { getOrCreateDraft } from '@/lib/ea-actions';
import PersonalForm from './PersonalForm';

export default async function PersonalPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/ea/login');

  const draft = await getOrCreateDraft();

  return <PersonalForm initialData={draft} />;
}
