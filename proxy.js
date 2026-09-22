import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // EA public routes — no auth check
  if (pathname === '/ea/login' || pathname === '/ea/set-password') {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect /dashboard
  if (pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protect /ea/* (except public routes handled above)
  if (pathname.startsWith('/ea') && !user) {
    return NextResponse.redirect(new URL('/ea/login', request.url));
  }

  // /ea/admin requires admin role
  if (pathname.startsWith('/ea/admin') && user?.app_metadata?.role !== 'admin') {
    return NextResponse.redirect(new URL('/ea/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/ea/:path*'],
};
