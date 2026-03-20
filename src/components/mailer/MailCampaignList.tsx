'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Mail, CheckCircle, AlertCircle, Clock, XCircle, Hourglass } from 'lucide-react';
import { getMailCampaigns } from '@/actions/mailer';
import type { MailCampaign } from '@/lib/types';
import Link from 'next/link';

interface Props {
  role: 'facilitator' | 'startup';
}

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
  sent: { icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: 'Sent' },
  failed: { icon: AlertCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', label: 'Failed' },
  partial: { icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', label: 'Partial' },
  pending_approval: { icon: Hourglass, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', label: 'Pending Approval' },
  rejected: { icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', label: 'Rejected' },
};

export default function MailCampaignList({ role }: Props) {
  const basePath = `/${role}/mailer`;

  const [campaigns, setCampaigns] = useState<MailCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMailCampaigns()
      .then(setCampaigns)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <Link href={basePath} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors mb-4">
        <ArrowLeft size={15} />
        Back to Mailer
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Sent History</h1>
        <p className="mt-1 text-sm text-muted">All your sent email campaigns</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-card-border/30" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-20">
          <Mail size={40} className="mx-auto text-muted/30 mb-3" />
          <p className="text-muted">No campaigns sent yet.</p>
          <Link href={`${basePath}/compose`} className="mt-3 text-sm text-primary hover:underline inline-block">
            Compose your first email
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-card-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-card-border/10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Recipients</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Sent At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {campaigns.map((campaign) => {
                const s = statusConfig[campaign.status] ?? statusConfig.sent;
                const Icon = s.icon;
                return (
                  <tr key={campaign.id} className="hover:bg-card-border/5 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground max-w-[300px] truncate">
                      {campaign.subject}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {campaign.recipient_count}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.color}`}>
                        <Icon size={12} />
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted text-xs">
                      {new Date(campaign.sent_at).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
