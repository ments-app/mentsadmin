'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import {
  getStartupProfile,
  toggleStartupFeatured,
  toggleStartupPublished,
  deleteStartupProfile,
  type StartupProfile,
} from '@/actions/startups';

const STAGE_LABELS: Record<string, string> = {
  idea: 'Idea',
  mvp: 'MVP',
  early_traction: 'Early Traction',
  scaling: 'Scaling',
  growth: 'Growth',
  mature: 'Mature',
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

  async function handleTogglePublished() {
    if (!startup) return;
    setSaving(true);
    setError('');
    try {
      await toggleStartupPublished(startup.id, !startup.is_published);
      setStartup((prev) => prev ? { ...prev, is_published: !prev.is_published } : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

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
      <div className="mx-auto max-w-2xl">
        <div className="h-8 w-48 animate-pulse rounded bg-card-border" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-card-border" />
          ))}
        </div>
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center text-muted">
        Startup not found.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{startup.brand_name}</h1>
          <p className="mt-1 text-muted text-sm">Startup profile</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePublished}
            disabled={saving}
            className="rounded-lg border border-card-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card-border/30 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin inline" /> : startup.is_published ? 'Unpublish' : 'Publish'}
          </button>
          <button
            onClick={handleToggleFeatured}
            disabled={saving}
            className="rounded-lg border border-card-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card-border/30 disabled:opacity-50"
          >
            {startup.is_featured ? 'Unfeature' : 'Feature'}
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-danger-hover"
          >
            Delete
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-danger dark:bg-red-950">
          {error}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {/* Status badges */}
        <div className="flex flex-wrap gap-2">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${startup.is_published ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
            {startup.is_published ? 'Published' : 'Unpublished'}
          </span>
          {startup.is_featured && (
            <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
              Featured
            </span>
          )}
          {startup.stage && (
            <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium capitalize text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {STAGE_LABELS[startup.stage] || startup.stage}
            </span>
          )}
          {startup.is_actively_raising && (
            <span className="inline-block rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">
              Actively Raising
            </span>
          )}
        </div>

        {/* Basic Info */}
        <div className="rounded-lg border border-card-border p-4 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Basic Info</h2>
          <Row label="Brand Name" value={startup.brand_name} />
          <Row label="Registered Name" value={startup.registered_name} />
          <Row label="Tagline" value={startup.tagline} />
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

        {/* Owner */}
        <div className="rounded-lg border border-card-border p-4 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Owner</h2>
          {startup.owner ? (
            <>
              <Row label="Name" value={startup.owner.full_name} />
              <Row label="Username" value={`@${startup.owner.username}`} />
              <Row label="Email" value={startup.owner.email} />
            </>
          ) : (
            <p className="text-sm text-muted">Owner not found</p>
          )}
        </div>

        {/* Content */}
        {(startup.description || startup.elevator_pitch || startup.problem_statement || startup.solution_statement) && (
          <div className="rounded-lg border border-card-border p-4 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Content</h2>
            {startup.description && <TextBlock label="Description" value={startup.description} />}
            {startup.elevator_pitch && <TextBlock label="Elevator Pitch" value={startup.elevator_pitch} />}
            {startup.problem_statement && <TextBlock label="Problem" value={startup.problem_statement} />}
            {startup.solution_statement && <TextBlock label="Solution" value={startup.solution_statement} />}
            {startup.target_audience && <TextBlock label="Target Audience" value={startup.target_audience} />}
            {startup.traction_metrics && <TextBlock label="Traction Metrics" value={startup.traction_metrics} />}
          </div>
        )}

        {/* Fundraising */}
        {(startup.is_actively_raising || startup.total_raised || startup.investor_count) && (
          <div className="rounded-lg border border-card-border p-4 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Fundraising</h2>
            <Row label="Actively Raising" value={startup.is_actively_raising ? 'Yes' : 'No'} />
            <Row label="Total Raised" value={startup.total_raised != null ? `₹${startup.total_raised.toLocaleString()}` : null} />
            <Row label="Investor Count" value={startup.investor_count?.toString()} />
            {startup.pitch_deck_url && (
              <div className="flex items-start justify-between gap-4">
                <span className="text-sm text-muted w-36 shrink-0">Pitch Deck</span>
                <a
                  href={startup.pitch_deck_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline break-all"
                >
                  View Deck
                </a>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {(startup.categories.length > 0 || startup.keywords.length > 0) && (
          <div className="rounded-lg border border-card-border p-4 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Tags & Categories</h2>
            {startup.categories.length > 0 && (
              <div>
                <p className="mb-1.5 text-sm text-muted">Categories</p>
                <div className="flex flex-wrap gap-1.5">
                  {startup.categories.map((c) => (
                    <span key={c} className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium capitalize text-blue-700 dark:bg-blue-900 dark:text-blue-300">{c}</span>
                  ))}
                </div>
              </div>
            )}
            {startup.keywords.length > 0 && (
              <div>
                <p className="mb-1.5 text-sm text-muted">Keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {startup.keywords.map((k) => (
                    <span key={k} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{k}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Meta */}
        <div className="rounded-lg border border-card-border p-4 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Meta</h2>
          <Row label="Created" value={format(new Date(startup.created_at), 'MMM d, yyyy HH:mm')} />
          <Row label="Updated" value={format(new Date(startup.updated_at), 'MMM d, yyyy HH:mm')} />
          <Row label="Profile ID" value={startup.id} mono />
          <Row label="Owner ID" value={startup.owner_id} mono />
        </div>

        <div className="flex gap-3 pt-2 border-t border-card-border">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-card-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card-border/30"
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
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-muted w-36 shrink-0">{label}</span>
      <span className={`text-sm text-foreground text-right break-all ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-sm font-medium text-foreground">{label}</p>
      <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">{value}</p>
    </div>
  );
}
