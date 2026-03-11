'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import DataTable, { type Column } from '@/components/DataTable';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { getFacilitatorGigs } from '@/actions/facilitators';
import { deleteGig } from '@/actions/gigs';
import { getApplicationCount } from '@/actions/applications';
import { Building2 } from 'lucide-react';
import type { Gig } from '@/lib/types';

type FacilitatorGig = Gig & { _appCount?: number; _startup_name?: string | null };

const columns: Column<FacilitatorGig>[] = [
  { key: 'title', label: 'Title' },
  { key: 'budget', label: 'Budget', render: (item) => item.budget || '—' },
  {
    key: '_startup_name' as keyof Gig,
    label: 'Source',
    render: (item) => {
      const name = (item as FacilitatorGig)._startup_name;
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
              className="inline-block rounded-full bg-purple-100 px-1.5 py-0.5 text-xs text-purple-700 dark:bg-purple-900 dark:text-purple-300"
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
        <Link
          href={`/dashboard/gigs/${item.id}/applications`}
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

export default function FacilitatorGigsPage() {
  const [gigs, setGigs] = useState<FacilitatorGig[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<FacilitatorGig | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getFacilitatorGigs().then(async (data) => {
      const counts = await Promise.all(data.map((g: FacilitatorGig) => getApplicationCount(undefined, g.id)));
      setGigs(data.map((g: FacilitatorGig, i: number) => ({ ...g, _appCount: counts[i] })));
      setLoading(false);
    });
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    // Only allow deleting own gigs (not startup-posted gigs)
    if (deleteTarget._startup_name) return;
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
        <Link href="/facilitator/gigs/new" className="btn-primary">
          <Plus size={16} />
          Add Gig
        </Link>
      </div>

      <div className="card-elevated overflow-hidden">
        <DataTable
          columns={columns}
          data={gigs}
          loading={loading}
          editHref={(item) => `/facilitator/gigs/${item.id}`}
          onDelete={(item) => { if (!item._startup_name) setDeleteTarget(item); }}
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
