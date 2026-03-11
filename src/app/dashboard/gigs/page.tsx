'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import DataTable, { type Column } from '@/components/DataTable';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { getGigs, deleteGig } from '@/actions/gigs';
import { getApplicationCount } from '@/actions/applications';
import type { Gig } from '@/lib/types';

const columns: Column<Gig & { _appCount?: number }>[] = [
  { key: 'title', label: 'Title' },
  { key: 'budget', label: 'Budget', render: (item) => item.budget || '—' },
  { key: 'duration', label: 'Duration', render: (item) => item.duration || '—' },
  {
    key: 'skills_required',
    label: 'Skills',
    render: (item) =>
      item.skills_required?.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {item.skills_required.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300"
            >
              {skill}
            </span>
          ))}
          {item.skills_required.length > 3 && (
            <span className="text-xs text-muted">+{item.skills_required.length - 3}</span>
          )}
        </div>
      ) : (
        '—'
      ),
  },
  {
    key: '_appCount' as keyof Gig,
    label: 'Applications',
    render: (item) => {
      const count = (item as Gig & { _appCount?: number })._appCount ?? 0;
      return count > 0 ? (
        <Link href={`/dashboard/gigs/${item.id}/applications`} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
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
        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
          item.is_active
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
        }`}
      >
        {item.is_active ? 'Active' : 'Inactive'}
      </span>
    ),
  },
  {
    key: 'created_at',
    label: 'Created',
    render: (item) => (
      <span className="text-muted">{format(new Date(item.created_at), 'MMM d, yyyy')}</span>
    ),
  },
];

export default function GigsPage() {
  const [gigs, setGigs] = useState<(Gig & { _appCount?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Gig | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getGigs().then(async (data) => {
      const counts = await Promise.all(data.map((g) => getApplicationCount(undefined, g.id)));
      setGigs(data.map((g, i) => ({ ...g, _appCount: counts[i] })));
      setLoading(false);
    });
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteGig(deleteTarget.id);
      setGigs((prev) => prev.filter((g) => g.id !== deleteTarget.id));
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
          <h1 className="text-2xl font-semibold text-foreground">Gigs</h1>
          <p className="mt-1 text-sm text-muted">Manage freelance gigs</p>
        </div>
        <Link href="/dashboard/gigs/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Add Gig
        </Link>
      </div>

      <div className="card-elevated rounded-xl">
        <DataTable
          columns={columns}
          data={gigs}
          loading={loading}
          editHref={(item) => `/dashboard/gigs/${item.id}`}
          onDelete={setDeleteTarget}
          emptyMessage="No gigs yet. Create your first one!"
        />
      </div>

      {!loading && gigs.length === 0 && (
        <div className="card-elevated rounded-xl flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/20 mb-4">
            <Briefcase size={24} className="text-indigo-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No gigs yet</h3>
          <p className="mt-1 text-sm text-muted max-w-sm">Create your first freelance gig to get started.</p>
          <Link href="/dashboard/gigs/new" className="btn-primary mt-4 flex items-center gap-2">
            <Plus size={16} />
            Add Gig
          </Link>
        </div>
      )}

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
