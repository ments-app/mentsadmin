'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Building2, Globe, Mail, Phone, MapPin, CheckCircle2,
  Clock, XCircle, Loader2, Search, ShieldCheck, RefreshCw,
  Send, AlertCircle,
} from 'lucide-react';
import { getApprovedFacilitators, applyToFacilitator } from '@/actions/startup-profile';

type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | null;

const STATUS_CONFIG: Record<Exclude<ApplicationStatus, null>, { label: string; icon: React.ReactNode; className: string }> = {
  pending:   { label: 'Applied – Pending',  icon: <Clock size={12} />,        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  approved:  { label: 'Verified',           icon: <CheckCircle2 size={12} />, className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  rejected:  { label: 'Rejected',           icon: <XCircle size={12} />,      className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  suspended: { label: 'Suspended',          icon: <AlertCircle size={12} />,  className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

const ORG_TYPE_LABELS: Record<string, string> = {
  incubator:     'Incubator',
  accelerator:   'Accelerator',
  vc_fund:       'VC Fund',
  angel_network: 'Angel Network',
  government:    'Government Body',
  university:    'University',
  corporate:     'Corporate',
  ngo:           'NGO / Non-profit',
  other:         'Other',
};

export default function BrowseFacilitatorsPage() {
  const [facilitators, setFacilitators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [applying, setApplying] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getApprovedFacilitators();
      setFacilitators(data);
    } catch {
      // silently fail — show empty state
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleApply(facilitatorId: string, orgName: string) {
    setApplying(facilitatorId);
    setApplyError(null);
    setApplySuccess(null);
    try {
      await applyToFacilitator(facilitatorId);
      setApplySuccess(`Application sent to ${orgName}!`);
      // Update local state immediately
      setFacilitators(prev => prev.map(f =>
        f.id === facilitatorId ? { ...f, applicationStatus: 'pending' } : f
      ));
    } catch (e) {
      setApplyError(e instanceof Error ? e.message : 'Failed to apply');
    }
    setApplying(null);
    setTimeout(() => { setApplySuccess(null); setApplyError(null); }, 4000);
  }

  const filtered = facilitators.filter(f => {
    if (!search.trim()) return true;
    const fp = f.facilitator_profiles;
    const name = (fp?.organisation_name ?? f.display_name ?? '').toLowerCase();
    const type = (fp?.organisation_type ?? '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || type.includes(q) || (fp?.official_email ?? '').toLowerCase().includes(q);
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Browse Facilitators</h1>
        <p className="mt-1 text-sm text-muted">
          Connect with verified incubators, accelerators, and investors. Apply to get your startup verified and mentored.
        </p>
      </div>

      {/* Toast notifications */}
      {applySuccess && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle2 size={16} />
          {applySuccess}
        </div>
      )}
      {applyError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle size={16} />
          {applyError}
        </div>
      )}

      {/* Search */}
      <div className="mb-6 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Search by name, type, or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-xl border border-card-border bg-card-bg pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary"
        />
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted">
          <RefreshCw className="animate-spin" size={28} />
          <p className="text-sm">Loading facilitators...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted">
          <ShieldCheck size={44} className="opacity-30" />
          <p className="text-sm">{search ? 'No facilitators match your search.' : 'No approved facilitators available yet.'}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map(f => {
            const fp = f.facilitator_profiles;
            const orgName = fp?.organisation_name ?? f.display_name ?? 'Facilitator';
            const orgType = fp?.organisation_type;
            const status: ApplicationStatus = f.applicationStatus ?? null;

            return (
              <div
                key={f.id}
                className="flex flex-col rounded-2xl border border-card-border bg-card-bg p-5 transition-shadow hover:shadow-md"
              >
                {/* Card header */}
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                    {orgName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground text-sm leading-snug">{orgName}</h3>
                      {status && (
                        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CONFIG[status].className}`}>
                          {STATUS_CONFIG[status].icon}
                          {STATUS_CONFIG[status].label}
                        </span>
                      )}
                    </div>
                    {orgType && (
                      <span className="mt-0.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {ORG_TYPE_LABELS[orgType] ?? orgType}
                      </span>
                    )}
                  </div>
                </div>

                {/* Contact details */}
                <div className="mt-4 space-y-1.5 text-xs text-muted">
                  {fp?.poc_name && (
                    <div className="flex items-center gap-2">
                      <Building2 size={12} className="shrink-0" />
                      <span>{fp.poc_name}</span>
                    </div>
                  )}
                  {fp?.organisation_address && (
                    <div className="flex items-center gap-2">
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate">{fp.organisation_address}</span>
                    </div>
                  )}
                  {fp?.official_email && (
                    <div className="flex items-center gap-2">
                      <Mail size={12} className="shrink-0" />
                      <span className="truncate">{fp.official_email}</span>
                    </div>
                  )}
                  {fp?.contact_number && (
                    <div className="flex items-center gap-2">
                      <Phone size={12} className="shrink-0" />
                      <span>{fp.contact_number}</span>
                    </div>
                  )}
                  {fp?.website && (
                    <div className="flex items-center gap-2">
                      <Globe size={12} className="shrink-0" />
                      <a
                        href={fp.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-primary hover:underline"
                        onClick={e => e.stopPropagation()}
                      >
                        {fp.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>

                {/* Apply button */}
                <div className="mt-4 pt-4 border-t border-card-border">
                  {status === null ? (
                    <button
                      onClick={() => handleApply(f.id, orgName)}
                      disabled={applying === f.id}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      {applying === f.id
                        ? <><Loader2 size={14} className="animate-spin" /> Applying...</>
                        : <><Send size={14} /> Apply to this Facilitator</>}
                    </button>
                  ) : status === 'pending' ? (
                    <div className="flex items-center justify-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                      <Clock size={14} />
                      Application Pending Review
                    </div>
                  ) : status === 'approved' ? (
                    <div className="flex items-center justify-center gap-2 rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                      <CheckCircle2 size={14} />
                      Verified by this Facilitator
                    </div>
                  ) : status === 'rejected' ? (
                    <div className="flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                      <XCircle size={14} />
                      Application Rejected
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 rounded-lg border border-card-border px-4 py-2 text-sm text-muted">
                      <AlertCircle size={14} />
                      {STATUS_CONFIG[status]?.label ?? status}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info box */}
      {!loading && filtered.length > 0 && (
        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">How verification works</p>
              <p className="mt-1 text-xs text-blue-700/80 dark:text-blue-400/80">
                Apply to a facilitator — they will review your startup profile and verify you. Getting verified by a facilitator helps you build credibility on the Ments platform.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
