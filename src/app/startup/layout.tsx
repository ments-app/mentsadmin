import Sidebar from '@/components/Sidebar';
import { getSessionUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export default async function StartupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();

  if (!session?.profile) redirect('/login');

  const { role } = session.profile;

  if (role !== 'startup') {
    redirect(role === 'superadmin' ? '/dashboard' : '/facilitator/dashboard');
  }

  // Fetch startup profile for sidebar display
  const admin = createAdminClient();
  const { data: startupProfile } = await admin
    .from('startup_profiles')
    .select('id, brand_name, logo_url, stage')
    .eq('owner_id', session.authId)
    .maybeSingle();

  return (
    <div className="flex h-screen">
      <Sidebar
        role="startup"
        displayName={startupProfile?.brand_name ?? session.profile.display_name ?? session.email}
        logoUrl={startupProfile?.logo_url ?? null}
        startupProfileId={startupProfile?.id ?? null}
      />
      <main className="flex-1 overflow-y-auto bg-background p-8">
        {children}
      </main>
    </div>
  );
}
