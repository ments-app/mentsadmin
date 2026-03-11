'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trophy, User, CheckCircle, X, Minus, Search, Users } from 'lucide-react';
import { format } from 'date-fns';
import { getCompetition, getCompetitionRegistrations, updateRegistrationStatus } from '@/actions/competitions';

type Entry = {
  id: string;
  submitted_by: string;
  project_id: string | null;
  created_at: string;
  status: 'registered' | 'shortlisted' | 'winner' | 'rejected';
  admin_notes: string | null;
  users: { id: string; name: string | null; email: string | null; avatar_url: string | null } | null;
};

const statusStyles = {
  registered: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  shortlisted: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  winner: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  rejected: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400',
};

const statusLabels = {
  registered: 'Registered',
  shortlisted: 'Shortlisted',
  winner: 'Winner',
  rejected: 'Rejected',
};

export default function CompetitionRegistrationsPage() {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    Promise.all([getCompetition(id), getCompetitionRegistrations(id)]).then(([comp, data]) => {
      setTitle(comp.title);
      setEntries(data as Entry[]);
      setLoading(false);
    });
  }, [id]);

  async function setStatus(
    entryId: string,
    status: 'registered' | 'shortlisted' | 'winner' | 'rejected'
  ) {
    setUpdating(entryId);
    try {
      await updateRegistrationStatus(entryId, status);
      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, status } : e))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  }

  const filtered = entries.filter((e) => {
    const name = e.users?.name?.toLowerCase() ?? '';
    const email = e.users?.email?.toLowerCase() ?? '';
    const matchesSearch = !search || name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || e.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    all: entries.length,
    registered: entries.filter((e) => e.status === 'registered').length,
    shortlisted: entries.filter((e) => e.status === 'shortlisted').length,
    winner: entries.filter((e) => e.status === 'winner').length,
    rejected: entries.filter((e) => e.status === 'rejected').length,
  };

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <Link href={`/dashboard/competitions/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors mb-4">
        <ArrowLeft size={15} />
        Back to Edit
      </Link>

      {/* Page Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Registrations</h1>
          <p className="mt-1 text-sm text-muted">{title}</p>
        </div>
        <div className="card-elevated rounded-xl px-5 py-3 text-center">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-primary" />
            <span className="text-2xl font-bold text-foreground">{entries.length}</span>
          </div>
          <div className="text-xs text-muted mt-0.5">Total Registered</div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'registered', 'shortlisted', 'winner', 'rejected'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all capitalize ${
              filterStatus === s
                ? 'bg-primary text-white shadow-sm'
                : 'bg-card-bg border border-card-border text-muted hover:text-foreground hover:border-primary/30'
            }`}
          >
            {s === 'all' ? 'All' : statusLabels[s]} ({counts[s]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-xl border border-card-border bg-background pl-10 pr-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-card-border" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-elevated rounded-xl py-16 text-center">
          <Users size={40} className="mx-auto text-muted/30 mb-3" />
          <p className="text-sm text-muted">No registrations found.</p>
        </div>
      ) : (
        <div className="card-elevated rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-card-bg/50">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">Participant</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">Registered</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {filtered.map((entry) => (
                <tr key={entry.id} className="hover:bg-primary/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {entry.users?.avatar_url ? (
                        <img src={entry.users.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-card-border" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary ring-2 ring-primary/20">
                          <User size={14} />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-foreground">
                          {entry.users?.name ?? 'Unknown User'}
                        </div>
                        <div className="text-xs text-muted">{entry.users?.email ?? entry.submitted_by}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted">
                    {format(new Date(entry.created_at), 'dd MMM yyyy, HH:mm')}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[entry.status]}`}>
                      {statusLabels[entry.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setStatus(entry.id, 'shortlisted')}
                        disabled={updating === entry.id || entry.status === 'shortlisted'}
                        title="Shortlist"
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-30 transition-colors"
                      >
                        <CheckCircle size={15} />
                      </button>
                      <button
                        onClick={() => setStatus(entry.id, 'winner')}
                        disabled={updating === entry.id || entry.status === 'winner'}
                        title="Mark as Winner"
                        className="rounded-lg p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 disabled:opacity-30 transition-colors"
                      >
                        <Trophy size={15} />
                      </button>
                      <button
                        onClick={() => setStatus(entry.id, 'rejected')}
                        disabled={updating === entry.id || entry.status === 'rejected'}
                        title="Reject"
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-30 transition-colors"
                      >
                        <X size={15} />
                      </button>
                      <button
                        onClick={() => setStatus(entry.id, 'registered')}
                        disabled={updating === entry.id || entry.status === 'registered'}
                        title="Reset to Registered"
                        className="rounded-lg p-2 text-muted hover:bg-card-border/50 disabled:opacity-30 transition-colors"
                      >
                        <Minus size={15} />
                      </button>
                    </div>
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
