'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseClient';
import { Suspense } from 'react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(
    searchParams.get('error') === 'auth' ? 'Invalid or expired link. Please log in.' : ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetting, setResetting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const supabase = supabaseBrowser();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setSubmitting(false);

    if (signInError) {
      setError('Login failed — check your email and password.');
      return;
    }

    router.push('/ea/personal');
    router.refresh();
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setResetting(true);
    const siteUrl = window.location.origin;
    const supabase = supabaseBrowser();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      resetEmail.trim(),
      { redirectTo: `${siteUrl}/auth/callback?type=recovery` }
    );
    setResetting(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setResetSent(true);
  }

  return (
    <div className="wrap narrow">
      <header className="page-header">
        <div>
          <h1>Employment Application</h1>
          <div className="sub">CORTEX ROBOTICS — Sign in to continue your form</div>
        </div>
      </header>

      {!showReset ? (
        <form className="card" onSubmit={handleSubmit}>
          <label>Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {error && <div className="err">{error}</div>}

          <button className="primary" type="submit" disabled={submitting} style={{ width: '100%' }}>
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem' }}
              onClick={() => { setShowReset(true); setResetEmail(email); setError(''); }}
            >
              Forgot password?
            </button>
          </div>
        </form>
      ) : (
        <form className="card" onSubmit={handleForgotPassword}>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: 0 }}>
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>

          <label>Email address</label>
          <input
            type="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            autoComplete="username"
            required
          />

          {error && <div className="err">{error}</div>}
          {resetSent && (
            <div className="success-box">Reset email sent — check your inbox.</div>
          )}

          {!resetSent && (
            <button className="primary" type="submit" disabled={resetting} style={{ width: '100%' }}>
              {resetting ? 'Sending…' : 'Send Reset Email'}
            </button>
          )}

          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem' }}
              onClick={() => { setShowReset(false); setResetSent(false); setError(''); }}
            >
              ← Back to sign in
            </button>
          </div>
        </form>
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
