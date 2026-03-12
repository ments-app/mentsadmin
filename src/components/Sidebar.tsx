'use client';

import { useState, useEffect, useCallback } from 'react';
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
  GraduationCap,
  PieChart,
  BadgeDollarSign,
  ChevronsLeft,
  Monitor,
  Sparkles,
  UserCog,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  exact?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

// ─── Grouped nav definitions per role ───────────────────────────

const SUPERADMIN_SECTIONS: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/dashboard/analytics', label: 'Analytics', icon: PieChart },
    ],
  },
  {
    title: 'MANAGE',
    items: [
      { href: '/dashboard/facilitators', label: 'Facilitators', icon: ShieldCheck },
      { href: '/dashboard/startups', label: 'Startups', icon: Rocket },
      { href: '/dashboard/investors', label: 'Investors', icon: BadgeDollarSign },
    ],
  },
  {
    title: 'CONTENT',
    items: [
      { href: '/dashboard/competitions', label: 'Competitions', icon: Trophy },
      { href: '/dashboard/jobs', label: 'Jobs', icon: Briefcase },
      { href: '/dashboard/gigs', label: 'Gigs', icon: Zap },
      { href: '/dashboard/events', label: 'Events', icon: CalendarDays },
      { href: '/dashboard/resources', label: 'Resources', icon: Package },
    ],
  },
  {
    title: 'MODERATION',
    items: [
      { href: '/dashboard/applications', label: 'Applications', icon: Users },
      { href: '/dashboard/trending', label: 'Trending', icon: TrendingUp },
      { href: '/dashboard/feed', label: 'Feed Moderation', icon: MessageSquare },
      { href: '/dashboard/feed-analytics', label: 'Feed Analytics', icon: BarChart3 },
    ],
  },
];

const FACILITATOR_SECTIONS: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      { href: '/facilitator/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    title: 'MANAGE',
    items: [
      { href: '/facilitator/profile', label: 'Profile', icon: Building2 },
      { href: '/facilitator/startups', label: 'My Startups', icon: Rocket },
      { href: '/facilitator/students', label: 'Student Access', icon: GraduationCap },
      { href: '/facilitator/team', label: 'Team', icon: UserCog },
    ],
  },
  {
    title: 'CONTENT',
    items: [
      { href: '/facilitator/jobs', label: 'Jobs', icon: Briefcase },
      { href: '/facilitator/gigs', label: 'Gigs', icon: Zap },
      { href: '/facilitator/events', label: 'Events', icon: CalendarDays },
      { href: '/facilitator/competitions', label: 'Competitions', icon: Trophy },
    ],
  },
  {
    title: 'OTHER',
    items: [
      { href: '/facilitator/applications', label: 'Applications', icon: Users },
    ],
  },
];

const STARTUP_SECTIONS: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      { href: '/startup/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/startup/profile', label: 'My Profile', icon: Building2 },
    ],
  },
  {
    title: 'CONTENT',
    items: [
      { href: '/startup/jobs', label: 'Jobs', icon: Briefcase },
      { href: '/startup/gigs', label: 'Gigs', icon: Zap },
      { href: '/startup/events', label: 'Events', icon: CalendarDays },
      { href: '/startup/competitions', label: 'Competitions', icon: Trophy },
    ],
  },
  {
    title: 'OTHER',
    items: [
      { href: '/startup/facilitators', label: 'Facilitators', icon: ShieldCheck },
      { href: '/startup/applications', label: 'Applications', icon: Users },
    ],
  },
];

// ─── Flat nav arrays (preserving original exports shape) ────────

const SUPERADMIN_NAV = SUPERADMIN_SECTIONS.flatMap((s) => s.items);
const FACILITATOR_NAV = FACILITATOR_SECTIONS.flatMap((s) => s.items);
const STARTUP_NAV = STARTUP_SECTIONS.flatMap((s) => s.items);

// ─── Constants ──────────────────────────────────────────────────

const SIDEBAR_STORAGE_KEY = 'ments-sidebar-collapsed';

// ─── Props ──────────────────────────────────────────────────────

interface SidebarProps {
  role?: 'superadmin' | 'facilitator' | 'startup';
  displayName?: string;
  orgName?: string;
  logoUrl?: string | null;
  startupProfileId?: string | null;
}

// ─── Tooltip wrapper for collapsed state ────────────────────────

