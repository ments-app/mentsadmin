import { getExperimentDetails } from '@/actions/feed-analytics';
import { ExperimentResults } from '@/components/analytics/ExperimentResults';
import Link from 'next/link';

export default async function ExperimentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let experimentData: {
    experiment: {
      id: string;
      name: string;
      description: string;
      status: string;
      variants: Array<{ id: string; name: string; weight: number; config: Record<string, number> }>;
      created_at: string;
      started_at: string | null;
      ended_at: string | null;
    } | null;
    variantCounts: Record<string, number>;
  } = { experiment: null, variantCounts: {} };

  try {
    experimentData = await getExperimentDetails(id);
  } catch (error) {
    console.error('Error loading experiment:', error);
  }

  if (!experimentData.experiment) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-sidebar-heading">Experiment Not Found</h1>
        <Link href="/dashboard/feed-analytics/experiments" className="text-sidebar-active hover:underline">
          Back to Experiments
        </Link>
      </div>
    );
  }

  const exp = experimentData.experiment;

  // Build mock variant results for display
  // In production, this would fetch from the results API
  const variantResults = (exp.variants || []).map((v) => ({
    variant_id: v.id,
    variant_name: v.name,
    sample_size: experimentData.variantCounts[v.id] || 0,
    metrics: {
      engagement_rate: { value: 0, ci_lower: 0, ci_upper: 0, is_significant: false },
      ctr: { value: 0, ci_lower: 0, ci_upper: 0, is_significant: false },
      avg_dwell_ms: { value: 0, ci_lower: 0, ci_upper: 0, is_significant: false },
      impressions: { value: 0, ci_lower: 0, ci_upper: 0, is_significant: false },
    },
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sidebar-heading">{exp.name}</h1>
          <p className="text-sm text-sidebar-text/60 mt-1">{exp.description}</p>
        </div>
        <Link
          href="/dashboard/feed-analytics/experiments"
          className="px-4 py-2 text-sm font-medium rounded-lg border border-sidebar-border bg-sidebar-bg text-sidebar-text hover:bg-sidebar-hover transition-colors"
        >
          Back to Experiments
        </Link>
      </div>

      {/* Experiment Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-sidebar-border bg-sidebar-bg p-4">
          <p className="text-xs text-sidebar-text/60 mb-1">Status</p>
          <p className="text-lg font-semibold text-sidebar-heading capitalize">{exp.status}</p>
        </div>
        <div className="rounded-xl border border-sidebar-border bg-sidebar-bg p-4">
          <p className="text-xs text-sidebar-text/60 mb-1">Variants</p>
          <p className="text-lg font-semibold text-sidebar-heading">{exp.variants?.length || 0}</p>
        </div>
        <div className="rounded-xl border border-sidebar-border bg-sidebar-bg p-4">
          <p className="text-xs text-sidebar-text/60 mb-1">Created</p>
          <p className="text-lg font-semibold text-sidebar-heading">{new Date(exp.created_at).toLocaleDateString()}</p>
        </div>
        <div className="rounded-xl border border-sidebar-border bg-sidebar-bg p-4">
          <p className="text-xs text-sidebar-text/60 mb-1">Total Users</p>
          <p className="text-lg font-semibold text-sidebar-heading">
            {Object.values(experimentData.variantCounts).reduce((a, b) => a + b, 0)}
          </p>
        </div>
      </div>

      {/* Results */}
      <ExperimentResults variants={variantResults} isSignificant={false} />
    </div>
  );
}
