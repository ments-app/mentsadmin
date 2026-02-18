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
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/competitions', label: 'Competitions', icon: Trophy },
  { href: '/dashboard/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/dashboard/gigs', label: 'Gigs', icon: Zap },
  { href: '/dashboard/applications', label: 'Applications', icon: Users },
  { href: '/dashboard/events', label: 'Events', icon: CalendarDays },
  { href: '/dashboard/resources', label: 'Resources', icon: Package },
  { href: '/dashboard/feed-analytics', label: 'Feed Analytics', icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

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
      <div className="flex h-16 items-center px-6">
        <h1 className="text-lg font-bold text-sidebar-heading">Ments Admin</h1>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
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
