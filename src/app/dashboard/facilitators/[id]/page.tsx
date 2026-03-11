'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFacilitatorById, approveFacilitator, rejectFacilitator, suspendFacilitator } from '@/actions/facilitators';
import { getAuditLogs } from '@/actions/facilitators';
import { format } from 'date-fns';
import {
  ArrowLeft, Building2, Mail, Phone, Globe, MapPin,
  FileText, CheckCircle2, XCircle, ShieldAlert, RefreshCw
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';

export default function FacilitatorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const result = await getFacilitatorById(id);
      setData(result);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function handleApprove() {
    setActionLoading('approve');
    await approveFacilitator(id, 'Approved via admin panel');
    await load();
    setActionLoading('');
  }

  async function handleReject() {
    if (!rejectNotes.trim()) return;
    setActionLoading('reject');
    await rejectFacilitator(id, rejectNotes);
    setShowRejectForm(false);
    await load();
    setActionLoading('');
  }

  async function handleSuspend() {
    const reason = prompt('Reason for suspension:');
    if (!reason) return;
    setActionLoading('suspend');
    await suspendFacilitator(id, reason);
    await load();
    setActionLoading('');
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <RefreshCw className="animate-spin text-primary" size={28} />
        <p className="mt-3 text-sm text-muted">Loading facilitator details...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-24 text-center">
        <Building2 size={48} className="mx-auto mb-4 text-muted/30" />
        <p className="text-base font-medium text-foreground">Facilitator not found</p>
        <button onClick={() => router.push('/dashboard/facilitators')} className="btn-primary mt-4">
          Back to Facilitators
        </button>
      </div>
    );
  }

  const fp = data.facilitator_profiles;
  const assignments = data.startup_facilitator_assignments ?? [];

  return (
    <div className="animate-fade-in">
      {/* Back nav */}
      <button
        onClick={() => router.push('/dashboard/facilitators')}
        className="btn-ghost mb-6 gap-1.5 text-sm"
      >
        <ArrowLeft size={16} /> Back to Facilitators
      </button>

      {/* Page Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {fp?.organisation_name ?? data.display_name ?? 'Facilitator'}
          </h1>
          <div className="mt-2 flex items-center gap-3">
            <StatusBadge status={data.verification_status} />
            <span className="text-sm text-muted capitalize">{fp?.organisation_type?.replace('_', ' ')}</span>
          </div>
        </div>

        <div className="flex gap-2">
          {data.verification_status === 'pending' && (
            <>
              <button
                onClick={handleApprove}
                disabled={!!actionLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                Approve
              </button>
              <button
                onClick={() => setShowRejectForm(!showRejectForm)}
                className="btn-danger gap-2"
              >
                <XCircle size={16} />
                Reject
              </button>
            </>
          )}
          {data.verification_status === 'approved' && (
            <button
              onClick={handleSuspend}
              disabled={!!actionLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-orange-400 px-4 py-2 text-sm font-medium text-orange-600 transition-all hover:bg-orange-50 dark:hover:bg-orange-900/20 disabled:opacity-50"
            >
              <ShieldAlert size={16} />
              Suspend
            </button>
          )}
        </div>
      </div>

      {/* Reject Form */}
      {showRejectForm && (
        <div className="mb-6 animate-fade-in rounded-xl border border-red-200 bg-red-50/50 dark:bg-red-900/10 dark:border-red-800/50 p-5">
          <h3 className="font-semibold text-foreground mb-2">Rejection Reason</h3>
          <textarea
            value={rejectNotes}
            onChange={e => setRejectNotes(e.target.value)}
            placeholder="Provide a reason for rejection..."
            rows={3}
            className="w-full rounded-xl border border-card-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setShowRejectForm(false)}
              className="btn-secondary"
            >Cancel</button>
            <button
              onClick={handleReject}
              disabled={!rejectNotes.trim() || !!actionLoading}
              className="btn-danger"
            >Confirm Rejection</button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-elevated rounded-xl p-6" style={{ animationDelay: '50ms' }}>
            <h2 className="text-base font-semibold text-foreground mb-5">Organisation Details</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 text-sm">
              <div>
                <dt className="text-muted flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide"><Building2 size={13} /> Organisation</dt>
                <dd className="mt-1.5 font-medium text-foreground">{fp?.organisation_name ?? '\u2014'}</dd>
              </div>
              <div>
                <dt className="text-muted text-xs font-medium uppercase tracking-wide">Type</dt>
                <dd className="mt-1.5 font-medium text-foreground capitalize">{fp?.organisation_type?.replace('_', ' ') ?? '\u2014'}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-muted flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide"><MapPin size={13} /> Address</dt>
                <dd className="mt-1.5 text-foreground">{fp?.organisation_address ?? '\u2014'}</dd>
              </div>
              <div>
                <dt className="text-muted flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide"><Mail size={13} /> Official Email</dt>
                <dd className="mt-1.5 text-foreground">{fp?.official_email ?? '\u2014'}</dd>
              </div>
              <div>
                <dt className="text-muted flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide"><Phone size={13} /> Contact</dt>
                <dd className="mt-1.5 text-foreground">{fp?.contact_number ?? '\u2014'}</dd>
              </div>
              {fp?.website && (
                <div>
                  <dt className="text-muted flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide"><Globe size={13} /> Website</dt>
                  <dd className="mt-1.5">
                    <a href={fp.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      {fp.website}
                    </a>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-muted text-xs font-medium uppercase tracking-wide">Point of Contact</dt>
                <dd className="mt-1.5 text-foreground">{fp?.poc_name ?? '\u2014'}</dd>
              </div>
            </dl>

            {fp?.document_url && (
              <div className="mt-5 border-t border-card-border pt-5">
                <a
                  href={fp.document_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost gap-2 text-primary"
                >
                  <FileText size={15} /> View Supporting Document
                </a>
              </div>
            )}

            {fp?.verification_notes && (
              <div className="mt-5 border-t border-card-border pt-5">
                <dt className="text-xs font-medium uppercase tracking-wider text-muted">Admin Notes</dt>
                <dd className="mt-2 rounded-lg bg-background/50 p-3 text-sm text-foreground">{fp.verification_notes}</dd>
              </div>
            )}
          </div>

          {/* Their Startups */}
          {assignments.length > 0 && (
            <div className="card-elevated rounded-xl p-6" style={{ animationDelay: '100ms' }}>
              <h2 className="text-base font-semibold text-foreground mb-4">Managed Startups <span className="ml-1 text-sm font-normal text-muted">({assignments.length})</span></h2>
              <div className="space-y-3">
                {assignments.map((a: any) => {
                  const sp = a.startup_profiles;
                  return (
                    <div key={a.id} className="flex items-center justify-between rounded-xl border border-card-border p-4 transition-colors hover:bg-background/50">
                      <div>
                        <div className="font-medium text-foreground text-sm">{sp?.brand_name ?? 'Unknown'}</div>
                        <div className="mt-0.5 text-xs text-muted">{sp?.city}, {sp?.country} &middot; {sp?.stage}</div>
                      </div>
                      <StatusBadge status={a.status} size="sm" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Side Info */}
        <div className="space-y-6">
          <div className="card-elevated rounded-xl p-6" style={{ animationDelay: '150ms' }}>
            <h2 className="text-base font-semibold text-foreground mb-5">Account Details</h2>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">Email</dt>
                <dd className="mt-1 text-foreground">{data.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">Registered</dt>
                <dd className="mt-1 text-foreground">{format(new Date(data.created_at), 'MMM d, yyyy')}</dd>
              </div>
              {fp?.approved_at && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">Approved</dt>
                  <dd className="mt-1 text-foreground">{format(new Date(fp.approved_at), 'MMM d, yyyy')}</dd>
                </div>
              )}
              {fp?.rejected_at && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">Rejected</dt>
                  <dd className="mt-1 text-foreground">{format(new Date(fp.rejected_at), 'MMM d, yyyy')}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
