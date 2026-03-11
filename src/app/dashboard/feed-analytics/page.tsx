import { getFeedAnalyticsSummary, getFeedAnalyticsDaily } from '@/actions/feed-analytics';
import { StatsOverview } from '@/components/analytics/StatsOverview';
import { EngagementChart } from '@/components/analytics/EngagementChart';
import Link from 'next/link';
import { BarChart3, FileText, FlaskConical, UserCheck } from 'lucide-react';

export default async function FeedAnalyticsPage() {
  let stats = {
    totalImpressions: 0,
    totalEngagements: 0,
    engagementRate: 0,
    avgDwellMs: 0,
    uniqueUsers: 0,
    avgFeedDepth: 0,
  };
  let dailyData: Array<{
    date: string;
    engagement_rate: number;
    total_impressions: number;
    total_engagements: number;
  }> = [];

  try {
    stats = await getFeedAnalyticsSummary(30);
    dailyData = await getFeedAnalyticsDaily(30);
  } catch (error) {
    console.error('Error loading feed analytics:', error);
  }

  const navLinks = [
    { href: '/dashboard/feed-analytics/content', label: 'Content', icon: FileText },
    { href: '/dashboard/feed-analytics/experiments', label: 'A/B Tests', icon: FlaskConical },
    { href: '/dashboard/feed-analytics/retention', label: 'Retention', icon: UserCheck },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <BarChart3 size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Feed Analytics</h1>
            <p className="text-sm text-muted">AI-powered feed engine performance metrics</p>
          </div>
        </div>
        <div className="flex gap-2">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="btn-secondary gap-2"
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <StatsOverview stats={stats} />

      {/* Engagement Chart */}
      <EngagementChart data={dailyData} />
    </div>
  );
}
