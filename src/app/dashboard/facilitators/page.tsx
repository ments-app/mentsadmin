'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFacilitators, approveFacilitator, rejectFacilitator, suspendFacilitator } from '@/actions/facilitators';
import { format } from 'date-fns';
import {
  CheckCircle2, XCircle, ShieldAlert, Clock, Building2,
  ChevronRight, Search, Filter, RefreshCw
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';

type FilterType = 'all' | 'pending' | 'approved' | 'rejected' | 'suspended';

export default function FacilitatorsPage() {
  const router = useRouter();
  const [facilitators, setFacilitators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  async function load(f: FilterType = filter) {
    setLoading(true);
    try {
      const data = await getFacilitators(f);
      setFacilitators(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  async function handleApprove(id: string) {
    setActionLoading(id + '-approve');
    try {
      await approveFacilitator(id, 'Approved via admin panel');
      await load();
    } catch (e) {
      console.error(e);
    }
    setActionLoading(null);
  }

  async function handleReject() {
    if (!rejectModal || !rejectNotes.trim()) return;
    setActionLoading(rejectModal.id + '-reject');
    try {
      await rejectFacilitator(rejectModal.id, rejectNotes);
      setRejectModal(null);
      setRejectNotes('');
      await load();
    } catch (e) {
      console.error(e);
    }
    setActionLoading(null);
  }

  async function handleSuspend(id: string) {
    const reason = prompt('Reason for suspension:');
    if (!reason) return;
    setActionLoading(id + '-suspend');
    try {
      await suspendFacilitator(id, reason);
      await load();
    } catch (e) {
      console.error(e);
    }
    setActionLoading(null);
  }

  const filtered = facilitators.filter(f => {
    if (!search) return true;
    const fp = f.facilitator_profiles;
    const name = (fp?.organisation_name ?? f.display_name ?? '').toLowerCase();
    return name.includes(search.toLowerCase()) || f.email.toLowerCase().includes(search.toLowerCase());
  });

  const counts = {
    all: facilitators.length,
    pending: facilitators.filter(f => f.verification_status === 'pending').length,
    approved: facilitators.filter(f => f.verification_status === 'approved').length,
    rejected: facilitators.filter(f => f.verification_status === 'rejected').length,
    suspended: facilitators.filter(f => f.verification_status === 'suspended').length,
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Facilitators</h1>
          <p className="mt-1 text-sm text-muted">Manage facilitator verification requests</p>
        </div>
        <button
          onClick={() => load(filter)}
          className="flex items-center gap-2 rounded-lg border border-card-border px-3 py-2 text-sm text-muted hover:text-foreground"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {(['all', 'pending', 'approved', 'rejected', 'suspended'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-primary text-white'
                : 'bg-card-bg border border-card-border text-muted hover:text-foreground'
            }`}
          >
            {f === 'pending' && <Clock size={12} />}
            {f === 'approved' && <CheckCircle2 size={12} />}
            {f === 'rejected' && <XCircle size={12} />}
            {f === 'suspended' && <ShieldAlert size={12} />}
            <span className="capitalize">{f}</span>
            <span className={`rounded-full px-1.5 py-0.5 text-xs ${
              filter === f ? 'bg-white/20' : 'bg-card-border'
            }`}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Search by organisation or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-lg border border-card-border bg-card-bg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="animate-spin text-primary" size={24} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-muted">
          <Building2 size={40} className="mx-auto mb-3 opacity-30" />
          <p>No facilitators found</p>
        </div>
      ) : (
        <div className="rounded-xl border border-card-border bg-card-bg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background">
                <th className="px-4 py-3 text-left font-medium text-muted">Organisation</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Type</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Contact</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Submitted</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {filtered.map((f) => {
                const fp = f.facilitator_profiles;
                return (
                  <tr key={f.id} className="hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{fp?.organisation_name ?? f.display_name ?? '—'}</div>
                      <div className="text-xs text-muted">{f.email}</div>
                    </td>
                    <td className="px-4 py-3 capitalize text-muted">
                      {fp?.organisation_type?.replace('_', ' ') ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-foreground">{fp?.poc_name ?? '—'}</div>
                      <div className="text-xs text-muted">{fp?.contact_number ?? ''}</div>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {format(new Date(f.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={f.verification_status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {f.verification_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(f.id)}
                              disabled={actionLoading === f.id + '-approve'}
                              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectModal({ id: f.id, name: fp?.organisation_name ?? f.display_name ?? '' })}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {f.verification_status === 'approved' && (
                          <button
                            onClick={() => handleSuspend(f.id)}
                            disabled={actionLoading === f.id + '-suspend'}
                            className="rounded-lg border border-orange-500 px-3 py-1.5 text-xs font-medium text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 disabled:opacity-50"
                          >
                            Suspend
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/dashboard/facilitators/${f.id}`)}
                          className="rounded-lg border border-card-border px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl border border-card-border bg-card-bg p-6">
            <h3 className="text-lg font-semibold text-foreground">Reject Facilitator</h3>
            <p className="mt-1 text-sm text-muted">
              Rejecting: <strong>{rejectModal.name}</strong>
            </p>
            <textarea
              value={rejectNotes}
              onChange={e => setRejectNotes(e.target.value)}
              placeholder="Reason for rejection (required)..."
              rows={3}
              className="mt-4 w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => { setRejectModal(null); setRejectNotes(''); }}
                className="flex-1 rounded-lg border border-card-border px-4 py-2 text-sm text-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectNotes.trim() || !!actionLoading}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
