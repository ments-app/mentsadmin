import Sidebar from '@/components/Sidebar';
import { getSessionUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { Search, Bell } from 'lucide-react';

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

  const displayName = startupProfile?.brand_name ?? session.profile.display_name ?? session.email;
  const initials = (displayName ?? '?').charAt(0).toUpperCase();

  return (
    <div className="flex h-screen">
      <Sidebar
        role="startup"
        displayName={displayName}
        logoUrl={startupProfile?.logo_url ?? null}
        startupProfileId={startupProfile?.id ?? null}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-card-border bg-card-bg px-6">
          {/* Breadcrumb area */}
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="font-medium text-foreground">Startup</span>
            <span>/</span>
            <span>Dashboard</span>
          </div>

          {/* Right side: search, bell, avatar */}
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search..."
                className="h-9 w-56 rounded-lg border border-input-border bg-input-bg pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                readOnly
              />
            </div>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-hover hover:text-foreground">
              <Bell size={18} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
            </button>
            {startupProfile?.logo_url ? (
              <img
                src={startupProfile.logo_url}
                alt=""
                className="h-9 w-9 rounded-full object-cover ring-2 ring-primary/20"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary ring-2 ring-primary/20">
                {initials}
              </div>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="mx-auto max-w-7xl px-6 py-8 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
