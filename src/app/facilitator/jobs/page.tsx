'use client';

import { useEffect, useState } from 'react';
import { getFacilitatorJobs } from '@/actions/facilitators';
import { format } from 'date-fns';
import { Briefcase, RefreshCw, Plus } from 'lucide-react';
import Link from 'next/link';

export default function FacilitatorJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFacilitatorJobs().then(d => { setJobs(d); setLoading(false); });
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Jobs</h1>
          <p className="mt-1 text-sm text-muted">Jobs posted by you or your startups</p>
        </div>
        <Link
          href="/dashboard/jobs/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          <Plus size={16} /> Post Job
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-primary" size={24} /></div>
      ) : jobs.length === 0 ? (
        <div className="py-16 text-center">
          <Briefcase size={40} className="mx-auto mb-3 text-muted opacity-40" />
          <p className="font-medium text-foreground">No jobs posted yet</p>
        </div>
      ) : (
        <div className="rounded-xl border border-card-border bg-card-bg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background">
                <th className="px-4 py-3 text-left font-medium text-muted">Title</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Company</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Type</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Posted</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {jobs.map(job => (
                <tr key={job.id} className="hover:bg-background/50">
                  <td className="px-4 py-3 font-medium text-foreground">{job.title}</td>
                  <td className="px-4 py-3 text-muted">{job.company ?? '—'}</td>
                  <td className="px-4 py-3 text-muted capitalize">{job.job_type ?? '—'}</td>
                  <td className="px-4 py-3 text-muted">{format(new Date(job.created_at), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      job.is_active
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {job.is_active ? 'Active' : 'Closed'}
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
