'use client';

import { useEffect, useState } from 'react';
import { getStartupGigs } from '@/actions/startup-portal';
import { format } from 'date-fns';
import { Zap, RefreshCw, Plus } from 'lucide-react';

export default function StartupGigsPage() {
  const [gigs, setGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStartupGigs().then(d => { setGigs(d); setLoading(false); });
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Your Gigs</h1>
          <p className="mt-1 text-sm text-muted">Freelance / contract gig postings</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-primary" size={24} /></div>
      ) : gigs.length === 0 ? (
        <div className="py-16 text-center">
          <Zap size={40} className="mx-auto mb-3 text-muted opacity-40" />
          <p className="font-medium text-foreground">No gigs posted yet</p>
        </div>
      ) : (
        <div className="rounded-xl border border-card-border bg-card-bg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background">
                <th className="px-4 py-3 text-left font-medium text-muted">Title</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Budget</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Duration</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Posted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {gigs.map(gig => (
                <tr key={gig.id} className="hover:bg-background/50">
                  <td className="px-4 py-3 font-medium text-foreground">{gig.title}</td>
                  <td className="px-4 py-3 text-muted">{gig.budget ?? '—'}</td>
                  <td className="px-4 py-3 text-muted">{gig.duration ?? '—'}</td>
                  <td className="px-4 py-3 text-muted">{format(new Date(gig.created_at), 'MMM d, yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
