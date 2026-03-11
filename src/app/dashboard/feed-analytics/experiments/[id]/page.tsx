import { getExperimentDetails } from '@/actions/feed-analytics';
import { ExperimentResults } from '@/components/analytics/ExperimentResults';
import Link from 'next/link';
import { ArrowLeft, FlaskConical, Activity, Layers, Calendar, Users } from 'lucide-react';

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
      <div className="animate-fade-in space-y-6">
        <div className="card-elevated rounded-xl p-16 text-center">
          <FlaskConical size={48} className="mx-auto mb-4 text-muted/30" />
          <h1 className="text-xl font-semibold text-foreground mb-2">Experiment Not Found</h1>
          <p className="text-sm text-muted mb-6">The experiment you are looking for does not exist or has been removed.</p>
          <Link href="/dashboard/feed-analytics/experiments" className="btn-primary">
            <ArrowLeft size={15} className="mr-2" />
            Back to Experiments
          </Link>
        </div>
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

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    paused: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    ended: 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  };

  const infoCards = [
    {
      label: 'Status',
      value: exp.status,
      icon: Activity,
      isStatus: true,
    },
    {
      label: 'Variants',
      value: `${exp.variants?.length || 0}`,
      icon: Layers,
    },
    {
      label: 'Created',
      value: new Date(exp.created_at).toLocaleDateString(),
      icon: Calendar,
    },
    {
      label: 'Total Users',
      value: Object.values(experimentData.variantCounts).reduce((a, b) => a + b, 0).toLocaleString(),
      icon: Users,
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <FlaskConical size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{exp.name}</h1>
            <p className="text-sm text-muted">{exp.description}</p>
          </div>
        </div>
        <Link
          href="/dashboard/feed-analytics/experiments"
          className="btn-secondary gap-2"
        >
          <ArrowLeft size={15} />
          Back to Experiments
        </Link>
      </div>

      {/* Experiment Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {infoCards.map(({ label, value, icon: Icon, isStatus }) => (
          <div key={label} className="card-elevated rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} className="text-muted" />
              <p className="text-xs font-medium text-muted">{label}</p>
            </div>
            {isStatus ? (
              <span className={`inline-flex items-center text-sm font-semibold px-2.5 py-0.5 rounded-full capitalize ${statusColors[value] || statusColors.draft}`}>
                {value}
              </span>
            ) : (
              <p className="text-lg font-bold text-foreground">{value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Results */}
      <ExperimentResults variants={variantResults} isSignificant={false} />
    </div>
  );
}
