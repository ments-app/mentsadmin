'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import DataTable, { type Column } from '@/components/DataTable';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { getStartupJobs, deleteStartupJob } from '@/actions/startup-portal';
import { getApplicationCount } from '@/actions/applications';
import { Globe, Lock } from 'lucide-react';
import type { Job } from '@/lib/types';

const columns: Column<Job & { _appCount?: number }>[] = [
  { key: 'title', label: 'Title' },
  { key: 'company', label: 'Company' },
  {
    key: 'job_type',
    label: 'Type',
    render: (item) => (
      <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium capitalize text-blue-700 dark:bg-blue-900 dark:text-blue-300">
        {item.job_type}
      </span>
    ),
  },
  { key: 'location', label: 'Location', render: (item) => item.location || '--' },
  {
    key: 'visibility',
    label: 'Visibility',
    render: (item) =>
      item.visibility === 'facilitator_only' ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
          <Lock size={10} />
          Facilitators Only
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
          <Globe size={10} />
          Public
        </span>
      ),
  },
  {
    key: '_appCount' as keyof Job,
    label: 'Applications',
    render: (item) => {
      const count = (item as Job & { _appCount?: number })._appCount ?? 0;
      return count > 0 ? (
        <Link
          href={`/dashboard/jobs/${item.id}/applications`}
          className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-900 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
        >
          {count}
        </Link>
      ) : (
        <span className="text-xs text-muted">0</span>
      );
    },
  },
  {
    key: 'is_active',
    label: 'Status',
    render: (item) => (
      <span
        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
          item.is_active
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
        }`}
      >
        {item.is_active ? 'Active' : 'Inactive'}
      </span>
    ),
  },
  {
    key: 'created_at',
    label: 'Created',
    render: (item) => format(new Date(item.created_at), 'MMM d, yyyy'),
  },
];

export default function StartupJobsPage() {
  const [jobs, setJobs] = useState<(Job & { _appCount?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getStartupJobs().then(async (data) => {
      const counts = await Promise.all(data.map((j: Job) => getApplicationCount(j.id)));
      setJobs(data.map((j: Job, i: number) => ({ ...j, _appCount: counts[i] })));
      setLoading(false);
    });
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteStartupJob(deleteTarget.id);
      setJobs((prev) => prev.filter((j) => j.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Jobs</h1>
          <p className="mt-1 text-sm text-muted">Manage job postings</p>
        </div>
        <Link
          href="/startup/jobs/new"
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Add Job
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={jobs}
        loading={loading}
        editHref={(item) => `/startup/jobs/${item.id}`}
        onDelete={setDeleteTarget}
        emptyMessage="No jobs yet. Create your first one!"
      />

      <DeleteConfirmModal
        open={!!deleteTarget}
        title={deleteTarget?.title ?? ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
