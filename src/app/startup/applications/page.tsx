'use client';

import { useEffect, useState } from 'react';
import { getStartupApplications } from '@/actions/startup-portal';
import { format } from 'date-fns';
import { Users, RefreshCw } from 'lucide-react';

export default function StartupApplicationsPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStartupApplications().then(d => { setApps(d); setLoading(false); });
  }, []);

  const statusColor: Record<string, string> = {
    submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    reviewed: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
    shortlisted: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    hired: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Applications</h1>
        <p className="mt-1 text-sm text-muted">
          Applications received for your jobs and gigs
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><RefreshCw className="animate-spin text-primary" size={24} /></div>
      ) : apps.length === 0 ? (
        <div className="card-elevated flex flex-col items-center justify-center rounded-xl py-20">
          <Users size={48} className="mb-4 text-muted opacity-20" />
          <p className="font-semibold text-foreground">No applications yet</p>
          <p className="mt-1 text-sm text-muted">Applications will appear here once candidates apply</p>
        </div>
      ) : (
        <div className="card-elevated rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background/50">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Applicant</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Score</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">AI Recommendation</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Applied</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {apps.map(app => (
                <tr key={app.id} className="hover:bg-primary/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-foreground">{app.user_name ?? '--'}</div>
                    <div className="text-xs text-muted mt-0.5">{app.user_email}</div>
                  </td>
                  <td className="px-5 py-4 font-semibold text-foreground">{app.overall_score ?? '--'}</td>
                  <td className="px-5 py-4 text-muted capitalize">{app.ai_recommendation ?? '--'}</td>
                  <td className="px-5 py-4 text-muted">
                    {app.submitted_at ? format(new Date(app.submitted_at), 'MMM d, yyyy') : '--'}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                      statusColor[app.status] ?? 'bg-gray-100 text-gray-600'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
