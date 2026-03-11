'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import DataTable, { type Column } from '@/components/DataTable';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { getFacilitatorJobs } from '@/actions/facilitators';
import { deleteJob } from '@/actions/jobs';
import { getApplicationCount } from '@/actions/applications';
import { Building2 } from 'lucide-react';
import type { Job } from '@/lib/types';

type FacilitatorJob = Job & { _appCount?: number; _startup_name?: string | null };

const columns: Column<FacilitatorJob>[] = [
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
  { key: 'location', label: 'Location', render: (item) => item.location || '—' },
  {
    key: '_startup_name' as keyof Job,
    label: 'Source',
    render: (item) => {
      const name = (item as FacilitatorJob)._startup_name;
      return name ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">
          <Building2 size={10} />
          {name}
        </span>
      ) : (
        <span className="text-xs text-muted">Own</span>
      );
    },
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

export default function FacilitatorJobsPage() {
  const [jobs, setJobs] = useState<FacilitatorJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<FacilitatorJob | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getFacilitatorJobs().then(async (data) => {
      const counts = await Promise.all(data.map((j: Job) => getApplicationCount(j.id)));
      setJobs(data.map((j: Job, i: number) => ({ ...j, _appCount: counts[i] })));
      setLoading(false);
    });
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    // Only allow deleting own jobs (not startup-posted jobs)
    if (deleteTarget._startup_name) return;
    setDeleting(true);
    try {
      await deleteJob(deleteTarget.id);
      setJobs((prev) => prev.filter((j) => j.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Jobs</h1>
          <p className="mt-1 text-sm text-muted">Manage job postings</p>
        </div>
        <Link href="/facilitator/jobs/new" className="btn-primary">
          <Plus size={16} />
          Add Job
        </Link>
      </div>

      <div className="card-elevated overflow-hidden">
        <DataTable
          columns={columns}
          data={jobs}
          loading={loading}
          editHref={(item) => `/facilitator/jobs/${item.id}`}
          onDelete={(item) => { if (!item._startup_name) setDeleteTarget(item); }}
          emptyMessage="No jobs yet. Create your first one!"
        />
      </div>

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
