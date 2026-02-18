import { getRetentionMetrics } from '@/actions/feed-analytics';
import { RetentionCohort } from '@/components/analytics/RetentionCohort';
import Link from 'next/link';

export default async function RetentionPage() {
  let retention = {
    dau: 0,
    wau: 0,
    mau: 0,
    depthDistribution: {} as Record<string, number>,
  };

  try {
    retention = await getRetentionMetrics();
  } catch (error) {
    console.error('Error loading retention metrics:', error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sidebar-heading">User Retention</h1>
          <p className="text-sm text-sidebar-text/60 mt-1">DAU/WAU/MAU trends and session depth analysis</p>
        </div>
        <Link
          href="/dashboard/feed-analytics"
          className="px-4 py-2 text-sm font-medium rounded-lg border border-sidebar-border bg-sidebar-bg text-sidebar-text hover:bg-sidebar-hover transition-colors"
        >
          Back to Overview
        </Link>
      </div>

      <RetentionCohort
        dau={retention.dau}
        wau={retention.wau}
        mau={retention.mau}
        depthDistribution={retention.depthDistribution}
      />
    </div>
  );
}
