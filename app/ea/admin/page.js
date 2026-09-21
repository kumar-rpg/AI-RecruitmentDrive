import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';
import { getInterviewApplicants } from '@/lib/ea-actions';
import AdminClient from './AdminClient';

export default async function EaAdminPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { applicants, error } = await getInterviewApplicants();

  return (
    <div className="wrap">
      <header className="page-header">
        <div>
          <h1>Employment Application — Admin</h1>
          <div className="sub">Send invites and manage applicant access</div>
        </div>
        <a href="/dashboard" className="ghost-link">← Dashboard</a>
      </header>

      {error && <div className="err" style={{ marginBottom: 16 }}>{error}</div>}

      <AdminClient applicants={applicants || []} />
    </div>
  );
}
