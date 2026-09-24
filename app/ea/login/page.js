'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseClient';
import { registerApplicant } from '@/lib/ea-actions';
import { Suspense } from 'react';

function PinInput({ value, onChange, label, id, autoComplete }) {
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="password"
        inputMode="numeric"
        maxLength={6}
        pattern="[0-9]{6}"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        autoComplete={autoComplete}
        placeholder="••••••"
        style={{ letterSpacing: '0.3em', fontSize: '1.2rem' }}
        required
      />
      <div className="hint">6-digit numeric PIN</div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState('returning'); // 'new' | 'returning' | 'forgot'
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState(
    searchParams.get('error') === 'auth' ? 'Invalid or expired link. Please log in.' : ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  function switchMode(m) {
    setMode(m);
    setError('');
    setPin('');
    setConfirmPin('');
    setResetSent(false);
  }

  async function handleReturning(e) {
    e.preventDefault();
    setError('');
    if (pin.length !== 6) { setError('PIN must be exactly 6 digits.'); return; }
    setSubmitting(true);
    const supabase = supabaseBrowser();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pin,
    });
    setSubmitting(false);
    if (signInError) {
      setError('Incorrect email or PIN. Please try again.');
      return;
    }
    const { data: { user: signedInUser } } = await supabase.auth.getUser();
    const dest = signedInUser?.app_metadata?.role === 'admin' ? '/ea/admin' : '/ea/personal';
    router.push(dest);
  }

  async function handleNew(e) {
    e.preventDefault();
    setError('');
    if (pin.length !== 6) { setError('PIN must be exactly 6 digits.'); return; }
    if (pin !== confirmPin) { setError('PINs do not match.'); return; }
    setSubmitting(true);
    const result = await registerApplicant(email.trim(), pin);
    if (result?.error) {
      setSubmitting(false);
      setError(result.error);
      return;
    }
    // Registration succeeded — sign in immediately
    const supabase = supabaseBrowser();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pin,
    });
    setSubmitting(false);
    if (signInError) {
      setError('Account created but sign-in failed. Please use "Returning applicant" to log in.');
      return;
    }
    router.push('/ea/personal');
  }

  async function handleForgotPin(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const siteUrl = window.location.origin;
    const supabase = supabaseBrowser();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${siteUrl}/auth/callback?type=recovery` }
    );
    setSubmitting(false);
    if (resetError) { setError(resetError.message); return; }
    setResetSent(true);
  }

  return (
    <div className="wrap narrow">
      <header className="page-header">
        <div>
          <h1>Employment Application</h1>
          <div className="sub">CORTEX ROBOTICS — Access your application form</div>
        </div>
      </header>

      {mode === 'forgot' ? (
        <form className="card" onSubmit={handleForgotPin}>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: 0 }}>
            Enter your email address and we&apos;ll send you a link to reset your PIN.
          </p>
          <label>Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
          {error && <div className="err">{error}</div>}
          {resetSent ? (
            <div className="success-box">Reset email sent — check your inbox.</div>
          ) : (
            <button className="primary" type="submit" disabled={submitting} style={{ width: '100%' }}>
              {submitting ? 'Sending…' : 'Send Reset Email'}
            </button>
          )}
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem' }}
              onClick={() => switchMode('returning')}
            >
              ← Back to sign in
            </button>
          </div>
        </form>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {/* Tab toggle */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            {['returning', 'new'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                style={{
                  flex: 1,
                  padding: '14px 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: mode === m ? '2px solid var(--accent)' : '2px solid transparent',
                  color: mode === m ? 'var(--accent)' : 'var(--muted)',
                  fontWeight: mode === m ? 600 : 400,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  marginBottom: '-1px',
                }}
              >
                {m === 'returning' ? 'Returning Applicant' : 'New Applicant'}
              </button>
            ))}
          </div>

          <form
            style={{ padding: '24px' }}
            onSubmit={mode === 'returning' ? handleReturning : handleNew}
          >
            {mode === 'returning' ? (
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 0 }}>
                Already registered? Enter the email address and 6-digit PIN you set up when you first accessed your application.
              </p>
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 0 }}>
                First time here? Your email must be on the Interview shortlist. You&apos;ll create a 6-digit PIN to secure your application — you&apos;ll use this PIN every time you log in.
              </p>
            )}

            <label>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />

            <PinInput
              id="pin"
              label={mode === 'new' ? 'Create a 6-digit PIN' : '6-digit PIN'}
              value={pin}
              onChange={setPin}
              autoComplete={mode === 'new' ? 'new-password' : 'current-password'}
            />

            {mode === 'new' && (
              <PinInput
                id="confirm-pin"
                label="Confirm PIN"
                value={confirmPin}
                onChange={setConfirmPin}
                autoComplete="new-password"
              />
            )}

            {error && <div className="err">{error}</div>}

            <button className="primary" type="submit" disabled={submitting} style={{ width: '100%', marginTop: 8 }}>
              {submitting
                ? (mode === 'new' ? 'Creating account…' : 'Signing in…')
                : (mode === 'new' ? 'Create Account & Continue' : 'Sign In')}
            </button>

            {mode === 'returning' && (
              <div style={{ textAlign: 'center', marginTop: 14 }}>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem' }}
                  onClick={() => { switchMode('forgot'); }}
                >
                  Forgot PIN?
                </button>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}

export default function EaLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
