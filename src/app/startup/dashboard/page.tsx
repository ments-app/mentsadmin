'use client';

import { useEffect, useState } from 'react';
import { getStartupDashboardStats } from '@/actions/startup-portal';
import { getMyProfile } from '@/actions/rbac';
import { Briefcase, Zap, CalendarDays, Trophy, Users, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function StartupDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [s, p] = await Promise.all([
        getStartupDashboardStats(),
        getMyProfile(),
      ]);
      setStats(s);
      setProfile(p);
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          {loading ? 'Welcome!' : `Welcome back, ${profile?.display_name ?? 'Startup'}!`}
        </h1>
        <div className="mt-2 flex items-center gap-2">
          <ShieldCheck size={14} className="text-green-500" />
          <span className="text-sm text-green-600 dark:text-green-400 font-medium">Verified Startup</span>
        </div>
      </div>

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

      {/* Scope reminder */}
      <div className="mt-8 rounded-xl border border-card-border bg-card-bg p-5">
        <h3 className="font-semibold text-foreground text-sm mb-2">Your Private Workspace</h3>
        <ul className="space-y-1 text-xs text-muted">
          <li>• You can only see jobs, gigs, events and competitions you created</li>
          <li>• Applications shown are only for your posts</li>
          <li>• Other startups&apos; data is not visible to you</li>
        </ul>
      </div>
    </div>
  );
}
