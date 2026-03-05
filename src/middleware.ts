import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let supabaseResponse = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: 'sb-admin-auth' },
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = req.nextUrl;

  function redirect(path: string) {
    const url = req.nextUrl.clone();
    url.pathname = path;
    url.search = '';
    return NextResponse.redirect(url);
  }

  // ─── Static / public paths ───────────────────────────────
  if (pathname.startsWith('/auth') || pathname.startsWith('/api')) return supabaseResponse;

  // ─── Root redirect ────────────────────────────────────────
  if (pathname === '/') {
    return redirect(user ? '/resolving' : '/login');
  }

  // ─── Unauthenticated guard ────────────────────────────────
  const protectedPrefixes = ['/dashboard', '/facilitator', '/startup', '/onboarding', '/resolving'];
  const isProtected = protectedPrefixes.some(p => pathname.startsWith(p));

  if (!user && isProtected) return redirect('/login');
  if (!user) return supabaseResponse;

  // ─── Authenticated: fetch role from admin_profiles ────────
  // Use anon key with user's session — RLS allows users to read own row
  let profile: { role: string; verification_status: string } | null = null;

  const { data } = await supabase
    .from('admin_profiles')
    .select('role, verification_status')
    .eq('id', user.id)
    .single();

  profile = data ?? null;

  // ─── No admin_profiles row — check if super admin via users table ────
  if (!profile) {
    const { data: userRecord } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userRecord?.role === 'super_admin') {
      if (pathname === '/login') return redirect('/dashboard');
      if (pathname.startsWith('/dashboard')) return supabaseResponse;
      return redirect('/dashboard');
    }

    if (pathname.startsWith('/onboarding') || pathname === '/login') return supabaseResponse;
    return redirect('/onboarding');
  }

  const { role, verification_status: status } = profile;

  // ─── Redirect away from login if authenticated ────────────
  if (pathname === '/login') {
    return redirect(getRoleHome(role, status));
  }

  // ─── Resolving redirect (from root) ──────────────────────
  if (pathname === '/resolving') {
    return redirect(getRoleHome(role, status));
  }

  // ─── SuperAdmin: can only access /dashboard ───────────────
  if (role === 'superadmin') {
    if (pathname.startsWith('/dashboard')) return supabaseResponse;
    return redirect('/dashboard');
  }

  // ─── Facilitator routing ──────────────────────────────────
  if (role === 'facilitator') {
    if (status === 'approved') {
      if (pathname.startsWith('/facilitator')) return supabaseResponse;
      if (pathname.startsWith('/onboarding')) return supabaseResponse;
      // Allow facilitators to use shared create/edit forms
      if (pathname.startsWith('/dashboard/jobs/')) return supabaseResponse;
      if (pathname.startsWith('/dashboard/gigs/')) return supabaseResponse;
      if (pathname.startsWith('/dashboard/events/')) return supabaseResponse;
      if (pathname.startsWith('/dashboard/competitions/')) return supabaseResponse;
      return redirect('/facilitator/dashboard');
    }
    // Pending / rejected / suspended
    if (pathname.startsWith('/pending-verification')) return supabaseResponse;
    if (pathname.startsWith('/onboarding/facilitator')) return supabaseResponse;
    return redirect('/pending-verification');
  }

  // ─── Startup routing ─────────────────────────────────────
  // No verification step — startups are auto-approved on login
  if (role === 'startup') {
    if (pathname.startsWith('/startup')) return supabaseResponse;
    if (pathname.startsWith('/onboarding')) return supabaseResponse;
    // Allow startups to use admin create/edit forms for their own content
    if (pathname.startsWith('/dashboard/jobs/')) return supabaseResponse;
    if (pathname.startsWith('/dashboard/gigs/')) return supabaseResponse;
    if (pathname.startsWith('/dashboard/events/')) return supabaseResponse;
    if (pathname.startsWith('/dashboard/competitions/')) return supabaseResponse;
    // Redirect admin list pages to startup equivalents
    if (pathname === '/dashboard/jobs') return redirect('/startup/jobs');
    if (pathname === '/dashboard/gigs') return redirect('/startup/gigs');
    if (pathname === '/dashboard/events') return redirect('/startup/events');
    if (pathname === '/dashboard/competitions') return redirect('/startup/competitions');
    return redirect('/startup/dashboard');
  }

  return supabaseResponse;
}

function getRoleHome(role: string, status: string): string {
  if (role === 'superadmin') return '/dashboard';
  if (role === 'facilitator') return status === 'approved' ? '/facilitator/dashboard' : '/pending-verification';
  if (role === 'startup') return '/startup/dashboard';
  return '/onboarding';
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
