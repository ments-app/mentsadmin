import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createAdminClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createAuthClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('error', 'auth_failed');
      return NextResponse.redirect(url);
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const admin = createAdminClient();

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
        await admin.from('admin_profiles').upsert({
          id: user.id,
          role: 'superadmin',
          verification_status: 'approved',
          email: user.email ?? '',
          display_name: user.user_metadata?.full_name ?? user.email ?? '',
        }, { onConflict: 'id' });

        const url = req.nextUrl.clone();
        url.pathname = '/resolving';
        url.search = '';
        return NextResponse.redirect(url);
      }

      // 3. New user → role selection
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
