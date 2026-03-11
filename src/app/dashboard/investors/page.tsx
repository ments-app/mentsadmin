'use client';

import { useEffect, useState } from 'react';
import { getInvestorApplications, approveInvestor, rejectInvestor, revokeInvestor } from '@/actions/investors';
import { format } from 'date-fns';
import {
  CheckCircle2, XCircle, Clock, RefreshCw, Search,
  ExternalLink, DollarSign, Target, Users, ShieldCheck,
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';

type FilterType = 'all' | 'applied' | 'verified' | 'rejected';

const INVESTOR_TYPE_LABELS: Record<string, string> = {
  angel: 'Angel',
  vc: 'VC',
  scout: 'Scout',
  syndicate_lead: 'Syndicate Lead',
  family_office: 'Family Office',
  accelerator: 'Accelerator',
  corporate_vc: 'Corporate VC',
  government: 'Government',
};

export default function InvestorsPage() {
  const [investors, setInvestors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('applied');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);

  async function load(f: FilterType = filter) {
    setLoading(true);
    try {
      const data = await getInvestorApplications(f);
      setInvestors(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  async function handleApprove(id: string) {
    setActionLoading(id + '-approve');
    try {
      await approveInvestor(id);
      await load();
    } catch (e) {
      console.error(e);
    }
    setActionLoading(null);
  }

  async function handleReject() {
    if (!rejectModal) return;
    setActionLoading(rejectModal.id + '-reject');
    try {
      await rejectInvestor(rejectModal.id);
      setRejectModal(null);
      await load();
    } catch (e) {
      console.error(e);
    }
    setActionLoading(null);
  }

  async function handleRevoke(id: string) {
    setActionLoading(id + '-revoke');
    try {
      await revokeInvestor(id);
      await load();
    } catch (e) {
      console.error(e);
    }
    setActionLoading(null);
  }

  const filtered = investors.filter(inv => {
    if (!search) return true;
    const name = (inv.full_name ?? '').toLowerCase();
    const email = (inv.email ?? '').toLowerCase();
    const firm = (inv.investor_profiles?.firm_name ?? '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || email.includes(q) || firm.includes(q);
  });

  const counts = {
    all: investors.length,
    applied: investors.filter(i => i.investor_status === 'applied').length,
    verified: investors.filter(i => i.investor_status === 'verified').length,
    rejected: investors.filter(i => i.investor_status === 'rejected').length,
  };

  // StatusBadge uses 'pending' for pending-style display; map 'applied' -> 'pending'
  function statusForBadge(status: string) {
    return status === 'applied' ? 'pending' : status;
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <ShieldCheck size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Investor Verification</h1>
            <p className="text-sm text-muted">Review and approve investor applications</p>
          </div>
        </div>
        <button
          onClick={() => load(filter)}
          className="btn-secondary gap-2"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-xl border border-card-border bg-card-bg p-1">
        {(['all', 'applied', 'verified', 'rejected'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all ${
              filter === f
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:text-foreground hover:bg-card-border/30'
            }`}
          >
            {f === 'applied' && <Clock size={13} />}
            {f === 'verified' && <CheckCircle2 size={13} />}
            {f === 'rejected' && <XCircle size={13} />}
            <span className="capitalize">{f}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              filter === f ? 'bg-white/20' : 'bg-card-border'
            }`}>
              {counts[f] ?? investors.length}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Search by name, email, or firm..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-xl border border-card-border bg-card-bg pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="card-elevated rounded-xl flex justify-center py-16">
          <RefreshCw className="animate-spin text-primary" size={28} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-elevated rounded-xl py-16 text-center">
          <Users size={48} className="mx-auto mb-4 text-muted/20" />
          <p className="text-sm font-medium text-muted">No investor applications found</p>
          <p className="mt-1 text-xs text-muted/70">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inv) => {
            const ip = inv.investor_profiles;
            const isExpanded = expanded === inv.id;
            return (
              <div key={inv.id} className="card-elevated rounded-xl overflow-hidden transition-all">
                {/* Row */}
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Name + Email */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{inv.full_name ?? '--'}</span>
                      {ip?.firm_name && (
                        <span className="rounded-md bg-card-border/40 px-2 py-0.5 text-xs font-medium text-muted">{ip.firm_name}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted mt-0.5">{inv.email}</div>
                  </div>

                  {/* Type */}
                  <div className="hidden sm:block text-sm text-muted w-32 shrink-0">
                    {ip ? (
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                        {INVESTOR_TYPE_LABELS[ip.investor_type] ?? ip.investor_type}
                      </span>
                    ) : '--'}
                  </div>

                  {/* Check size */}
                  <div className="hidden md:flex items-center gap-1 text-sm text-muted w-32 shrink-0">
                    {ip?.check_size_min ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
                        <DollarSign size={12} className="text-emerald-500" />
                        {ip.check_size_min}
                        {ip.check_size_max && ` - ${ip.check_size_max}`}
                      </span>
                    ) : '--'}
                  </div>

                  {/* Applied date */}
                  <div className="hidden lg:block text-xs text-muted w-28 shrink-0">
                    {ip?.created_at ? format(new Date(ip.created_at), 'MMM d, yyyy') : '--'}
                  </div>

                  {/* Status */}
                  <div className="shrink-0">
                    <StatusBadge status={statusForBadge(inv.investor_status)} />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {inv.investor_status === 'applied' && (
                      <>
                        <button
                          onClick={() => handleApprove(inv.id)}
                          disabled={!!actionLoading}
                          className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition-all hover:bg-emerald-700 hover:shadow-md disabled:opacity-50"
                        >
                          {actionLoading === inv.id + '-approve' ? '...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => setRejectModal({ id: inv.id, name: inv.full_name ?? inv.email })}
                          disabled={!!actionLoading}
                          className="btn-danger text-xs"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {inv.investor_status === 'verified' && (
                      <button
                        onClick={() => handleRevoke(inv.id)}
                        disabled={!!actionLoading}
                        className="rounded-lg border-2 border-amber-500 px-3.5 py-1.5 text-xs font-semibold text-amber-600 transition-all hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50"
                      >
                        {actionLoading === inv.id + '-revoke' ? '...' : 'Revoke'}
                      </button>
                    )}
                    {inv.investor_status === 'rejected' && (
                      <button
                        onClick={() => handleApprove(inv.id)}
                        disabled={!!actionLoading}
                        className="rounded-lg border-2 border-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-emerald-600 transition-all hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-50"
                      >
                        {actionLoading === inv.id + '-approve' ? '...' : 'Approve'}
                      </button>
                    )}
                    <button
                      onClick={() => setExpanded(isExpanded ? null : inv.id)}
                      className="btn-ghost text-xs"
                    >
                      {isExpanded ? 'Hide' : 'Details'}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && ip && (
                  <div className="border-t border-card-border bg-card-bg/50 px-5 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-sm">
                    {inv.linkedin && (
                      <div>
                        <p className="text-xs font-semibold text-muted mb-1.5">LinkedIn</p>
                        <a
                          href={inv.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-primary hover:underline truncate text-sm"
                        >
                          <ExternalLink size={13} />
                          {inv.linkedin}
                        </a>
                      </div>
                    )}
                    {ip.website && (
                      <div>
                        <p className="text-xs font-semibold text-muted mb-1.5">Website</p>
                        <a
                          href={ip.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-primary hover:underline truncate text-sm"
                        >
                          <ExternalLink size={13} />
                          {ip.website}
                        </a>
                      </div>
                    )}
                    {ip.location && (
                      <div>
                        <p className="text-xs font-semibold text-muted mb-1.5">Location</p>
                        <p className="text-foreground">{ip.location}</p>
                      </div>
                    )}
                    {ip.affiliated_fund && (
                      <div>
                        <p className="text-xs font-semibold text-muted mb-1.5">Affiliated Fund</p>
                        <p className="text-foreground">{ip.affiliated_fund}</p>
                      </div>
                    )}
                    {ip.preferred_stages?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted mb-1.5">Preferred Stages</p>
                        <div className="flex flex-wrap gap-1.5">
                          {ip.preferred_stages.map((s: string) => (
                            <span key={s} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {ip.preferred_sectors?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted mb-1.5">Preferred Sectors</p>
                        <div className="flex flex-wrap gap-1.5">
                          {ip.preferred_sectors.map((s: string) => (
                            <span key={s} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {ip.thesis && (
                      <div className="sm:col-span-2 lg:col-span-3">
                        <p className="text-xs font-semibold text-muted mb-1.5">Investment Thesis</p>
                        <p className="text-foreground leading-relaxed rounded-lg bg-card-border/20 p-3">{ip.thesis}</p>
                      </div>
                    )}
                    {inv.investor_verified_at && (
                      <div>
                        <p className="text-xs font-semibold text-muted mb-1.5">Verified At</p>
                        <p className="text-foreground">{format(new Date(inv.investor_verified_at), 'MMM d, yyyy HH:mm')}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject confirmation modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-card-border bg-card-bg p-6 shadow-2xl animate-fade-in">
            <h3 className="text-lg font-semibold text-foreground">Reject Investor Application</h3>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              Rejecting application from <strong className="text-foreground">{rejectModal.name}</strong>. This will set their status to rejected.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setRejectModal(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!!actionLoading}
                className="btn-danger flex-1"
              >
                {actionLoading ? '...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
