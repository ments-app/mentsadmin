import { getRetentionMetrics } from '@/actions/feed-analytics';
import { RetentionCohort } from '@/components/analytics/RetentionCohort';
import Link from 'next/link';
import { ArrowLeft, UserCheck } from 'lucide-react';

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
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <UserCheck size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">User Retention</h1>
            <p className="text-sm text-muted">DAU/WAU/MAU trends and session depth analysis</p>
          </div>
        </div>
        <Link
          href="/dashboard/feed-analytics"
          className="btn-secondary gap-2"
        >
          <ArrowLeft size={15} />
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
