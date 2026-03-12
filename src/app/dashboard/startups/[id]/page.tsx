'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Pencil, ArrowLeft, Rocket, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import {
  getStartupProfile,
  toggleStartupFeatured,
  deleteStartupProfile,
  type StartupProfile,
} from '@/actions/startups';

const STAGE_LABELS: Record<string, string> = {
  ideation: 'Ideation',
  mvp: 'MVP',
  scaling: 'Scaling',
  expansion: 'Expansion',
  maturity: 'Maturity',
};

export default function StartupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [startup, setStartup] = useState<StartupProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getStartupProfile(id).then((data) => {
      setStartup(data);
      setLoading(false);
    });
  }, [id]);

  async function handleToggleFeatured() {
    if (!startup) return;
    setSaving(true);
    setError('');
    try {
      await toggleStartupFeatured(startup.id, !startup.is_featured);
      setStartup((prev) => prev ? { ...prev, is_featured: !prev.is_featured } : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteStartupProfile(id);
      router.push('/dashboard/startups');
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl animate-fade-in">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-card-border/50" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-card-border/50" />
          ))}
        </div>
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="mx-auto max-w-3xl py-24 text-center">
        <Rocket size={48} className="mx-auto mb-4 text-muted/30" />
        <p className="text-base font-medium text-foreground">Startup not found</p>
        <Link href="/dashboard/startups" className="btn-primary mt-4 inline-flex">Back to Startups</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      {/* Back + Header */}
      <button
        onClick={() => router.push('/dashboard/startups')}
        className="btn-ghost mb-6 gap-1.5 text-sm"
      >
        <ArrowLeft size={16} /> Back to Startups
      </button>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{startup.brand_name}</h1>
          <p className="mt-1 text-sm text-muted">Startup profile detail</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/startups/${startup.id}/edit`}
            className="btn-primary gap-1.5"
          >
            <Pencil size={14} /> Edit Profile
          </Link>
          <button
            onClick={handleToggleFeatured}
            disabled={saving}
            className="btn-secondary disabled:opacity-50"
          >
            {startup.is_featured ? 'Unfeature' : 'Feature'}
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="btn-danger"
          >
            Delete
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Status badges */}
        <div className="flex flex-wrap gap-2">
          {startup.is_featured && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/10 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Featured
            </span>
          )}
          {startup.stage && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium capitalize text-blue-700 ring-1 ring-inset ring-blue-600/10 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20">
              {STAGE_LABELS[startup.stage] || startup.stage}
            </span>
          )}
          {startup.is_actively_raising && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-600/10 dark:bg-purple-500/10 dark:text-purple-400 dark:ring-purple-500/20">
              Actively Raising
            </span>
          )}
        </div>

        {/* Basic Info */}
        <div className="card-elevated rounded-xl p-6" style={{ animationDelay: '50ms' }}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-4">Basic Info</h2>
          <div className="space-y-3">
            <Row label="Brand Name" value={startup.brand_name} />
            <Row label="Registered Name" value={startup.registered_name} />
            <Row label="Website" value={startup.website} />
            <Row label="Email" value={startup.startup_email} />
            <Row label="Phone" value={startup.startup_phone} />
            <Row label="Founded" value={startup.founded_date ? format(new Date(startup.founded_date), 'MMM yyyy') : null} />
            <Row label="Location" value={[startup.city, startup.country].filter(Boolean).join(', ') || null} />
            <Row label="Legal Status" value={startup.legal_status?.replace(/_/g, ' ')} />
            <Row label="CIN" value={startup.cin} />
            <Row label="Business Model" value={startup.business_model} />
            <Row label="Team Size" value={startup.team_size?.toString()} />
            <Row label="Visibility" value={startup.visibility} />
          </div>
        </div>

        {/* Owner */}
        <div className="card-elevated rounded-xl p-6" style={{ animationDelay: '100ms' }}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-4">Owner</h2>
          {startup.owner ? (
            <div className="space-y-3">
              <Row label="Name" value={startup.owner.full_name} />
              <Row label="Username" value={`@${startup.owner.username}`} />
              <Row label="Email" value={startup.owner.email} />
            </div>
          ) : (
            <p className="text-sm text-muted">Owner not found</p>
          )}
        </div>

        {/* Content */}
        {(startup.description || startup.elevator_pitch || startup.target_audience || startup.traction_metrics) && (
          <div className="card-elevated rounded-xl p-6" style={{ animationDelay: '150ms' }}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-4">Content</h2>
            <div className="space-y-4">
              {startup.description && <TextBlock label="Description" value={startup.description} />}
              {startup.elevator_pitch && <TextBlock label="Elevator Pitch" value={startup.elevator_pitch} />}
              {startup.target_audience && <TextBlock label="Target Audience" value={startup.target_audience} />}
              {startup.traction_metrics && <TextBlock label="Traction Metrics" value={startup.traction_metrics} />}
            </div>
          </div>
        )}

        {/* Fundraising */}
        {(startup.is_actively_raising || startup.total_raised || startup.investor_count) && (
          <div className="card-elevated rounded-xl p-6" style={{ animationDelay: '200ms' }}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-4">Fundraising</h2>
            <div className="space-y-3">
              <Row label="Actively Raising" value={startup.is_actively_raising ? 'Yes' : 'No'} />
              <Row label="Total Raised" value={startup.total_raised} />
              <Row label="Investor Count" value={startup.investor_count?.toString()} />
              {startup.pitch_deck_url && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-sm text-muted w-36 shrink-0">Pitch Deck</span>
                  <a
                    href={startup.pitch_deck_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline break-all"
                  >
                    <ExternalLink size={13} /> View Deck
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {(startup.categories.length > 0 || startup.keywords.length > 0) && (
          <div className="card-elevated rounded-xl p-6" style={{ animationDelay: '250ms' }}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-4">Tags & Categories</h2>
            {startup.categories.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-medium text-muted">Categories</p>
                <div className="flex flex-wrap gap-2">
                  {startup.categories.map((c) => (
                    <span key={c} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium capitalize text-blue-700 ring-1 ring-inset ring-blue-600/10 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20">{c}</span>
                  ))}
                </div>
              </div>
            )}
            {startup.keywords.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-muted">Keywords</p>
                <div className="flex flex-wrap gap-2">
                  {startup.keywords.map((k) => (
                    <span key={k} className="rounded-full bg-primary/5 px-3 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/10">{k}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Meta */}
        <div className="card-elevated rounded-xl p-6" style={{ animationDelay: '300ms' }}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-4">Meta</h2>
          <div className="space-y-3">
            <Row label="Created" value={format(new Date(startup.created_at), 'MMM d, yyyy HH:mm')} />
            <Row label="Updated" value={format(new Date(startup.updated_at), 'MMM d, yyyy HH:mm')} />
            <Row label="Profile ID" value={startup.id} mono />
            <Row label="Owner ID" value={startup.owner_id} mono />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 pt-2 border-t border-card-border">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Back
          </button>
        </div>
      </div>

      <DeleteConfirmModal
        open={showDelete}
        title={startup.brand_name}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        loading={deleting}
      />
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <span className="text-sm text-muted w-36 shrink-0">{label}</span>
      <span className={`text-sm text-foreground text-right break-all ${mono ? 'font-mono text-xs bg-background/80 px-2 py-0.5 rounded' : ''}`}>{value}</span>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-foreground">{label}</p>
      <p className="rounded-lg bg-background/50 p-3 text-sm text-muted leading-relaxed whitespace-pre-wrap">{value}</p>
    </div>
  );
}
