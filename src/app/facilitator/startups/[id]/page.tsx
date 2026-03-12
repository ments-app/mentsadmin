'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFacilitatorStartupDetail, approveStartup, rejectStartup, suspendStartup } from '@/actions/facilitators';
import { searchUserForTransfer, transferStartupOwnership } from '@/actions/facilitator-startups';
import { format } from 'date-fns';
import {
  ArrowLeft, Building2, Mail, Phone, Globe, MapPin, Calendar,
  Users, DollarSign, Award, Rocket, CheckCircle2, XCircle,
  ShieldAlert, RefreshCw, ExternalLink, Briefcase, Target,
  TrendingUp, Lightbulb, Layers, ArrowRightLeft, Search,
  UserCircle2, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';

function formatStartupId(uuid: string) {
  return 'MNT-' + uuid.replace(/-/g, '').slice(0, 8).toUpperCase();
}

export default function FacilitatorStartupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  // Transfer ownership
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferEmail, setTransferEmail] = useState('');
  const [transferSearching, setTransferSearching] = useState(false);
  const [transferUser, setTransferUser] = useState<any>(null);
  const [transferError, setTransferError] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await getFacilitatorStartupDetail(id);
      setData(result);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function handleApprove() {
    setActionLoading('approve');
    try {
      await approveStartup(data.profile.id);
      await load();
    } catch (e: any) { alert(e.message); }
    setActionLoading(null);
  }

  async function handleReject() {
    if (!rejectNotes.trim()) return;
    setActionLoading('reject');
    try {
      await rejectStartup(data.profile.id, rejectNotes);
      setRejectModal(false);
      setRejectNotes('');
      await load();
    } catch (e: any) { alert(e.message); }
    setActionLoading(null);
  }

  async function handleSuspend() {
    const reason = prompt('Reason for suspension:');
    if (!reason) return;
    setActionLoading('suspend');
    try {
      await suspendStartup(data.profile.id, reason);
      await load();
    } catch (e: any) { alert(e.message); }
    setActionLoading(null);
  }

  async function handleTransferSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!transferEmail.trim()) return;
    setTransferSearching(true);
    setTransferError('');
    setTransferUser(null);
    setTransferSuccess(false);
    try {
      const user = await searchUserForTransfer(transferEmail.trim());
      if (!user) {
        setTransferError('No user found with this email. They must register on Ments first.');
      } else {
        setTransferUser(user);
      }
    } catch (err) {
      setTransferError(err instanceof Error ? err.message : 'Search failed');
    }
    setTransferSearching(false);
  }

  async function handleTransfer() {
    if (!transferUser) return;
    setTransferring(true);
    setTransferError('');
    try {
      await transferStartupOwnership(id, transferUser.email);
      setTransferSuccess(true);
      setTransferUser(null);
      setTransferEmail('');
      await load();
    } catch (err) {
      setTransferError(err instanceof Error ? err.message : 'Transfer failed');
    }
    setTransferring(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <RefreshCw className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-500 font-medium">{error}</p>
        <Link href="/facilitator/startups" className="mt-4 inline-block text-sm text-primary hover:underline">
          ← Back to Startups
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const { profile: sp, assignment } = data;

  return (
    <div>
      {/* Back + header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/facilitator/startups"
            className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <span className="text-muted">/</span>
          <span className="text-sm font-medium text-foreground">{sp.brand_name}</span>
        </div>
        <StatusBadge status={assignment.status} />
      </div>

      {/* Action bar */}
      {(assignment.status === 'pending' || assignment.status === 'approved') && (
        <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-card-border bg-card-bg p-4">
          <span className="mr-2 self-center text-sm font-medium text-foreground">Actions:</span>
          {assignment.status === 'pending' && (
            <>
              <button
                onClick={handleApprove}
                disabled={!!actionLoading}
                className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                {actionLoading === 'approve' ? 'Approving...' : 'Approve'}
              </button>
              <button
                onClick={() => setRejectModal(true)}
                disabled={!!actionLoading}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                <XCircle size={14} /> Reject
              </button>
            </>
          )}
          {assignment.status === 'approved' && (
            <button
              onClick={handleSuspend}
              disabled={!!actionLoading}
              className="flex items-center gap-1.5 rounded-lg border border-orange-500 px-4 py-2 text-sm font-medium text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 disabled:opacity-50"
            >
              <ShieldAlert size={14} />
              {actionLoading === 'suspend' ? 'Suspending...' : 'Suspend'}
            </button>
          )}
        </div>
      )}

      {/* Banner + Logo */}
      <div className="relative mb-6 rounded-2xl overflow-hidden border border-card-border bg-card-bg">
        {sp.banner_url ? (
          <img src={sp.banner_url} alt="Banner" className="h-40 w-full object-cover" />
        ) : (
          <div className="h-40 w-full bg-primary/15" />
        )}
        <div className="px-6 pb-5">
          <div className="flex items-end gap-4 -mt-8">
            <div className="h-16 w-16 shrink-0 rounded-xl border-2 border-card-border bg-card-bg overflow-hidden shadow">
              {sp.logo_url ? (
                <img src={sp.logo_url} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/10 text-xl font-bold text-primary">
                  {sp.brand_name?.charAt(0) ?? '?'}
                </div>
              )}
            </div>
            <div className="pb-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-foreground leading-tight">{sp.brand_name}</h1>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-mono font-medium text-primary">
                  {formatStartupId(sp.id)}
                </span>
              </div>
              {sp.registered_name && sp.registered_name !== sp.brand_name && (
                <p className="text-xs text-muted mt-0.5">{sp.registered_name}</p>
              )}
            </div>
          </div>

          {/* Meta row */}
          <div className="mt-4 flex flex-wrap gap-2">
            {sp.stage && (
              <span className="rounded-full bg-card-bg border border-card-border px-3 py-1 text-xs font-medium text-foreground capitalize">
                {sp.stage}
              </span>
            )}
            {sp.legal_status && (
              <span className="rounded-full bg-card-bg border border-card-border px-3 py-1 text-xs font-medium text-muted">
                {sp.legal_status}
              </span>
            )}
            {sp.is_actively_raising && (
              <span className="rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-3 py-1 text-xs font-medium">
                Actively Raising
              </span>
            )}
          </div>

          {/* Contact row */}
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
            {(sp.city || sp.country) && (
              <div className="flex items-center gap-1">
                <MapPin size={12} />
                {[sp.city, sp.country].filter(Boolean).join(', ')}
              </div>
            )}
            {sp.website && (
              <a href={sp.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline">
                <Globe size={12} />
                {sp.website.replace(/^https?:\/\//, '')}
                <ExternalLink size={10} />
              </a>
            )}
            {sp.startup_email && (
              <div className="flex items-center gap-1">
                <Mail size={12} />
                {sp.startup_email}
              </div>
            )}
            {sp.startup_phone && (
              <div className="flex items-center gap-1">
                <Phone size={12} />
                {sp.startup_phone}
              </div>
            )}
            {sp.founded_date && (
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                Founded {format(new Date(sp.founded_date), 'MMM yyyy')}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left column — main content */}
        <div className="space-y-5 lg:col-span-2">
          {/* About */}
          {sp.description && (
            <Section icon={<Rocket size={16} />} title="About">
              <p className="text-sm text-muted leading-relaxed whitespace-pre-line">{sp.description}</p>
            </Section>
          )}

          {/* Elevator Pitch */}
          {sp.elevator_pitch && (
            <Section icon={<Lightbulb size={16} />} title="Elevator Pitch">
              <p className="text-sm text-muted leading-relaxed italic">"{sp.elevator_pitch}"</p>
            </Section>
          )}

          {/* Problem & Solution */}
          {(sp.problem_statement || sp.solution_statement) && (
            <Section icon={<Target size={16} />} title="Problem & Solution">
              {sp.problem_statement && (
                <div className="mb-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Problem</p>
                  <p className="text-sm text-foreground leading-relaxed">{sp.problem_statement}</p>
                </div>
              )}
              {sp.solution_statement && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Solution</p>
                  <p className="text-sm text-foreground leading-relaxed">{sp.solution_statement}</p>
                </div>
              )}
            </Section>
          )}

          {/* Market */}
          {(sp.target_audience || sp.business_model) && (
            <Section icon={<Layers size={16} />} title="Market">
              {sp.target_audience && (
                <div className="mb-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Target Audience</p>
                  <p className="text-sm text-foreground">{sp.target_audience}</p>
                </div>
              )}
              {sp.business_model && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Business Model</p>
                  <p className="text-sm text-foreground">{sp.business_model}</p>
                </div>
              )}
            </Section>
          )}

          {/* Team */}
          {sp.founders && sp.founders.length > 0 && (
            <Section icon={<Users size={16} />} title="Founders">
              <div className="space-y-3">
                {sp.founders.map((f: any) => (
                  <div key={f.id} className="flex items-start gap-3 rounded-lg border border-card-border p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {f.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{f.name}</p>
                      {f.role && <p className="text-xs text-muted">{f.role}</p>}
                      <div className="mt-1 flex gap-3 text-xs text-muted">
                        {f.email && <span className="flex items-center gap-1"><Mail size={10} />{f.email}</span>}
                        {f.linkedin_url && (
                          <a href={f.linkedin_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline">
                            <ExternalLink size={10} /> LinkedIn
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Funding Rounds */}
          {sp.funding_rounds && sp.funding_rounds.length > 0 && (
            <Section icon={<DollarSign size={16} />} title="Funding Rounds">
              <div className="space-y-2">
                {sp.funding_rounds.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border border-card-border px-3 py-2 text-sm">
                    <div>
                      <span className="font-medium text-foreground capitalize">{r.round_type ?? 'Round'}</span>
                      {r.investor && <span className="ml-2 text-muted">· {r.investor}</span>}
                    </div>
                    <div className="text-right text-muted">
                      {r.amount && <span className="font-medium text-foreground">{r.amount}</span>}
                      {r.round_date && <span className="ml-2 text-xs">{format(new Date(r.round_date), 'MMM yyyy')}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Right column — sidebar info */}
        <div className="space-y-5">
          {/* Traction */}
          {sp.traction_metrics && (
            <Section icon={<TrendingUp size={16} />} title="Traction">
              <p className="text-sm text-foreground leading-relaxed">{sp.traction_metrics}</p>
            </Section>
          )}

          {/* Financials */}
          {(sp.total_raised || sp.investor_count) && (
            <Section icon={<DollarSign size={16} />} title="Financials">
              {sp.total_raised && (
                <Kv label="Total Raised" value={sp.total_raised} />
              )}
              {sp.investor_count && (
                <Kv label="Investors" value={String(sp.investor_count)} />
              )}
            </Section>
          )}

          {/* Categories & Keywords */}
          {((sp.categories?.length ?? 0) > 0 || (sp.keywords?.length ?? 0) > 0) && (
            <Section icon={<Briefcase size={16} />} title="Categories">
              {sp.categories?.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {sp.categories.map((c: string) => (
                    <span key={c} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">{c}</span>
                  ))}
                </div>
              )}
              {sp.keywords?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {sp.keywords.map((k: string) => (
                    <span key={k} className="rounded-full bg-card-bg border border-card-border px-2.5 py-0.5 text-xs text-muted">{k}</span>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* Team size */}
          {sp.team_size && (
            <Section icon={<Users size={16} />} title="Team">
              <Kv label="Team Size" value={sp.team_size} />
            </Section>
          )}

          {/* Incubators */}
          {sp.incubators && sp.incubators.length > 0 && (
            <Section icon={<Building2 size={16} />} title="Incubators / Accelerators">
              <div className="space-y-1">
                {sp.incubators.map((inc: any) => (
                  <div key={inc.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{inc.program_name}</span>
                    {inc.year && <span className="text-xs text-muted">{inc.year}</span>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Awards */}
          {sp.awards && sp.awards.length > 0 && (
            <Section icon={<Award size={16} />} title="Awards">
              <div className="space-y-1">
                {sp.awards.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{a.award_name}</span>
                    {a.year && <span className="text-xs text-muted">{a.year}</span>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Pitch Deck */}
          {sp.pitch_deck_url && (
            <Section icon={<ExternalLink size={16} />} title="Pitch Deck">
              <a
                href={sp.pitch_deck_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                <ExternalLink size={14} /> View Pitch Deck
              </a>
            </Section>
          )}

          {/* Assignment info */}
          <Section icon={<Calendar size={16} />} title="Verification">
            <Kv label="Claimed" value={format(new Date(assignment.created_at), 'MMM d, yyyy')} />
            {assignment.reviewed_at && (
              <Kv label="Reviewed" value={format(new Date(assignment.reviewed_at), 'MMM d, yyyy')} />
            )}
            {assignment.notes && (
              <div className="mt-2 rounded-lg bg-background px-3 py-2 text-xs text-muted">
                <span className="font-medium">Notes:</span> {assignment.notes}
              </div>
            )}
          </Section>

          {/* Transfer Ownership */}
          <Section icon={<ArrowRightLeft size={16} />} title="Transfer Ownership">
            {transferSuccess ? (
              <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 p-3">
                <p className="text-xs font-medium text-green-700 dark:text-green-400">
                  Ownership transferred successfully!
                </p>
              </div>
            ) : !showTransfer ? (
              <div>
                <p className="text-xs text-muted mb-3">
                  Transfer this startup to another user. They&apos;ll become the owner on the platform.
                </p>
                <button
                  onClick={() => setShowTransfer(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-card-border px-3 py-2 text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <ArrowRightLeft size={13} /> Transfer to User
                </button>
              </div>
            ) : (
              <div>
                <form onSubmit={handleTransferSearch} className="flex gap-2 mb-3">
                  <input
                    type="email"
                    value={transferEmail}
                    onChange={(e) => setTransferEmail(e.target.value)}
                    placeholder="user@email.com"
                    className="flex-1 min-w-0 rounded-lg border border-card-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={transferSearching || !transferEmail.trim()}
                    className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50"
                  >
                    {transferSearching ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                  </button>
                </form>

                {transferError && (
                  <p className="mb-3 rounded-lg bg-red-50 dark:bg-red-950/50 p-2 text-[11px] text-red-600 dark:text-red-400">{transferError}</p>
                )}

                {transferUser && (
                  <div className="rounded-lg border border-card-border p-3">
                    <div className="flex items-center gap-2.5 mb-3">
                      {transferUser.avatar_url ? (
                        <img src={transferUser.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover border border-card-border" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <UserCircle2 size={16} className="text-primary" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{transferUser.full_name}</p>
                        <p className="text-[11px] text-muted truncate">@{transferUser.username}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setTransferUser(null); setTransferEmail(''); }}
                        className="flex-1 rounded-lg border border-card-border px-3 py-1.5 text-[11px] font-medium text-muted hover:text-foreground transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleTransfer}
                        disabled={transferring}
                        className="flex-1 rounded-lg bg-orange-500 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
                      >
                        {transferring ? 'Transferring...' : 'Confirm Transfer'}
                      </button>
                    </div>
                  </div>
                )}

                {!transferUser && (
                  <button
                    onClick={() => { setShowTransfer(false); setTransferEmail(''); setTransferError(''); }}
                    className="text-[11px] text-muted hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}
          </Section>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl border border-card-border bg-card-bg p-6">
            <h3 className="text-lg font-semibold text-foreground">Reject Startup</h3>
            <p className="mt-1 text-sm text-muted">Rejecting: <strong>{sp.brand_name}</strong></p>
            <textarea
              value={rejectNotes}
              onChange={e => setRejectNotes(e.target.value)}
              placeholder="Reason for rejection..."
              rows={3}
              className="mt-4 w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => { setRejectModal(false); setRejectNotes(''); }}
                className="flex-1 rounded-lg border border-card-border px-4 py-2 text-sm text-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectNotes.trim() || !!actionLoading}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === 'reject' ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-card-border bg-card-bg p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Kv({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
