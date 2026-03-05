'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Star } from 'lucide-react';
import { format } from 'date-fns';
import DataTable, { type Column } from '@/components/DataTable';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { getFacilitatorEvents } from '@/actions/facilitators';
import { deleteEvent } from '@/actions/events';
import type { Event } from '@/lib/types';

const CATEGORY_STYLES: Record<string, string> = {
  event: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  meetup: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  workshop: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  conference: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  seminar: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
};

const columns: Column<Event>[] = [
  {
    key: 'title',
    label: 'Title',
    render: (item) => (
      <span className="flex items-center gap-1.5">
        {item.is_featured && (
          <Star size={13} className="shrink-0 fill-amber-400 text-amber-400" />
        )}
        {item.title}
      </span>
    ),
  },
  {
    key: 'category',
    label: 'Category',
    render: (item) => (
      <span
        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
          CATEGORY_STYLES[item.category] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
        }`}
      >
        {item.category}
      </span>
    ),
  },
  {
    key: 'event_date',
    label: 'Date',
    render: (item) =>
      item.event_date ? format(new Date(item.event_date), 'MMM d, yyyy h:mm a') : '—',
  },
  {
    key: 'event_type',
    label: 'Type',
    render: (item) => (
      <span className="inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium capitalize text-orange-700 dark:bg-orange-900 dark:text-orange-300">
        {item.event_type}
      </span>
    ),
  },
  { key: 'organizer_name', label: 'Organizer', render: (item) => item.organizer_name || '—' },
  { key: 'location', label: 'Location', render: (item) => item.location || '—' },
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

export default function FacilitatorEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getFacilitatorEvents().then((data) => {
      setEvents(data as Event[]);
      setLoading(false);
    });
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEvent(deleteTarget.id);
      setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
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
          <h1 className="text-2xl font-bold text-foreground">Events</h1>
          <p className="mt-1 text-muted">Manage events</p>
        </div>
        <Link
          href="/facilitator/events/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          <Plus size={16} />
          Add Event
        </Link>
      </div>

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={events}
          loading={loading}
          editHref={(item) => `/facilitator/events/${item.id}`}
          onDelete={setDeleteTarget}
          emptyMessage="No events yet. Create your first one!"
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
