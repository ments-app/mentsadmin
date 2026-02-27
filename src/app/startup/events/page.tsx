'use client';

import { useEffect, useState } from 'react';
import { getStartupEvents } from '@/actions/startup-portal';
import { format } from 'date-fns';
import { CalendarDays, RefreshCw } from 'lucide-react';

export default function StartupEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStartupEvents().then(d => { setEvents(d); setLoading(false); });
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Your Events</h1>
        <p className="mt-1 text-sm text-muted">Events hosted by your startup</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-primary" size={24} /></div>
      ) : events.length === 0 ? (
        <div className="py-16 text-center">
          <CalendarDays size={40} className="mx-auto mb-3 text-muted opacity-40" />
          <p className="font-medium text-foreground">No events yet</p>
        </div>
      ) : (
        <div className="rounded-xl border border-card-border bg-card-bg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background">
                <th className="px-4 py-3 text-left font-medium text-muted">Title</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Type</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Created</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
