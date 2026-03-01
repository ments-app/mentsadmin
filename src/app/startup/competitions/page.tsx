'use client';

import { useEffect, useState } from 'react';
import { getStartupCompetitions } from '@/actions/startup-portal';
import { format } from 'date-fns';
import { Trophy, RefreshCw } from 'lucide-react';

export default function StartupCompetitionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStartupCompetitions().then(d => { setItems(d); setLoading(false); });
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Your Competitions</h1>
        <p className="mt-1 text-sm text-muted">Competitions organized by your startup</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-primary" size={24} /></div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center">
          <Trophy size={40} className="mx-auto mb-3 text-muted opacity-40" />
          <p className="font-medium text-foreground">No competitions yet</p>
        </div>
      ) : (
        <div className="rounded-xl border border-card-border bg-card-bg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background">
                <th className="px-4 py-3 text-left font-medium text-muted">Title</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Prize</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Deadline</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {items.map(c => (
                <tr key={c.id} className="hover:bg-background/50">
                  <td className="px-4 py-3 font-medium text-foreground">{c.title}</td>
                  <td className="px-4 py-3 text-muted">{c.prize_pool ?? '—'}</td>
                  <td className="px-4 py-3 text-muted">
                    {c.deadline ? format(new Date(c.deadline), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      c.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {c.is_active ? 'Active' : 'Ended'}
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
