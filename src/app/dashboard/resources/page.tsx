'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
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
};

const columns: Column<Resource>[] = [
  { key: 'title', label: 'Title' },
  {
    key: 'category',
    label: 'Category',
    render: (item) => (
      <span className="inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium capitalize text-purple-700 dark:bg-purple-900 dark:text-purple-300">
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
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Resources</h1>
          <p className="mt-1 text-muted">Manage resources — schemes, accelerators, offers, tools & more</p>
        </div>
        <Link
          href="/dashboard/resources/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          <Plus size={16} />
          Add Resource
        </Link>
      </div>

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={resources}
          loading={loading}
          editHref={(item) => `/dashboard/resources/${item.id}`}
          onDelete={setDeleteTarget}
          emptyMessage="No resources yet. Create your first one!"
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
