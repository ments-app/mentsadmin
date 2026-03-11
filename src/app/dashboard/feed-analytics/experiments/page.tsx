import { getExperimentsList } from '@/actions/feed-analytics';
import Link from 'next/link';
import { ArrowLeft, FlaskConical } from 'lucide-react';

export default async function ExperimentsPage() {
  let experiments: Array<{
    id: string;
    name: string;
    description: string;
    status: string;
    variants: Array<{ id: string; name: string; weight: number }>;
    created_at: string;
    started_at: string | null;
    ended_at: string | null;
  }> = [];

  try {
    experiments = await getExperimentsList();
  } catch (error) {
    console.error('Error loading experiments:', error);
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    paused: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    ended: 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <FlaskConical size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">A/B Experiments</h1>
            <p className="text-sm text-muted">Manage feed ranking experiments</p>
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

      {/* Experiments List */}
      <div className="card-elevated rounded-xl overflow-hidden">
        {experiments.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-card-bg/60">
                <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">Name</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">Variants</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">Created</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {experiments.map((exp) => (
                <tr key={exp.id} className="transition-colors hover:bg-primary/[0.03]">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-foreground">{exp.name}</p>
                      <p className="text-xs text-muted mt-0.5 line-clamp-1">{exp.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColors[exp.status] || statusColors.draft}`}>
                      {exp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-md bg-card-border/40 px-2 py-0.5 text-xs font-medium text-foreground">
                      {exp.variants?.length || 0} variants
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted">
                    {new Date(exp.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/dashboard/feed-analytics/experiments/${exp.id}`}
                      className="btn-ghost text-xs text-primary hover:text-primary"
                    >
                      View Results
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-16 text-center">
            <FlaskConical size={40} className="mx-auto mb-3 text-muted/30" />
            <p className="text-sm font-medium text-muted">No experiments created yet</p>
            <p className="mt-1 text-xs text-muted/70">
              Create experiments via the API at{' '}
              <code className="rounded-md bg-card-border/40 px-1.5 py-0.5 font-mono text-xs">/api/feed/experiments</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
