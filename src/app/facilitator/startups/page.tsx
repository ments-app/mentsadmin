'use client';

import { useEffect, useState } from 'react';
import {
  getFacilitatorStartups, getUnassignedStartups,
  approveStartup, rejectStartup, suspendStartup, claimStartupForVerification
} from '@/actions/facilitators';
import { deleteStartupProfile } from '@/actions/startups';
import { format } from 'date-fns';
import {
  CheckCircle2, XCircle, ShieldAlert, Rocket,
  RefreshCw, UserPlus, Eye, Plus, Pencil, Trash2
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import Link from 'next/link';

type Tab = 'my-startups' | 'unassigned';

export default function FacilitatorStartupsPage() {
  const [tab, setTab] = useState<Tab>('my-startups');
  const [myStartups, setMyStartups] = useState<any[]>([]);
  const [unassigned, setUnassigned] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ startupId: string; name: string } | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'suspended'>('all');

  async function load() {
    setLoading(true);
    // Load independently — one failure must not blank out the other tab
    const [mineResult, freeResult] = await Promise.allSettled([
      getFacilitatorStartups(),
      getUnassignedStartups(),
    ]);
    if (mineResult.status === 'fulfilled') setMyStartups(mineResult.value);
    else console.error('getFacilitatorStartups failed:', mineResult.reason);
    if (freeResult.status === 'fulfilled') setUnassigned(freeResult.value);
    else console.error('getUnassignedStartups failed:', freeResult.reason);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleClaim(startupUserId: string) {
    setActionLoading('claim-' + startupUserId);
    try {
      await claimStartupForVerification(startupUserId);
      await load();
      setTab('my-startups');
    } catch (e: any) {
      alert(e.message);
    }
    setActionLoading(null);
  }

  async function handleApprove(startupId: string) {
    setActionLoading('approve-' + startupId);
    try {
      await approveStartup(startupId);
      await load();
    } catch (e: any) { alert(e.message); }
    setActionLoading(null);
  }

  async function handleReject() {
    if (!rejectModal || !rejectNotes.trim()) return;
    setActionLoading('reject-' + rejectModal.startupId);
    try {
      await rejectStartup(rejectModal.startupId, rejectNotes);
      setRejectModal(null);
      setRejectNotes('');
      await load();
    } catch (e: any) { alert(e.message); }
    setActionLoading(null);
  }

  async function handleSuspend(startupId: string) {
    const reason = prompt('Reason for suspension:');
    if (!reason) return;
    setActionLoading('suspend-' + startupId);
    try {
      await suspendStartup(startupId, reason);
      await load();
    } catch (e: any) { alert(e.message); }
    setActionLoading(null);
  }

  async function handleDelete(startupId: string, name: string) {
    if (!confirm(`Are you sure you want to permanently delete "${name}"? This cannot be undone.`)) return;
    setActionLoading('delete-' + startupId);
    try {
      await deleteStartupProfile(startupId);
      await load();
    } catch (e: any) { alert(e.message); }
    setActionLoading(null);
  }

  const filteredMyStartups = filter === 'all'
    ? myStartups
    : myStartups.filter(s => s.status === filter);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Startups</h1>
          <p className="mt-1 text-sm text-muted">Verify and manage startups in your ecosystem</p>
        </div>
        <Link
          href="/facilitator/startups/create"
          className="btn-primary gap-2"
        >
          <Plus size={15} /> Create Startup
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border border-card-border bg-card-bg p-1 w-fit">
        {[
          { id: 'my-startups' as Tab, label: `My Startups (${myStartups.length})` },
          { id: 'unassigned' as Tab, label: `Awaiting Claim (${unassigned.length})` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-primary text-white' : 'text-muted hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="animate-spin text-primary" size={24} />
        </div>
      ) : tab === 'my-startups' ? (
        <>
          {/* Filter */}
          <div className="mb-4 flex gap-2 overflow-x-auto">
            {(['all', 'pending', 'approved', 'rejected', 'suspended'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap capitalize transition-colors ${
                  filter === f ? 'bg-primary text-white' : 'bg-card-bg border border-card-border text-muted hover:text-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {filteredMyStartups.length === 0 ? (
            <EmptyState
              icon={Rocket}
              title="No startups yet"
              desc='Go to "Awaiting Claim" to find and verify startups'
            />
          ) : (
            <div className="space-y-3">
              {filteredMyStartups.map((a: any) => {
                const sp = a.startup_profiles;
                return (
                  <div key={a.id} className="rounded-xl border border-card-border bg-card-bg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-foreground">{sp?.brand_name ?? 'Unknown Startup'}</div>
                        <div className="mt-0.5 text-sm text-muted">
                          {[sp?.city, sp?.country].filter(Boolean).join(', ')} · {sp?.stage ?? ''}
                        </div>
                        {sp?.tagline && <div className="mt-1 text-xs text-muted italic">{sp.tagline}</div>}
                        <div className="mt-1 text-xs text-muted">
                          Claimed {format(new Date(a.created_at), 'MMM d, yyyy')}
                        </div>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>

                    {a.notes && (
                      <div className="mt-2 text-xs text-muted rounded bg-background px-2 py-1">
                        Notes: {a.notes}
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={`/facilitator/startups/${sp?.id}`}
                        className="flex items-center gap-1 rounded-lg border border-card-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
                      >
                        <Eye size={12} /> View Profile
                      </Link>
                      {sp?.id && (
                        <Link
                          href={`/facilitator/startups/${sp.id}/edit`}
                          className="flex items-center gap-1 rounded-lg border border-card-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                          <Pencil size={12} /> Edit
                        </Link>
                      )}
                      {a.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(sp?.id)}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            <CheckCircle2 size={12} /> Approve
                          </button>
                          <button
                            onClick={() => setRejectModal({ startupId: sp?.id, name: sp?.brand_name ?? '' })}
                            className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                          >
                            <XCircle size={12} /> Reject
                          </button>
                        </>
                      )}
                      {a.status === 'approved' && (
                        <button
                          onClick={() => handleSuspend(sp?.id)}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1 rounded-lg border border-orange-500 px-3 py-1.5 text-xs font-medium text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 disabled:opacity-50"
                        >
                          <ShieldAlert size={12} /> Suspend
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(sp?.id, sp?.brand_name ?? 'Unknown')}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Unassigned startups */
        unassigned.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title="No pending startups"
            desc="All startups have been claimed or none have signed up yet"
          />
        ) : (
          <div className="space-y-3">
            {unassigned.map((u: any) => (
              <div key={u.id} className="rounded-xl border border-card-border bg-card-bg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-foreground">{u.display_name ?? u.email}</div>
                    <div className="text-sm text-muted">{u.email}</div>
                    <div className="mt-1 text-xs text-muted">
                      Registered {format(new Date(u.created_at), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <StatusBadge status="pending" />
                </div>
                <button
                  onClick={() => handleClaim(u.id)}
                  disabled={actionLoading === 'claim-' + u.id}
                  className="mt-3 flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50"
                >
                  <UserPlus size={12} />
                  {actionLoading === 'claim-' + u.id ? 'Claiming...' : 'Claim & Verify'}
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl border border-card-border bg-card-bg p-6">
            <h3 className="text-lg font-semibold text-foreground">Reject Startup</h3>
            <p className="mt-1 text-sm text-muted">Rejecting: <strong>{rejectModal.name}</strong></p>
            <textarea
              value={rejectNotes}
              onChange={e => setRejectNotes(e.target.value)}
              placeholder="Reason for rejection..."
              rows={3}
              className="mt-4 w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            />
            <div className="mt-4 flex gap-3">
              <button onClick={() => { setRejectModal(null); setRejectNotes(''); }}
                className="flex-1 rounded-lg border border-card-border px-4 py-2 text-sm text-muted">
                Cancel
              </button>
              <button onClick={handleReject} disabled={!rejectNotes.trim() || !!actionLoading}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="py-16 text-center">
      <Icon size={40} className="mx-auto mb-3 text-muted opacity-40" />
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted">{desc}</p>
    </div>
  );
}
