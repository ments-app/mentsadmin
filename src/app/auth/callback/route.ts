import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createAdminClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/login';

  const cookieNames = req.cookies.getAll().map(c => c.name);
  console.log('[auth/callback] URL:', req.url);
  console.log('[auth/callback] Code present:', !!code);
  console.log('[auth/callback] Cookies:', cookieNames.join(', '));
  console.log('[auth/callback] Has code verifier:', cookieNames.some(n => n.includes('code-verifier')));

  if (!code) {
    console.error('[auth/callback] No code param');
    loginUrl.searchParams.set('error', 'auth_failed');
    return NextResponse.redirect(loginUrl);
  }

  try {
    const supabase = await createAuthClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('[auth/callback] Code exchange failed:', error.message, JSON.stringify(error));
      loginUrl.searchParams.set('error', 'auth_failed');
      return NextResponse.redirect(loginUrl);
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('[auth/callback] getUser failed:', userError?.message);
      loginUrl.searchParams.set('error', 'auth_failed');
      return NextResponse.redirect(loginUrl);
    }

    const admin = createAdminClient();

    // 1. Already has admin_profiles → let middleware route them
    const { data: existingProfile, error: profileError } = await admin
      .from('admin_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('[auth/callback] admin_profiles query failed:', profileError.message);
    }

    if (existingProfile) {
      const url = req.nextUrl.clone();
      url.pathname = '/resolving';
      url.search = '';
      return NextResponse.redirect(url);
    }

    // 2. Check if they're a super_admin on the Ments platform
    const { data: mentsUser, error: mentsError } = await admin
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (mentsError) {
      console.error('[auth/callback] users query failed:', mentsError.message);
    }

    if (mentsUser?.role === 'super_admin') {
      const { error: upsertError } = await admin.from('admin_profiles').upsert({
        id: user.id,
        role: 'superadmin',
        verification_status: 'approved',
        email: user.email ?? '',
        display_name: user.user_metadata?.full_name ?? user.email ?? '',
      }, { onConflict: 'id' });

      if (upsertError) {
        console.error('[auth/callback] admin_profiles upsert failed:', upsertError.message);
      }

      const url = req.nextUrl.clone();
      url.pathname = '/resolving';
      url.search = '';
      return NextResponse.redirect(url);
    }

    // 3. Check if they were invited as a facilitator co-admin
    const { data: teamInvite } = await admin
      .from('facilitator_team_members')
      .select('id, facilitator_id, display_name')
      .eq('email', (user.email ?? '').toLowerCase())
      .eq('status', 'pending')
      .maybeSingle();

    if (teamInvite) {
      await admin.from('admin_profiles').upsert({
        id: user.id,
        role: 'facilitator',
        verification_status: 'approved',
        email: user.email ?? '',
        display_name: teamInvite.display_name ?? user.user_metadata?.full_name ?? user.email ?? '',
        parent_facilitator_id: teamInvite.facilitator_id,
      }, { onConflict: 'id' });

      await admin.from('facilitator_team_members').update({
        user_id: user.id,
        status: 'active',
        accepted_at: new Date().toISOString(),
      }).eq('id', teamInvite.id);

      const url = req.nextUrl.clone();
      url.pathname = '/resolving';
      url.search = '';
      return NextResponse.redirect(url);
    }

    // 4. New user → role selection
    const url = req.nextUrl.clone();
    url.pathname = '/onboarding';
    url.search = '';
    return NextResponse.redirect(url);
  } catch (err) {
    console.error('[auth/callback] Unexpected error:', err);
    loginUrl.searchParams.set('error', 'auth_failed');
    return NextResponse.redirect(loginUrl);
  }
}
