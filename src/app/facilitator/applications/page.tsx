'use client';

import { useEffect, useState } from 'react';
import { getFacilitatorApplications } from '@/actions/facilitators';
import { format } from 'date-fns';
import { Users, RefreshCw } from 'lucide-react';

export default function FacilitatorApplicationsPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFacilitatorApplications().then(d => { setApps(d); setLoading(false); });
  }, []);

  const statusColor: Record<string, string> = {
    submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    reviewed: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
    shortlisted: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    hired: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Applications</h1>
        <p className="mt-1 text-sm text-muted">
          Applications for jobs & gigs posted within your ecosystem
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-primary" size={24} /></div>
      ) : apps.length === 0 ? (
        <div className="py-16 text-center">
          <Users size={40} className="mx-auto mb-3 text-muted opacity-40" />
          <p className="font-medium text-foreground">No applications yet</p>
          <p className="mt-1 text-sm text-muted">Applications will appear once candidates apply</p>
        </div>
      ) : (
        <div className="rounded-xl border border-card-border bg-card-bg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background">
                <th className="px-4 py-3 text-left font-medium text-muted">Applicant</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Score</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Recommendation</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Applied</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {apps.map(app => (
                <tr key={app.id} className="hover:bg-background/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{app.user_name ?? app.user_email}</div>
                    <div className="text-xs text-muted">{app.user_email}</div>
                  </td>
                  <td className="px-4 py-3 text-foreground">{app.overall_score ?? '—'}</td>
                  <td className="px-4 py-3 text-muted capitalize">{app.ai_recommendation ?? '—'}</td>
                  <td className="px-4 py-3 text-muted">
                    {app.submitted_at ? format(new Date(app.submitted_at), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
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
