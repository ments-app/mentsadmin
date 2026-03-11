'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Upload, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import DataTable, { type Column } from '@/components/DataTable';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { getResources, deleteResource } from '@/actions/resources';
import type { Resource } from '@/lib/types';

const categoryLabels: Record<string, string> = {
  govt_scheme: 'Govt Scheme',
  accelerator_incubator: 'Accelerator / Incubator',
  company_offer: 'Company Offer',
  tool: 'Tool',
  bank_offer: 'Bank Offer',
  scheme: 'Scheme',
};

const columns: Column<Resource>[] = [
  { key: 'title', label: 'Title' },
  {
    key: 'category',
    label: 'Category',
    render: (item) => (
      <span className="inline-block rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium capitalize text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
        {categoryLabels[item.category] || item.category}
      </span>
    ),
  },
  { key: 'provider', label: 'Provider', render: (item) => item.provider || '—' },
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

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getResources().then((data) => {
      setResources(data);
      setLoading(false);
    });
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteResource(deleteTarget.id);
      setResources((prev) => prev.filter((r) => r.id !== deleteTarget.id));
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
          <h1 className="text-2xl font-semibold text-foreground">Resources</h1>
          <p className="mt-1 text-sm text-muted">Manage resources -- schemes, accelerators, offers, tools & more</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/resources/import" className="btn-secondary flex items-center gap-2">
            <Upload size={16} />
            Import CSV
          </Link>
          <Link href="/dashboard/resources/new" className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Add Resource
          </Link>
        </div>
      </div>

      <div className="card-elevated rounded-xl">
        <DataTable
          columns={columns}
          data={resources}
          loading={loading}
          editHref={(item) => `/dashboard/resources/${item.id}`}
          onDelete={setDeleteTarget}
          emptyMessage="No resources yet. Create your first one!"
        />
      </div>

      {!loading && resources.length === 0 && (
        <div className="card-elevated rounded-xl flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/20 mb-4">
            <BookOpen size={24} className="text-indigo-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No resources yet</h3>
          <p className="mt-1 text-sm text-muted max-w-sm">Add resources or import from CSV to get started.</p>
          <div className="flex items-center gap-3 mt-4">
            <Link href="/dashboard/resources/import" className="btn-secondary flex items-center gap-2">
              <Upload size={16} />
              Import CSV
            </Link>
            <Link href="/dashboard/resources/new" className="btn-primary flex items-center gap-2">
              <Plus size={16} />
              Add Resource
            </Link>
          </div>
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
