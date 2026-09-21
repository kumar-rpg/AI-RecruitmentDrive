'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseClient';

export default function ResetPinPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handlePinChange(setter) {
    return (e) => setter(e.target.value.replace(/\D/g, '').slice(0, 6));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (pin.length !== 6) { setError('PIN must be exactly 6 digits.'); return; }
    if (pin !== confirm) { setError('PINs do not match.'); return; }

    setSubmitting(true);
    const supabase = supabaseBrowser();
    const { error: updateError } = await supabase.auth.updateUser({ password: pin });
    setSubmitting(false);

    if (updateError) { setError(updateError.message); return; }

    router.push('/ea/personal');
    router.refresh();
  }

  return (
    <div className="wrap narrow">
      <header className="page-header">
        <div>
          <h1>Reset your PIN</h1>
          <div className="sub">CORTEX ROBOTICS — Employment Application</div>
        </div>
      </header>

      <form className="card" onSubmit={handleSubmit}>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: 0 }}>
          Choose a new 6-digit PIN. You&apos;ll use this to sign in to your application form.
        </p>

        <label htmlFor="new-pin">New 6-digit PIN</label>
        <input
          id="new-pin"
          type="password"
          inputMode="numeric"
          maxLength={6}
          pattern="[0-9]{6}"
          value={pin}
          onChange={handlePinChange(setPin)}
          autoComplete="new-password"
          placeholder="••••••"
          style={{ letterSpacing: '0.3em', fontSize: '1.2rem' }}
          required
        />

        <label htmlFor="confirm-pin">Confirm PIN</label>
        <input
          id="confirm-pin"
          type="password"
          inputMode="numeric"
          maxLength={6}
          pattern="[0-9]{6}"
          value={confirm}
          onChange={handlePinChange(setConfirm)}
          autoComplete="new-password"
          placeholder="••••••"
          style={{ letterSpacing: '0.3em', fontSize: '1.2rem' }}
          required
        />

        {error && <div className="err">{error}</div>}

        <button className="primary" type="submit" disabled={submitting} style={{ width: '100%' }}>
          {submitting ? 'Saving…' : 'Set PIN & Continue'}
        </button>
      </form>
    </div>
  );
}
