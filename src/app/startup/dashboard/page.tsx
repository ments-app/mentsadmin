'use client';

import { useEffect, useState } from 'react';
import { getStartupDashboardStats } from '@/actions/startup-portal';
import { getMyStartupSummary } from '@/actions/startup-profile';
import { Briefcase, Zap, CalendarDays, Trophy, Users, Building2, ArrowRight, MapPin, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const STAGE_LABELS: Record<string, string> = {
  ideation: 'Ideation',
  mvp: 'MVP',
  scaling: 'Scaling',
  expansion: 'Expansion',
  maturity: 'Maturity',
};

export default function StartupDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [startup, setStartup] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [s, sp] = await Promise.all([
        getStartupDashboardStats(),
        getMyStartupSummary(),
      ]);
      setStats(s);
      setStartup(sp);
      setLoading(false);
    }
    load();
  }, []);

  const statCards = [
    { label: 'Jobs Posted', value: stats?.jobs, icon: Briefcase, href: '/startup/jobs', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Gigs Posted', value: stats?.gigs, icon: Zap, href: '/startup/gigs', color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { label: 'Events', value: stats?.events, icon: CalendarDays, href: '/startup/events', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Competitions', value: stats?.competitions, icon: Trophy, href: '/startup/competitions', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { label: 'Applications', value: stats?.applications, icon: Users, href: '/startup/applications', color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20' },
  ];

  return (
    <div>
      {/* Startup profile hero */}
      {!loading && (
        <div className="mb-8 rounded-xl border border-card-border bg-card-bg p-5">
          {startup ? (
            <div className="flex items-center gap-4">
              {startup.logo_url ? (
                <img src={startup.logo_url} alt="" className="h-14 w-14 rounded-xl object-cover border border-card-border" />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl font-bold text-primary">
                  {startup.brand_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-foreground">{startup.brand_name}</h1>
                  {startup.stage && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {STAGE_LABELS[startup.stage] || startup.stage}
                    </span>
                  )}
                  {startup.is_actively_raising && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                      Raising
                    </span>
                  )}
                </div>
                {startup.tagline && (
                  <p className="mt-0.5 text-sm text-muted truncate">{startup.tagline}</p>
                )}
                {(startup.city || startup.country) && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                    <MapPin size={11} />
                    {[startup.city, startup.country].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
              <Link
                href="/startup/profile"
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-card-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary-light hover:text-primary"
              >
                View Profile <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Building2 size={24} className="text-primary" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground">Welcome to your dashboard</h1>
                <p className="mt-0.5 text-sm text-muted">Your startup profile isn't set up yet.</p>
              </div>
              <Link
                href="/startup/profile"
                className="ml-auto flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                Set up profile <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="mb-8 h-24 animate-pulse rounded-xl bg-card-border" />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-xl border border-card-border bg-card-bg p-5 hover:border-primary/40 transition-colors"
            >
              <div className={`mb-3 inline-flex rounded-lg p-2 ${card.bg}`}>
                <Icon size={18} className={card.color} />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {loading ? '—' : (card.value ?? 0)}
              </p>
              <p className="mt-1 text-xs text-muted">{card.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="mb-4 font-semibold text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Post a Job', href: '/startup/jobs', icon: Briefcase },
            { label: 'Post a Gig', href: '/startup/gigs', icon: Zap },
            { label: 'Create Event', href: '/startup/events', icon: CalendarDays },
            { label: 'Run Competition', href: '/startup/competitions', icon: Trophy },
          ].map(action => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 rounded-xl border border-card-border bg-card-bg px-4 py-3 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary transition-colors"
              >
                <Icon size={16} className="text-primary shrink-0" />
                {action.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Traction summary if available */}
      {!loading && startup?.traction_metrics && (
        <div className="mt-8 rounded-xl border border-card-border bg-card-bg p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={15} className="text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Traction</h3>
          </div>
          <p className="text-sm text-muted leading-relaxed">{startup.traction_metrics}</p>
        </div>
      )}
    </div>
  );
}
