'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import DataTable, { type Column } from '@/components/DataTable';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { getCompetitions, deleteCompetition } from '@/actions/competitions';
import type { Competition } from '@/lib/types';

const columns: Column<Competition>[] = [
  { key: 'title', label: 'Title' },
  {
    key: 'deadline',
    label: 'Deadline',
    render: (item) =>
      item.deadline ? format(new Date(item.deadline), 'MMM d, yyyy') : '—',
  },
  {
    key: 'is_external',
    label: 'Type',
    render: (item) => (
      <span
        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
          item.is_external
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
            : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
        }`}
      >
        {item.is_external ? 'External' : 'Internal'}
      </span>
    ),
  },
  { key: 'prize_pool', label: 'Prize Pool', render: (item) => item.prize_pool || '—' },
  {
    key: 'created_at',
    label: 'Created',
    render: (item) => format(new Date(item.created_at), 'MMM d, yyyy'),
  },
];

export default function CompetitionsPage() {
  const router = useRouter();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Competition | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getCompetitions().then((data) => {
      setCompetitions(data);
      setLoading(false);
    });
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCompetition(deleteTarget.id);
      setCompetitions((prev) => prev.filter((c) => c.id !== deleteTarget.id));
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
          <h1 className="text-2xl font-bold text-foreground">Competitions</h1>
          <p className="mt-1 text-muted">Manage hub competitions</p>
        </div>
        <Link
          href="/dashboard/competitions/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          <Plus size={16} />
          Add Competition
        </Link>
      </div>

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={competitions}
          loading={loading}
          editHref={(item) => `/dashboard/competitions/${item.id}`}
          onDelete={setDeleteTarget}
          emptyMessage="No competitions yet. Create your first one!"
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
