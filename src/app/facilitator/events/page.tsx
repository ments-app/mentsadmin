'use client';

import { useEffect, useState } from 'react';
import { getFacilitatorEvents } from '@/actions/facilitators';
import { format } from 'date-fns';
import { CalendarDays, RefreshCw, Plus } from 'lucide-react';
import Link from 'next/link';

export default function FacilitatorEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFacilitatorEvents().then(d => { setEvents(d); setLoading(false); });
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Events</h1>
          <p className="mt-1 text-sm text-muted">Events created by you or your startups</p>
        </div>
        <Link
          href="/dashboard/events/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          <Plus size={16} /> Create Event
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-primary" size={24} /></div>
      ) : events.length === 0 ? (
        <div className="py-16 text-center">
          <CalendarDays size={40} className="mx-auto mb-3 text-muted opacity-40" />
          <p className="font-medium text-foreground">No events created yet</p>
        </div>
      ) : (
        <div className="rounded-xl border border-card-border bg-card-bg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background">
                <th className="px-4 py-3 text-left font-medium text-muted">Title</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Type</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Event Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Created</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {events.map(ev => (
                <tr key={ev.id} className="hover:bg-background/50">
                  <td className="px-4 py-3 font-medium text-foreground">{ev.title}</td>
                  <td className="px-4 py-3 text-muted capitalize">{ev.event_type ?? '—'}</td>
                  <td className="px-4 py-3 text-muted">
                    {ev.event_date ? format(new Date(ev.event_date), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted">{format(new Date(ev.created_at), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      ev.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {ev.is_active ? 'Active' : 'Ended'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
