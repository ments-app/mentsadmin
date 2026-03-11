'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Star, Trophy, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import DataTable, { type Column } from '@/components/DataTable';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { getEvents, deleteEvent } from '@/actions/events';
import type { Event } from '@/lib/types';

const CATEGORY_STYLES: Record<string, string> = {
  event: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  meetup: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  workshop: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  conference: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  seminar: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
};

const columns: Column<Event>[] = [
  {
    key: 'title',
    label: 'Title',
    render: (item) => (
      <span className="flex items-center gap-1.5 font-medium">
        {item.is_featured && (
          <Star size={13} className="shrink-0 fill-amber-400 text-amber-400" />
        )}
        {item.arena_enabled && (
          <Trophy size={13} className="shrink-0 text-emerald-500" />
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
        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
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
      item.event_date ? (
        <span className="text-muted">{format(new Date(item.event_date), 'MMM d, yyyy h:mm a')}</span>
      ) : '—',
  },
  {
    key: 'event_type',
    label: 'Type',
    render: (item) => (
      <span className="inline-block rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium capitalize text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
        {item.event_type}
      </span>
    ),
  },
  {
    key: 'arena_round',
    label: 'Arena',
    render: (item) => {
      if (!item.arena_enabled) return <span className="text-muted">—</span>;
      const roundLabels: Record<string, string> = { registration: 'Round 1', investment: 'Round 2', completed: 'Done' };
      const roundColors: Record<string, string> = {
        registration: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        investment: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
        completed: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      };
      const round = item.arena_round ?? 'registration';
      return (
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${roundColors[round] ?? ''}`}>
          {roundLabels[round] ?? round}
        </span>
      );
    },
  },
  { key: 'organizer_name', label: 'Organizer', render: (item) => item.organizer_name || '—' },
  { key: 'location', label: 'Location', render: (item) => item.location || '—' },
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

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getEvents().then((data) => {
      setEvents(data);
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
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Events</h1>
          <p className="mt-1 text-sm text-muted">Manage events</p>
        </div>
        <Link href="/dashboard/events/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Add Event
        </Link>
      </div>

      <div className="card-elevated rounded-xl">
        <DataTable
          columns={columns}
          data={events}
          loading={loading}
          editHref={(item) => `/dashboard/events/${item.id}`}
          onDelete={setDeleteTarget}
          emptyMessage="No events yet. Create your first one!"
        />
      </div>

      {!loading && events.length === 0 && (
        <div className="card-elevated rounded-xl flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/20 mb-4">
            <Calendar size={24} className="text-indigo-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No events yet</h3>
          <p className="mt-1 text-sm text-muted max-w-sm">Create your first event to get started.</p>
          <Link href="/dashboard/events/new" className="btn-primary mt-4 flex items-center gap-2">
            <Plus size={16} />
            Add Event
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
