import { supabaseAdmin } from '@/lib/supabaseAdmin';
import MobileClient from './MobileClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MobilePage() {
  const { data: applicants, error } = await supabaseAdmin()
    .from('applicants')
    .select('status')
    .order('submitted_at', { ascending: false });

  if (error) {
    throw new Error('Could not load applicants: ' + error.message);
  }

  return <MobileClient applicants={applicants || []} />;
}
