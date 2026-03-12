'use client';

import { Eye, MousePointer, Clock, Users, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/cn';

interface StatsOverviewProps {
  stats: {
    totalImpressions: number;
    totalEngagements: number;
    engagementRate: number;
    avgDwellMs: number;
    uniqueUsers: number;
    avgFeedDepth: number;
  };
}

const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

export function StatsOverview({ stats }: StatsOverviewProps) {
  const cards = [
    { label: 'Total Impressions', value: formatNumber(stats.totalImpressions), icon: Eye, color: 'text-blue-500' },
    { label: 'Engagement Rate', value: `${stats.engagementRate}%`, icon: MousePointer, color: 'text-green-500' },
    { label: 'Avg Dwell Time', value: `${(stats.avgDwellMs / 1000).toFixed(1)}s`, icon: Clock, color: 'text-purple-500' },
    { label: 'Active Users', value: formatNumber(stats.uniqueUsers), icon: Users, color: 'text-orange-500' },
    { label: 'Avg Feed Depth', value: stats.avgFeedDepth.toString(), icon: TrendingUp, color: 'text-pink-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="card-elevated group p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {card.label}
              </p>
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                  'bg-primary/10',
                  'ring-1 ring-primary/10',
                  'transition-transform duration-200 group-hover:scale-110'
                )}
              >
                <Icon size={16} className={card.color} />
              </div>
            </div>
            <p className="text-3xl font-bold tracking-tight text-foreground">
              {card.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
