import { supabaseAdmin } from '@/lib/supabaseAdmin';
import ApplyForm from './ApplyForm';

// Positions can change any time an admin edits them in the dashboard, so this
// page must be rendered fresh per request rather than cached as static HTML
// at build time.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ApplyPage() {
  const { data: positions, error } = await supabaseAdmin()
    .from('positions')
    .select('id, title')
    .eq('is_active', true)
    .order('title', { ascending: true });

  if (error) {
    throw new Error('Could not load available positions: ' + error.message);
  }

  return <ApplyForm positions={positions || []} />;
}
