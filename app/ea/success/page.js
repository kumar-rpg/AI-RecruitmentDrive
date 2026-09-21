import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';
import Link from 'next/link';

export default async function SuccessPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/ea/login');

  const { data: app } = await supabase
    .from('employment_applications')
    .select('full_name, position_applied, submitted_at, status')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (!app || app.status !== 'submitted') redirect('/ea/declaration');

  const submittedDate = app.submitted_at
    ? new Date(app.submitted_at).toLocaleDateString('en-MY', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  return (
    <div className="wrap narrow" style={{ maxWidth: 560 }}>
      <div className="card" style={{ textAlign: 'center', padding: '40px 28px' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
        <h1 style={{ fontSize: '1.4rem', marginBottom: 8 }}>Application Submitted</h1>
        {app.full_name && (
          <p style={{ color: 'var(--muted)', marginTop: 0, marginBottom: 4 }}>
            Thank you, <strong style={{ color: 'var(--text)' }}>{app.full_name}</strong>.
          </p>
        )}
        {app.position_applied && (
          <p style={{ color: 'var(--muted)', marginTop: 0 }}>
            Position: <strong style={{ color: 'var(--text)' }}>{app.position_applied}</strong>
          </p>
        )}
        {submittedDate && (
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Submitted on {submittedDate}</p>
        )}
        <div style={{
          background: 'rgba(126,231,135,0.08)', border: '1px solid rgba(126,231,135,0.3)',
          borderRadius: 8, padding: '14px 16px', margin: '20px 0', textAlign: 'left',
          fontSize: '0.9rem',
        }}>
          <strong style={{ color: 'var(--accent2)' }}>What happens next?</strong>
          <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--text)', lineHeight: 1.7 }}>
            <li>Our HR team will review your application.</li>
            <li>You will be contacted via email or phone if shortlisted.</li>
          </ul>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
          You can log back in at any time to review your submitted form.
        </p>
        <Link href="/ea/personal" className="ghost-link" style={{ marginTop: 12, display: 'inline-block' }}>
          Review My Application
        </Link>
      </div>
    </div>
  );
}
