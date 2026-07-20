'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { supabaseBrowser } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="wrap narrow">
      <header className="page-header">
        <div>
          <h1>Admin Login</h1>
          <div className="sub">CORTEX ROBOTICS — Review Dashboard</div>
        </div>
        <ThemeToggle />
      </header>

      <form className="card" onSubmit={handleSubmit}>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        {error && <div className="err">{error}</div>}

        <button className="primary" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
