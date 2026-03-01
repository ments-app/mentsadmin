import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: { name: 'sb-admin-auth' },
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('error', 'auth_failed');
      return NextResponse.redirect(url);
    }

    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // 1. Already has admin_profiles → let middleware route them
      const { data: existingProfile } = await admin
        .from('admin_profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (existingProfile) {
        const url = req.nextUrl.clone();
        url.pathname = '/resolving';
        url.search = '';
        return NextResponse.redirect(url);
      }

      // 2. Check if they're a super_admin on the Ments platform
      const { data: mentsUser } = await admin
        .from('users')
        .select('id, role')
        .eq('id', user.id)
        .maybeSingle();

      if (mentsUser?.role === 'super_admin') {
        const url = req.nextUrl.clone();
        url.pathname = '/resolving';
        url.search = '';
        return NextResponse.redirect(url);
      }

      // 3. New user (with or without Ments account) → role selection
      const url = req.nextUrl.clone();
      url.pathname = '/onboarding';
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.searchParams.set('error', 'auth_failed');
  return NextResponse.redirect(loginUrl);
}
