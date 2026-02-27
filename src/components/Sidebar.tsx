'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/cn';
import { useTheme } from '@/components/ThemeProvider';
import {
  LayoutDashboard,
  Trophy,
  Briefcase,
  Zap,
  CalendarDays,
  Package,
  LogOut,
  Sun,
  Moon,
  Users,
  BarChart3,
  TrendingUp,
  MessageSquare,
  Rocket,
  Building2,
  ShieldCheck,
} from 'lucide-react';

// ─── Nav definitions per role ──────────────────────────────────

const SUPERADMIN_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/facilitators', label: 'Facilitators', icon: ShieldCheck },
  { href: '/dashboard/startups', label: 'Startups', icon: Rocket },
  { href: '/dashboard/competitions', label: 'Competitions', icon: Trophy },
  { href: '/dashboard/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/dashboard/gigs', label: 'Gigs', icon: Zap },
  { href: '/dashboard/applications', label: 'Applications', icon: Users },
  { href: '/dashboard/events', label: 'Events', icon: CalendarDays },
  { href: '/dashboard/resources', label: 'Resources', icon: Package },
  { href: '/dashboard/trending', label: 'Trending', icon: TrendingUp },
  { href: '/dashboard/feed', label: 'Feed Moderation', icon: MessageSquare },
  { href: '/dashboard/feed-analytics', label: 'Feed Analytics', icon: BarChart3 },
];

const FACILITATOR_NAV = [
  { href: '/facilitator/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/facilitator/startups', label: 'My Startups', icon: Rocket },
  { href: '/facilitator/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/facilitator/gigs', label: 'Gigs', icon: Zap },
  { href: '/facilitator/events', label: 'Events', icon: CalendarDays },
  { href: '/facilitator/competitions', label: 'Competitions', icon: Trophy },
  { href: '/facilitator/applications', label: 'Applications', icon: Users },
];

const STARTUP_NAV = [
  { href: '/startup/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/startup/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/startup/gigs', label: 'Gigs', icon: Zap },
  { href: '/startup/events', label: 'Events', icon: CalendarDays },
  { href: '/startup/competitions', label: 'Competitions', icon: Trophy },
  { href: '/startup/applications', label: 'Applications', icon: Users },
];

// ─── Props ──────────────────────────────────────────────────────

interface SidebarProps {
  role?: 'superadmin' | 'facilitator' | 'startup';
  displayName?: string;
  orgName?: string;
}

export default function Sidebar({ role = 'superadmin', displayName, orgName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const navItems =
    role === 'facilitator' ? FACILITATOR_NAV :
    role === 'startup' ? STARTUP_NAV :
    SUPERADMIN_NAV;

  const roleLabel =
    role === 'superadmin' ? 'Super Admin' :
    role === 'facilitator' ? 'Facilitator' : 'Startup';

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar-bg text-sidebar-text">
      <div className="flex h-16 items-center gap-2 px-6">
        <h1 className="text-lg font-bold text-sidebar-heading">Ments</h1>
        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
          {roleLabel}
        </span>
      </div>

      {(displayName || orgName) && (
        <div className="mx-3 mb-2 rounded-lg bg-sidebar-hover px-3 py-2">
          <p className="text-xs font-medium text-sidebar-text truncate">{displayName ?? orgName}</p>
          {orgName && displayName && (
            <p className="text-xs text-sidebar-text/50 truncate">{orgName}</p>
          )}
        </div>
      )}

      <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-active/20 text-sidebar-active'
                  : 'text-sidebar-text/70 hover:bg-sidebar-hover hover:text-sidebar-text'
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-text/70 transition-colors hover:bg-sidebar-hover hover:text-sidebar-text"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-text/70 transition-colors hover:bg-sidebar-hover hover:text-sidebar-text"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
