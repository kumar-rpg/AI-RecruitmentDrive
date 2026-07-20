'use client';

import { createBrowserClient } from '@supabase/ssr';

// Browser client — uses the public anon key only. Safe to expose to the client.
// Used for: admin login/logout, and uploading files directly to Supabase
// Storage via short-lived signed upload URLs (never touches Vercel's function
// body-size limit, since large files go straight from the browser to Supabase).
export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
