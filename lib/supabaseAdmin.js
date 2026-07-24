import { createClient } from '@supabase/supabase-js';

// SERVER-ONLY. Uses the service role key, which bypasses Row Level Security.
// Never import this file from a component marked 'use client'.
let adminClient = null;

export function supabaseAdmin() {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.'
    );
  }

  adminClient = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      // Next.js patches global fetch to cache requests by default. Supabase's
      // client doesn't set a cache directive itself, so without this every
      // query here could get served stale from Next's Data Cache — e.g. the
      // positions dropdown not picking up a change made seconds ago in the
      // dashboard. Force every admin request to skip that cache entirely.
      fetch: (url, options = {}) => fetch(url, { ...options, cache: 'no-store' }),
    },
  });

  return adminClient;
}
