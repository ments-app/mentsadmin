'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import DataTable, { type Column } from '@/components/DataTable';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { getGigs, deleteGig } from '@/actions/gigs';
import type { Gig } from '@/lib/types';

const columns: Column<Gig>[] = [
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
              className="inline-block rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-700 dark:bg-purple-900 dark:text-purple-300"
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

export default function GigsPage() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Gig | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getGigs().then((data) => {
      setGigs(data);
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
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gigs</h1>
          <p className="mt-1 text-muted">Manage freelance gigs</p>
        </div>
        <Link
          href="/dashboard/gigs/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          <Plus size={16} />
          Add Gig
        </Link>
      </div>

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={gigs}
          loading={loading}
          editHref={(item) => `/dashboard/gigs/${item.id}`}
          onDelete={setDeleteTarget}
          emptyMessage="No gigs yet. Create your first one!"
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
