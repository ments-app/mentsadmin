'use client';

import { useEffect, useState } from 'react';
import { getInvestorApplications, approveInvestor, rejectInvestor, revokeInvestor } from '@/actions/investors';
import { format } from 'date-fns';
import {
  CheckCircle2, XCircle, Clock, RefreshCw, Search,
  ExternalLink, DollarSign, Target, Users,
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
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Investor Verification</h1>
          <p className="mt-1 text-sm text-muted">Review and approve investor applications</p>
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
        {(['all', 'applied', 'verified', 'rejected'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-primary text-white'
                : 'bg-card-bg border border-card-border text-muted hover:text-foreground'
            }`}
          >
            {f === 'applied' && <Clock size={12} />}
            {f === 'verified' && <CheckCircle2 size={12} />}
            {f === 'rejected' && <XCircle size={12} />}
            <span className="capitalize">{f}</span>
            <span className={`rounded-full px-1.5 py-0.5 text-xs ${
              filter === f ? 'bg-white/20' : 'bg-card-border'
            }`}>
              {counts[f] ?? investors.length}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Search by name, email, or firm..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-lg border border-card-border bg-card-bg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="animate-spin text-primary" size={24} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-muted">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p>No investor applications found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inv) => {
            const ip = inv.investor_profiles;
            const isExpanded = expanded === inv.id;
            return (
              <div key={inv.id} className="rounded-xl border border-card-border bg-card-bg overflow-hidden">
                {/* Row */}
                <div className="flex items-center gap-4 px-4 py-3">
                  {/* Name + Email */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{inv.full_name ?? '—'}</span>
                      {ip?.firm_name && (
                        <span className="text-xs text-muted">· {ip.firm_name}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted">{inv.email}</div>
                  </div>

                  {/* Type */}
                  <div className="hidden sm:block text-sm text-muted w-32 shrink-0">
                    {ip ? INVESTOR_TYPE_LABELS[ip.investor_type] ?? ip.investor_type : '—'}
                  </div>

                  {/* Check size */}
                  <div className="hidden md:flex items-center gap-1 text-sm text-muted w-32 shrink-0">
                    {ip?.check_size_min ? (
                      <>
                        <DollarSign size={12} />
                        {ip.check_size_min}
                        {ip.check_size_max && ` – ${ip.check_size_max}`}
                      </>
                    ) : '—'}
                  </div>

                  {/* Applied date */}
                  <div className="hidden lg:block text-sm text-muted w-28 shrink-0">
                    {ip?.created_at ? format(new Date(ip.created_at), 'MMM d, yyyy') : '—'}
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
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {actionLoading === inv.id + '-approve' ? '...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => setRejectModal({ id: inv.id, name: inv.full_name ?? inv.email })}
                          disabled={!!actionLoading}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {inv.investor_status === 'verified' && (
                      <button
                        onClick={() => handleRevoke(inv.id)}
                        disabled={!!actionLoading}
                        className="rounded-lg border border-orange-500 px-3 py-1.5 text-xs font-medium text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 disabled:opacity-50"
                      >
                        {actionLoading === inv.id + '-revoke' ? '...' : 'Revoke'}
                      </button>
                    )}
                    {inv.investor_status === 'rejected' && (
                      <button
                        onClick={() => handleApprove(inv.id)}
                        disabled={!!actionLoading}
                        className="rounded-lg border border-green-600 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50"
                      >
                        {actionLoading === inv.id + '-approve' ? '...' : 'Approve'}
                      </button>
                    )}
                    <button
                      onClick={() => setExpanded(isExpanded ? null : inv.id)}
                      className="rounded-lg border border-card-border px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground"
                    >
                      {isExpanded ? 'Hide' : 'Details'}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && ip && (
                  <div className="border-t border-card-border bg-background px-4 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    {inv.linkedin && (
                      <div>
                        <p className="text-xs font-medium text-muted mb-1">LinkedIn</p>
                        <a
                          href={inv.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline truncate"
                        >
                          <ExternalLink size={12} />
                          {inv.linkedin}
                        </a>
                      </div>
                    )}
                    {ip.website && (
                      <div>
                        <p className="text-xs font-medium text-muted mb-1">Website</p>
                        <a
                          href={ip.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline truncate"
                        >
                          <ExternalLink size={12} />
                          {ip.website}
                        </a>
                      </div>
                    )}
                    {ip.location && (
                      <div>
                        <p className="text-xs font-medium text-muted mb-1">Location</p>
                        <p className="text-foreground">{ip.location}</p>
                      </div>
                    )}
                    {ip.affiliated_fund && (
                      <div>
                        <p className="text-xs font-medium text-muted mb-1">Affiliated Fund</p>
                        <p className="text-foreground">{ip.affiliated_fund}</p>
                      </div>
                    )}
                    {ip.preferred_stages?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted mb-1">Preferred Stages</p>
                        <div className="flex flex-wrap gap-1">
                          {ip.preferred_stages.map((s: string) => (
                            <span key={s} className="rounded-full bg-card-border px-2 py-0.5 text-xs capitalize">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {ip.preferred_sectors?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted mb-1">Preferred Sectors</p>
                        <div className="flex flex-wrap gap-1">
                          {ip.preferred_sectors.map((s: string) => (
                            <span key={s} className="rounded-full bg-card-border px-2 py-0.5 text-xs">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {ip.thesis && (
                      <div className="sm:col-span-2 lg:col-span-3">
                        <p className="text-xs font-medium text-muted mb-1">Investment Thesis</p>
                        <p className="text-foreground leading-relaxed">{ip.thesis}</p>
                      </div>
                    )}
                    {inv.investor_verified_at && (
                      <div>
                        <p className="text-xs font-medium text-muted mb-1">Verified At</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl border border-card-border bg-card-bg p-6">
            <h3 className="text-lg font-semibold text-foreground">Reject Investor Application</h3>
            <p className="mt-1 text-sm text-muted">
              Rejecting application from <strong>{rejectModal.name}</strong>. This will set their status to rejected.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 rounded-lg border border-card-border px-4 py-2 text-sm text-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!!actionLoading}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
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
