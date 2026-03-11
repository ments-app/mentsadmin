'use client';

import { useEffect, useState } from 'react';
import { getFacilitatorDashboardStats } from '@/actions/facilitators';
import { getMyProfile, getMyFacilitatorProfile } from '@/actions/rbac';
import { Briefcase, Zap, CalendarDays, Trophy, Users, Rocket, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface Stats {
  jobs: number;
  gigs: number;
  events: number;
  competitions: number;
  applications: number;
  startups: number;
}

export default function FacilitatorDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [fp, setFp] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [s, p, f] = await Promise.all([
        getFacilitatorDashboardStats(),
        getMyProfile(),
        getMyFacilitatorProfile(),
      ]);
      setStats(s);
      setProfile(p);
      setFp(f);
      setLoading(false);
    }
    load();
  }, []);

  const statCards = [
    { label: 'Verified Startups', value: stats?.startups, icon: Rocket, href: '/facilitator/startups', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Jobs Posted', value: stats?.jobs, icon: Briefcase, href: '/facilitator/jobs', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Gigs Posted', value: stats?.gigs, icon: Zap, href: '/facilitator/gigs', color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { label: 'Events', value: stats?.events, icon: CalendarDays, href: '/facilitator/events', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Competitions', value: stats?.competitions, icon: Trophy, href: '/facilitator/competitions', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { label: 'Applications', value: stats?.applications, icon: Users, href: '/facilitator/applications', color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20' },
  ];

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {loading ? 'Welcome back!' : `Welcome back, ${profile?.display_name ?? 'Facilitator'}!`}
        </h1>
        {fp && (
          <p className="mt-1 text-sm text-muted">
            {fp.organisation_name} · <span className="capitalize">{fp.organisation_type?.replace('_', ' ')}</span>
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className={`card-elevated p-5 stagger-${i + 1} animate-fade-in`}
            >
              <div className={`mb-3 inline-flex rounded-xl p-2.5 ${card.bg}`}>
                <Icon size={20} className={card.color} />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {loading ? '—' : (card.value ?? 0)}
              </p>
              <p className="mt-1 text-sm text-muted">{card.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Verify a Startup', href: '/facilitator/startups', icon: Rocket },
            { label: 'Post a Job', href: '/facilitator/jobs', icon: Briefcase },
            { label: 'Create an Event', href: '/facilitator/events', icon: CalendarDays },
            { label: 'Run a Competition', href: '/facilitator/competitions', icon: Trophy },
          ].map(action => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="card-elevated flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-foreground"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon size={15} className="text-primary" />
                </div>
                {action.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Ecosystem Note */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <TrendingUp size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Your Ecosystem</h3>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              You can only see data for startups you've verified and content you've created.
              Data from other facilitators is not accessible to you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
