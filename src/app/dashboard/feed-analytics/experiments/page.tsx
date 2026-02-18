import { getExperimentsList } from '@/actions/feed-analytics';
import Link from 'next/link';

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
    draft: 'bg-gray-500/20 text-gray-400',
    active: 'bg-green-500/20 text-green-400',
    paused: 'bg-yellow-500/20 text-yellow-400',
    ended: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sidebar-heading">A/B Experiments</h1>
          <p className="text-sm text-sidebar-text/60 mt-1">Manage feed ranking experiments</p>
        </div>
        <Link
          href="/dashboard/feed-analytics"
          className="px-4 py-2 text-sm font-medium rounded-lg border border-sidebar-border bg-sidebar-bg text-sidebar-text hover:bg-sidebar-hover transition-colors"
        >
          Back to Overview
        </Link>
      </div>

      {/* Experiments List */}
      <div className="rounded-xl border border-sidebar-border bg-sidebar-bg overflow-hidden">
        {experiments.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sidebar-border">
                <th className="text-left px-6 py-3 text-sidebar-text/60 font-medium">Name</th>
                <th className="text-left px-6 py-3 text-sidebar-text/60 font-medium">Status</th>
                <th className="text-left px-6 py-3 text-sidebar-text/60 font-medium">Variants</th>
                <th className="text-left px-6 py-3 text-sidebar-text/60 font-medium">Created</th>
                <th className="text-left px-6 py-3 text-sidebar-text/60 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {experiments.map((exp) => (
                <tr key={exp.id} className="border-b border-sidebar-border/50 hover:bg-sidebar-hover/50">
                  <td className="px-6 py-3">
                    <div>
                      <p className="font-medium text-sidebar-heading">{exp.name}</p>
                      <p className="text-xs text-sidebar-text/40 mt-0.5">{exp.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[exp.status] || statusColors.draft}`}>
                      {exp.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sidebar-text">{exp.variants?.length || 0} variants</td>
                  <td className="px-6 py-3 text-sidebar-text text-xs">
                    {new Date(exp.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3">
                    <Link
                      href={`/dashboard/feed-analytics/experiments/${exp.id}`}
                      className="text-xs text-sidebar-active hover:underline"
                    >
                      View Results
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-12 text-center text-sidebar-text/40">
            <p className="mb-2">No experiments created yet</p>
            <p className="text-xs">Create experiments via the API at <code className="bg-sidebar-hover px-1 py-0.5 rounded">/api/feed/experiments</code></p>
          </div>
        )}
      </div>
    </div>
  );
}
