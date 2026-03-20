'use client';

import { useEffect, useState } from 'react';
import {
  Mail, CheckCircle, XCircle, Eye, EyeOff, Loader2, Inbox,
  User, Clock, Send, AlertCircle, X,
} from 'lucide-react';
import {
  getPendingCampaigns,
  approveCampaign,
  rejectCampaign,
} from '@/actions/mailer';
import type { MailCampaign } from '@/lib/types';

type CampaignWithSender = MailCampaign & { sender_email?: string; sender_name?: string };

export default function MailApprovalsPage() {
  const [campaigns, setCampaigns] = useState<CampaignWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    getPendingCampaigns()
      .then(setCampaigns)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleApprove(id: string) {
    setActionLoading(id);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const result = await approveCampaign(id);
      setSuccessMsg(`Campaign approved and sent to ${result.sent} recipient${result.sent !== 1 ? 's' : ''}.${result.failed > 0 ? ` ${result.failed} failed.` : ''}`);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: string) {
    setActionLoading(id);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await rejectCampaign(id, rejectReason);
      setSuccessMsg('Campaign rejected.');
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      setRejectModal(null);
      setRejectReason('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  }

  const previewCampaign = campaigns.find((c) => c.id === previewId);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mail Approvals</h1>
          <p className="mt-1 text-sm text-muted">Review and approve email campaigns before they are sent.</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          <Clock size={14} />
          {loading ? '—' : campaigns.length} pending
        </span>
      </div>

      {successMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-danger dark:bg-red-950">
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-card-border/30" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card-bg border border-card-border">
            <Inbox size={28} className="text-muted" />
          </div>
          <p className="text-sm font-medium text-foreground">No pending campaigns</p>
          <p className="text-xs text-muted">All email campaigns have been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-xl border border-card-border bg-card-bg overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-foreground truncate">{campaign.subject}</h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      {campaign.sender_name || campaign.sender_email || 'Unknown'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail size={12} />
                      {campaign.recipient_count} recipient{campaign.recipient_count !== 1 ? 's' : ''}
                    </span>
                    {campaign.cc_emails && campaign.cc_emails.length > 0 && (
                      <span className="flex items-center gap-1">
                        CC: {campaign.cc_emails.length}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(campaign.created_at).toLocaleString()}
                    </span>
                    <span className="rounded-full bg-card-border/40 px-2 py-0.5 text-[10px] font-medium">{campaign.sender_role}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewId(previewId === campaign.id ? null : campaign.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-card-border px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground transition-colors shrink-0"
                >
                  {previewId === campaign.id ? <EyeOff size={13} /> : <Eye size={13} />}
                  {previewId === campaign.id ? 'Hide' : 'Preview'}
                </button>
              </div>

              {/* Preview */}
              {previewId === campaign.id && (
                <div className="border-t border-card-border bg-white dark:bg-slate-900 px-5 py-5">
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: campaign.html_body }}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 border-t border-card-border px-5 py-3 bg-card-bg/50">
                <button
                  type="button"
                  onClick={() => { setRejectModal(campaign.id); setRejectReason(''); }}
                  disabled={actionLoading === campaign.id}
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors dark:border-red-800 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
                >
                  <XCircle size={14} />
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => handleApprove(campaign.id)}
                  disabled={actionLoading === campaign.id}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoading === campaign.id ? (
                    <><Loader2 size={14} className="animate-spin" /> Sending...</>
                  ) : (
                    <><Send size={14} /> Approve & Send</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <XCircle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Reject Campaign</h3>
                <p className="text-xs text-muted">The sender will see this reason.</p>
              </div>
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)..."
              rows={3}
              className="w-full rounded-xl border border-card-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="flex-1 rounded-xl border border-card-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-card-border/20 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReject(rejectModal)}
                disabled={actionLoading === rejectModal}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading === rejectModal ? 'Rejecting...' : 'Reject Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
