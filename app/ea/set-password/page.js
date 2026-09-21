'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseClient';

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const supabase = supabaseBrowser();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push('/ea/personal');
    router.refresh();
  }

  return (
    <div className="wrap narrow">
      <header className="page-header">
        <div>
          <h1>Set Your Password</h1>
          <div className="sub">CORTEX ROBOTICS — Employment Application</div>
        </div>
      </header>

      <form className="card" onSubmit={handleSubmit}>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: 0 }}>
          Create a password to secure your application. You&apos;ll use this to log back in if you
          need to continue later.
        </p>

        <label>New password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
        <div className="hint">Minimum 8 characters</div>

        <label>Confirm password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
        />

        {error && <div className="err">{error}</div>}

        <button className="primary" type="submit" disabled={submitting} style={{ width: '100%' }}>
          {submitting ? 'Saving…' : 'Set Password & Continue'}
        </button>
      </form>
    </div>
  );
}
