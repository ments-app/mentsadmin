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
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Facilitators</h1>
          <p className="mt-1 text-sm text-muted">Manage facilitator verification requests</p>
        </div>
        <button
          onClick={() => load(filter)}
          className="btn-ghost gap-2"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {(['all', 'pending', 'approved', 'rejected', 'suspended'] as FilterType[]).map((f, i) => {
          const icons = { all: null, pending: <Clock size={16} />, approved: <CheckCircle2 size={16} />, rejected: <XCircle size={16} />, suspended: <ShieldAlert size={16} /> };
          const colors = { all: 'text-foreground', pending: 'text-amber-600', approved: 'text-emerald-600', rejected: 'text-red-600', suspended: 'text-orange-600' };
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`card-elevated rounded-xl p-4 text-left transition-all ${
                filter === f ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center justify-between">
                <span className={`text-2xl font-bold ${colors[f]}`}>{counts[f]}</span>
                {icons[f] && <span className={colors[f]}>{icons[f]}</span>}
              </div>
              <p className="mt-1 text-xs font-medium capitalize text-muted">{f}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Search by organisation or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-xl border border-card-border bg-card-bg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <RefreshCw className="animate-spin text-primary" size={28} />
          <p className="mt-3 text-sm text-muted">Loading facilitators...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-elevated rounded-xl py-16 text-center">
          <Building2 size={48} className="mx-auto mb-4 text-muted/30" />
          <p className="text-base font-medium text-foreground">No facilitators found</p>
          <p className="mt-1 text-sm text-muted">
            {search ? 'Try adjusting your search terms' : 'Facilitator applications will appear here'}
          </p>
        </div>
      ) : (
        <div className="card-elevated overflow-hidden rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background/50">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Organisation</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Type</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Contact</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Submitted</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {filtered.map((f) => {
                const fp = f.facilitator_profiles;
                return (
                  <tr key={f.id} className="group transition-colors hover:bg-primary/[0.02]">
                    <td className="px-5 py-4">
                      <div className="font-medium text-foreground">{fp?.organisation_name ?? f.display_name ?? '\u2014'}</div>
                      <div className="mt-0.5 text-xs text-muted">{f.email}</div>
                    </td>
                    <td className="px-5 py-4 capitalize text-muted">
                      {fp?.organisation_type?.replace('_', ' ') ?? '\u2014'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-foreground">{fp?.poc_name ?? '\u2014'}</div>
                      <div className="mt-0.5 text-xs text-muted">{fp?.contact_number ?? ''}</div>
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {format(new Date(f.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={f.verification_status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {f.verification_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(f.id)}
                              disabled={actionLoading === f.id + '-approve'}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectModal({ id: f.id, name: fp?.organisation_name ?? f.display_name ?? '' })}
                              className="btn-danger !px-3 !py-1.5 !text-xs"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {f.verification_status === 'approved' && (
                          <button
                            onClick={() => handleSuspend(f.id)}
                            disabled={actionLoading === f.id + '-suspend'}
                            className="rounded-lg border border-orange-400 px-3 py-1.5 text-xs font-medium text-orange-600 transition-all hover:bg-orange-50 dark:hover:bg-orange-900/20 disabled:opacity-50"
                          >
                            Suspend
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/dashboard/facilitators/${f.id}`)}
                          className="btn-ghost !p-1.5 !rounded-lg"
                        >
                          <ChevronRight size={16} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md animate-fade-in card-elevated rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">Reject Facilitator</h3>
            <p className="mt-1 text-sm text-muted">
              Rejecting: <strong className="text-foreground">{rejectModal.name}</strong>
            </p>
            <textarea
              value={rejectNotes}
              onChange={e => setRejectNotes(e.target.value)}
              placeholder="Reason for rejection (required)..."
              rows={3}
              className="mt-4 w-full rounded-xl border border-card-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => { setRejectModal(null); setRejectNotes(''); }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectNotes.trim() || !!actionLoading}
                className="btn-danger flex-1"
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
