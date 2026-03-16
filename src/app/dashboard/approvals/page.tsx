'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Clock, Briefcase, Zap, CalendarDays, Trophy, Building2 } from 'lucide-react';
import { getPendingContent, reviewContent } from '@/actions/approvals';

type ContentType = 'job' | 'gig' | 'event' | 'competition';
type Tab = 'all' | ContentType;

const TYPE_META: Record<ContentType, { label: string; icon: React.ReactNode; color: string }> = {
  job:         { label: 'Job',         icon: <Briefcase size={14} />,    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  gig:         { label: 'Gig',         icon: <Zap size={14} />,          color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  event:       { label: 'Event',       icon: <CalendarDays size={14} />, color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  competition: { label: 'Competition', icon: <Trophy size={14} />,       color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
};

type Item = {
  id: string;
  title: string;
  created_at: string;
  startup_id: string | null;
  startup_profiles: { brand_name: string | null; logo_url: string | null } | null;
  _type: ContentType;
  [key: string]: unknown;
};

function itemSubtitle(item: Item): string {
  if (item._type === 'job')         return [item.company as string, item.job_type as string].filter(Boolean).join(' · ');
  if (item._type === 'gig')         return [item.category as string, item.budget as string].filter(Boolean).join(' · ');
  if (item._type === 'event')       return [item.event_type as string, item.event_date ? format(new Date(item.event_date as string), 'MMM d, yyyy') : ''].filter(Boolean).join(' · ');
  if (item._type === 'competition') return [item.domain as string, item.deadline ? `Due ${format(new Date(item.deadline as string), 'MMM d')}` : ''].filter(Boolean).join(' · ');
  return '';
}

export default function ApprovalsPage() {
  const [data, setData] = useState<{ jobs: Item[]; gigs: Item[]; events: Item[]; competitions: Item[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');
  const [acting, setActing] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Item | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  async function load() {
    setLoading(true);
    const res = await getPendingContent();
    setData(res as any);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const all: Item[] = data ? [...data.jobs, ...data.gigs, ...data.events, ...data.competitions]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) : [];

  const filtered = tab === 'all' ? all : all.filter(i => i._type === tab);

  const counts = {
    all:         all.length,
    job:         data?.jobs.length ?? 0,
    gig:         data?.gigs.length ?? 0,
    event:       data?.events.length ?? 0,
    competition: data?.competitions.length ?? 0,
  };

  async function handleApprove(item: Item) {
    setActing(item.id);
    try {
      await reviewContent(item._type, item.id, 'approved');
      setData(prev => prev ? {
        ...prev,
        [`${item._type}s`]: (prev[`${item._type}s` as keyof typeof prev] as Item[]).filter(i => i.id !== item.id),
      } : prev);
    } finally { setActing(null); }
  }

  async function handleRejectConfirm() {
    if (!rejectTarget) return;
    setActing(rejectTarget.id);
    try {
      await reviewContent(rejectTarget._type, rejectTarget.id, 'rejected', rejectReason || undefined);
      setData(prev => prev ? {
        ...prev,
        [`${rejectTarget._type}s`]: (prev[`${rejectTarget._type}s` as keyof typeof prev] as Item[]).filter(i => i.id !== rejectTarget.id),
      } : prev);
      setRejectTarget(null);
      setRejectReason('');
    } finally { setActing(null); }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'job', label: 'Jobs' },
    { id: 'gig', label: 'Gigs' },
    { id: 'event', label: 'Events' },
    { id: 'competition', label: 'Competitions' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Content Approvals</h1>
        <p className="mt-1 text-sm text-muted">Review and approve content submitted by startups.</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-card-border bg-card-bg p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {t.label}
            {counts[t.id] > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold leading-none ${
                tab === t.id ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
              }`}>
                {counts[t.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-card-border/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-card-border bg-card-bg py-16 text-center">
          <CheckCircle2 size={40} className="mb-3 text-primary/40" />
          <p className="font-medium text-foreground">All caught up!</p>
          <p className="mt-1 text-sm text-muted">No pending content to review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const meta = TYPE_META[item._type];
            const startup = item.startup_profiles;
            return (
              <div key={item.id} className="flex items-center gap-4 rounded-xl border border-card-border bg-card-bg px-5 py-4">
                {/* Type badge */}
                <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${meta.color}`}>
                  {meta.icon}
                  {meta.label}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{item.title}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted flex-wrap">
                    {startup ? (
                      <span className="flex items-center gap-1">
                        {startup.logo_url ? (
                          <img src={startup.logo_url} alt="" className="h-3.5 w-3.5 rounded-full object-cover" />
                        ) : (
                          <Building2 size={11} />
                        )}
                        {startup.brand_name ?? 'Unknown startup'}
                      </span>
                    ) : null}
                    {itemSubtitle(item) && <span>· {itemSubtitle(item)}</span>}
                    <span>· {format(new Date(item.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>

                {/* Pending badge */}
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
                  <Clock size={11} />
                  Pending
                </span>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(item)}
                    disabled={acting === item.id}
                    className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle2 size={13} />
                    Approve
                  </button>
                  <button
                    onClick={() => { setRejectTarget(item); setRejectReason(''); }}
                    disabled={acting === item.id}
                    className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                  >
                    <XCircle size={13} />
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-card-border bg-card-bg p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-foreground">Reject Submission</h2>
            <p className="mt-1 text-sm text-muted">
              Rejecting <span className="font-medium text-foreground">"{rejectTarget.title}"</span>
            </p>
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Reason <span className="text-muted">(optional)</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Tell the startup why this was rejected..."
                rows={3}
                className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary resize-none"
              />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setRejectTarget(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!!acting}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <XCircle size={14} />
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
