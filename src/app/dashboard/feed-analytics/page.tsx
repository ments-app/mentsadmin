import { getFeedAnalyticsSummary, getFeedAnalyticsDaily } from '@/actions/feed-analytics';
import { StatsOverview } from '@/components/analytics/StatsOverview';
import { EngagementChart } from '@/components/analytics/EngagementChart';
import Link from 'next/link';

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sidebar-heading">Feed Analytics</h1>
          <p className="text-sm text-sidebar-text/60 mt-1">AI-powered feed engine performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/feed-analytics/content"
            className="px-4 py-2 text-sm font-medium rounded-lg border border-sidebar-border bg-sidebar-bg text-sidebar-text hover:bg-sidebar-hover transition-colors"
          >
            Content
          </Link>
          <Link
            href="/dashboard/feed-analytics/experiments"
            className="px-4 py-2 text-sm font-medium rounded-lg border border-sidebar-border bg-sidebar-bg text-sidebar-text hover:bg-sidebar-hover transition-colors"
          >
            A/B Tests
          </Link>
          <Link
            href="/dashboard/feed-analytics/retention"
            className="px-4 py-2 text-sm font-medium rounded-lg border border-sidebar-border bg-sidebar-bg text-sidebar-text hover:bg-sidebar-hover transition-colors"
          >
            Retention
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <StatsOverview stats={stats} />

      {/* Engagement Chart */}
      <EngagementChart data={dailyData} />
    </div>
  );
}
