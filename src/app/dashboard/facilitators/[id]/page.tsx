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
      <div className="flex justify-center py-20">
        <RefreshCw className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  if (!data) {
    return <div className="py-20 text-center text-muted">Facilitator not found</div>;
  }

  const fp = data.facilitator_profiles;
  const assignments = data.startup_facilitator_assignments ?? [];

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/facilitators')}
          className="flex items-center gap-1 text-sm text-muted hover:text-foreground mb-4"
        >
          <ArrowLeft size={16} /> Back to Facilitators
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {fp?.organisation_name ?? data.display_name ?? 'Facilitator'}
            </h1>
            <div className="mt-1 flex items-center gap-2">
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
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />
                  Approve
                </button>
                <button
                  onClick={() => setShowRejectForm(!showRejectForm)}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
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
                className="flex items-center gap-2 rounded-lg border border-orange-500 px-4 py-2 text-sm font-medium text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 disabled:opacity-50"
              >
                <ShieldAlert size={16} />
                Suspend
              </button>
            )}
          </div>
        </div>
      </div>

      {showRejectForm && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4">
          <h3 className="font-medium text-foreground mb-2">Rejection Reason</h3>
          <textarea
            value={rejectNotes}
            onChange={e => setRejectNotes(e.target.value)}
            placeholder="Provide a reason for rejection..."
            rows={3}
            className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setShowRejectForm(false)}
              className="rounded-lg border border-card-border px-4 py-2 text-sm text-muted"
            >Cancel</button>
            <button
              onClick={handleReject}
              disabled={!rejectNotes.trim() || !!actionLoading}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >Confirm Rejection</button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-card-border bg-card-bg p-6">
            <h2 className="font-semibold text-foreground mb-4">Organisation Details</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted flex items-center gap-1"><Building2 size={13} /> Organisation</dt>
                <dd className="mt-1 font-medium text-foreground">{fp?.organisation_name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-muted">Type</dt>
                <dd className="mt-1 font-medium text-foreground capitalize">{fp?.organisation_type?.replace('_', ' ') ?? '—'}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-muted flex items-center gap-1"><MapPin size={13} /> Address</dt>
                <dd className="mt-1 text-foreground">{fp?.organisation_address ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-muted flex items-center gap-1"><Mail size={13} /> Official Email</dt>
                <dd className="mt-1 text-foreground">{fp?.official_email ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-muted flex items-center gap-1"><Phone size={13} /> Contact</dt>
                <dd className="mt-1 text-foreground">{fp?.contact_number ?? '—'}</dd>
              </div>
              {fp?.website && (
                <div>
                  <dt className="text-muted flex items-center gap-1"><Globe size={13} /> Website</dt>
                  <dd className="mt-1">
                    <a href={fp.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      {fp.website}
                    </a>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-muted">Point of Contact</dt>
                <dd className="mt-1 text-foreground">{fp?.poc_name ?? '—'}</dd>
              </div>
            </dl>

            {fp?.document_url && (
              <div className="mt-4 border-t border-card-border pt-4">
                <a
                  href={fp.document_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <FileText size={14} /> View Supporting Document
                </a>
              </div>
            )}

            {fp?.verification_notes && (
              <div className="mt-4 border-t border-card-border pt-4">
                <dt className="text-xs text-muted uppercase tracking-wide">Admin Notes</dt>
                <dd className="mt-1 text-sm text-foreground">{fp.verification_notes}</dd>
              </div>
            )}
          </div>

          {/* Their Startups */}
          {assignments.length > 0 && (
            <div className="rounded-xl border border-card-border bg-card-bg p-6">
              <h2 className="font-semibold text-foreground mb-4">Managed Startups ({assignments.length})</h2>
              <div className="space-y-3">
                {assignments.map((a: any) => {
                  const sp = a.startup_profiles;
                  return (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border border-card-border p-3">
                      <div>
                        <div className="font-medium text-foreground text-sm">{sp?.brand_name ?? 'Unknown'}</div>
                        <div className="text-xs text-muted">{sp?.city}, {sp?.country} · {sp?.stage}</div>
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
          <div className="rounded-xl border border-card-border bg-card-bg p-6">
            <h2 className="font-semibold text-foreground mb-4">Account Details</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted">Email</dt>
                <dd className="text-foreground">{data.email}</dd>
              </div>
              <div>
                <dt className="text-muted">Registered</dt>
                <dd className="text-foreground">{format(new Date(data.created_at), 'MMM d, yyyy')}</dd>
              </div>
              {fp?.approved_at && (
                <div>
                  <dt className="text-muted">Approved</dt>
                  <dd className="text-foreground">{format(new Date(fp.approved_at), 'MMM d, yyyy')}</dd>
                </div>
              )}
              {fp?.rejected_at && (
                <div>
                  <dt className="text-muted">Rejected</dt>
                  <dd className="text-foreground">{format(new Date(fp.rejected_at), 'MMM d, yyyy')}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