function NavTooltip({
  label,
  collapsed,
  children,
}: {
  label: string;
  collapsed: boolean;
  children: React.ReactNode;
}) {
  if (!collapsed) return <>{children}</>;

  return (
    <div className="group/tooltip relative">
      {children}
      <div
        className={cn(
          'pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2',
          'rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-background',
          'opacity-0 transition-all duration-200 group-hover/tooltip:opacity-100 group-hover/tooltip:ml-2',
          'whitespace-nowrap shadow-xl'
        )}
      >
        {label}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-foreground" />
      </div>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────

export default function Sidebar({
  role = 'superadmin',
  displayName,
  orgName,
  logoUrl,
  startupProfileId,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored === 'true') setCollapsed(true);
    setMounted(true);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const sections =
    role === 'facilitator'
      ? FACILITATOR_SECTIONS
      : role === 'startup'
        ? STARTUP_SECTIONS
        : SUPERADMIN_SECTIONS;

  const roleLabel =
    role === 'superadmin'
      ? 'Super Admin'
      : role === 'facilitator'
        ? 'Facilitator'
        : 'Startup';

  const roleColor =
    role === 'superadmin'
      ? 'bg-primary'
      : role === 'facilitator'
        ? 'bg-emerald-500'
        : 'bg-orange-500';

  const roleBadgeColor =
    role === 'superadmin'
      ? 'bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary'
      : role === 'facilitator'
        ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400'
        : 'bg-orange-500/10 text-orange-600 dark:bg-orange-400/10 dark:text-orange-400';

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const initials = (displayName ?? orgName ?? '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (!mounted) {
    return <aside className="flex h-screen w-64 shrink-0 flex-col bg-sidebar-bg" />;
  }

  return (
    <aside
      style={{ width: collapsed ? 72 : 260 }}
      className={cn(
        'group/sidebar relative flex h-screen shrink-0 flex-col',
        'bg-sidebar-bg text-sidebar-text',
        'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
        'border-r border-sidebar-border'
      )}
    >
      {/* ── Gradient accent line at top ────────────────────────── */}
      <div className={cn('h-[2px] w-full shrink-0', roleColor)} />

      {/* ── Header: Brand + Collapse Toggle ──────────────────── */}
      <div
        className={cn(
          'flex h-[60px] shrink-0 items-center',
          collapsed ? 'justify-center px-3' : 'justify-between px-5'
        )}
      >
        {!collapsed ? (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
              'shadow-lg shadow-primary/20',
              roleColor
            )}>
              <Sparkles size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold tracking-tight text-sidebar-heading leading-none">
                Ments
              </h1>
              <p className="text-[11px] text-muted mt-0.5">Admin Console</p>
            </div>
          </div>
        ) : (
          <div className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            'shadow-lg shadow-primary/20',
            roleColor
          )}>
            <Sparkles size={18} className="text-white" />
          </div>
        )}

        {!collapsed && (
          <button
            onClick={toggleCollapsed}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-lg shrink-0',
              'text-muted/50 hover:text-sidebar-heading hover:bg-sidebar-hover',
              'transition-all duration-200'
            )}
            aria-label="Collapse sidebar"
          >
            <ChevronsLeft size={15} />
          </button>
        )}
      </div>

      {/* ── User / Org Card ──────────────────────────────────── */}
      <div className={cn('shrink-0', collapsed ? 'px-2 pb-2' : 'px-4 pb-3')}>
        <div
          className={cn(
            'relative overflow-hidden rounded-xl transition-all duration-300',
            'border border-sidebar-border',
            collapsed ? 'p-2' : 'p-3'
          )}
        >
          {/* Subtle gradient bg on the card */}
          {!collapsed && (
            <div className={cn(
              'absolute inset-0 opacity-[0.03]',
              roleColor
            )} />
          )}

          <div className={cn(
            'relative flex items-center',
            collapsed ? 'justify-center' : 'gap-3'
          )}>
            {/* Avatar */}
            {role === 'startup' && logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                className={cn(
                  'shrink-0 rounded-xl object-cover ring-2 ring-card-border',
                  collapsed ? 'h-9 w-9' : 'h-10 w-10'
                )}
              />
            ) : (
              <div
                className={cn(
                  'flex shrink-0 items-center justify-center rounded-xl font-bold',
                  'text-white shadow-md',
                  roleColor,
                  collapsed ? 'h-9 w-9 text-xs' : 'h-10 w-10 text-sm'
                )}
              >
                {initials}
              </div>
            )}

            {/* Info */}
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-sidebar-heading leading-tight">
                  {displayName ?? orgName ?? 'Admin'}
                </p>
                {orgName && displayName ? (
                  <p className="truncate text-[11px] text-muted mt-0.5">{orgName}</p>
                ) : (
                  <span className={cn(
                    'inline-flex items-center mt-1 rounded-md px-1.5 py-0.5',
                    'text-[10px] font-semibold uppercase tracking-wider',
                    roleBadgeColor
                  )}>
                    {roleLabel}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Role badge when both name and org shown */}
          {!collapsed && orgName && displayName && (
            <div className="relative mt-2 pt-2 border-t border-sidebar-border/50">
              <span className={cn(
                'inline-flex items-center rounded-md px-1.5 py-0.5',
                'text-[10px] font-semibold uppercase tracking-wider',
                roleBadgeColor
              )}>
                {roleLabel}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Expand button when collapsed ─────────────────────── */}
      {collapsed && (
        <div className="px-2 pb-2">
          <button
            onClick={toggleCollapsed}
            className={cn(
              'flex h-8 w-full items-center justify-center rounded-lg',
              'text-muted/50 hover:text-sidebar-heading hover:bg-sidebar-hover',
              'transition-all duration-200 rotate-180'
            )}
            aria-label="Expand sidebar"
          >
            <ChevronsLeft size={15} />
          </button>
        </div>
      )}

      {/* ── Navigation ───────────────────────────────────────── */}
      <nav
        className={cn(
          'flex-1 overflow-y-auto overflow-x-hidden',
          'py-1',
          collapsed ? 'px-2' : 'px-3'
        )}
      >
        {sections.map((section, sIdx) => (
          <div key={section.title} className={cn(sIdx > 0 && (collapsed ? 'mt-3' : 'mt-5'))}>
            {/* Section header */}
            {!collapsed && (
              <div className="mb-2 flex items-center gap-2 px-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted/40">
                  {section.title}
                </span>
                <div className="h-px flex-1 bg-sidebar-border/40" />
              </div>
            )}
            {collapsed && sIdx > 0 && (
              <div className="mx-auto mb-3 h-px w-5 bg-sidebar-border/60 rounded-full" />
            )}

            {/* Nav items */}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, item.exact);

                return (
                  <NavTooltip
                    key={item.href}
                    label={item.label}
                    collapsed={collapsed}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        'group/navitem relative flex items-center rounded-xl',
                        'text-[13px] font-medium',
                        'transition-all duration-200 ease-out',
                        collapsed
                          ? 'h-10 w-full justify-center'
                          : 'gap-3 px-3 py-[9px]',
                        active
                          ? cn(
                              'bg-primary/10',
                              'text-primary shadow-sm shadow-primary/5'
                            )
                          : cn(
                              'text-sidebar-text/60',
                              'hover:bg-sidebar-hover hover:text-sidebar-heading',
                              'hover:shadow-sm'
                            )
                      )}
                    >
                      {/* Active accent bar */}
                      {active && (
                        <div
                          className={cn(
                            'absolute left-0 top-1/2 -translate-y-1/2',
                            'h-6 w-[3px] rounded-r-full',
                            'bg-primary',
                            'shadow-sm shadow-primary/30'
                          )}
                        />
                      )}

                      {/* Icon container */}
                      <div
                        className={cn(
                          'flex shrink-0 items-center justify-center',
                          'transition-all duration-200',
                          collapsed && 'h-5 w-5',
                          active
                            ? 'text-primary'
                            : 'text-muted/60 group-hover/navitem:text-sidebar-heading'
                        )}
                      >
                        <Icon
                          size={collapsed ? 19 : 17}
                          strokeWidth={active ? 2.2 : 1.8}
                        />
                      </div>

                      {!collapsed && (
                        <span className={cn(
                          'truncate transition-all duration-200',
                          active && 'font-semibold'
                        )}>
                          {item.label}
                        </span>
                      )}

                      {/* Hover indicator dot for collapsed */}
                      {collapsed && active && (
                        <div className="absolute -right-0.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary shadow-sm shadow-primary/50" />
                      )}
                    </Link>
                  </NavTooltip>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer: Theme Toggle + Logout ────────────────────── */}
      <div
        className={cn(
          'shrink-0 border-t border-sidebar-border/60',
          collapsed ? 'p-2 space-y-1' : 'p-3 space-y-2'
        )}
      >
        {/* Theme segmented control */}
        <div
          className={cn(
            'flex rounded-xl p-1',
            'bg-sidebar-hover/80 dark:bg-sidebar-hover',
            collapsed && 'flex-col'
          )}
        >
          {[
            { key: 'light' as const, icon: Sun, label: 'Light' },
            { key: 'dark' as const, icon: Moon, label: 'Dark' },
            { key: 'auto' as const, icon: Monitor, label: 'Auto' },
          ].map(({ key, icon: ThemeIcon, label: themeLabel }) => {
            const isActiveTheme = key === 'auto' ? false : theme === key;
            return (
              <button
                key={key}
                onClick={() => {
                  if (key === 'auto') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    setTheme(prefersDark ? 'dark' : 'light');
                  } else {
                    setTheme(key);
                  }
                }}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-[7px] text-xs font-medium',
                  'transition-all duration-250',
                  isActiveTheme
                    ? cn(
                        'bg-card-bg text-sidebar-heading',
                        'shadow-sm ring-1 ring-card-border/50'
                      )
                    : 'text-muted/60 hover:text-sidebar-text'
                )}
                aria-label={`${themeLabel} mode`}
              >
                <ThemeIcon size={13} strokeWidth={isActiveTheme ? 2.2 : 1.8} />
                {!collapsed && <span>{themeLabel}</span>}
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <NavTooltip label="Logout" collapsed={collapsed}>
          <button
            onClick={handleLogout}
            className={cn(
              'flex w-full items-center rounded-xl text-[13px] font-medium',
              'text-muted/60 transition-all duration-200',
              'hover:bg-danger/10 hover:text-danger',
              collapsed
                ? 'h-10 justify-center'
                : 'gap-3 px-3 py-[9px]'
            )}
          >
            <LogOut size={17} strokeWidth={1.8} className="shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </NavTooltip>
      </div>
    </aside>
  );
}
