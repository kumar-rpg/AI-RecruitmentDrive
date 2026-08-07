import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import PositionsManager from './PositionsManager';

export const metadata = {
  title: 'Manage Positions — CORTEX ROBOTICS',
};

export default async function PositionsPage() {
  // proxy.js already gates /dashboard/*, but this re-checks for the same
  // reason the Server Actions do: never trust a single gate.
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: positions, error } = await supabaseAdmin()
    .from('positions')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error('Could not load positions: ' + error.message);
  }

  return <PositionsManager initialPositions={positions || []} />;
}
