import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Session-aware server client — respects the logged-in user's cookies and
// Row Level Security. Used in Server Components, Server Actions, and Route
// Handlers to check "who is making this request" (e.g. is the admin logged in).
export function supabaseServer() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render — safe to ignore because
            // middleware.js refreshes the session cookie on every request.
          }
        },
      },
    }
  );
}
