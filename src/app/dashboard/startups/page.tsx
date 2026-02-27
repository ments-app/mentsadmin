'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Loader2, Eye, EyeOff, Star, StarOff, Pencil } from 'lucide-react';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import {
  getStartupProfiles,
  toggleStartupFeatured,
  toggleStartupPublished,
  deleteStartupProfile,
  type StartupProfile,
} from '@/actions/startups';

type Filter = 'all' | 'published' | 'unpublished' | 'featured';

const STAGE_LABELS: Record<string, string> = {
  idea: 'Idea',
  mvp: 'MVP',
  early_traction: 'Early Traction',
  scaling: 'Scaling',
  growth: 'Growth',
  mature: 'Mature',
};

const STAGE_COLORS: Record<string, string> = {
  idea: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  mvp: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  early_traction: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
  scaling: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  growth: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  mature: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
};

const LIMIT = 30;

export default function StartupsPage() {
  const [startups, setStartups] = useState<StartupProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StartupProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getStartupProfiles(filter, page, LIMIT);
      setStartups(result.startups);
      setTotal(result.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { load(); }, [load]);

  async function handleTogglePublished(id: string, current: boolean) {
    setActionLoading(`pub-${id}`);
    try { await toggleStartupPublished(id, !current); await load(); } finally { setActionLoading(null); }
  }

  async function handleToggleFeatured(id: string, current: boolean) {
    setActionLoading(`feat-${id}`);
    try { await toggleStartupFeatured(id, !current); await load(); } finally { setActionLoading(null); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteStartupProfile(deleteTarget.id);
      setStartups((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setTotal((t) => t - 1);
      setDeleteTarget(null);
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  }

  const pages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Startups</h1>
          <p className="mt-1 text-muted">Moderate startup listings</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mt-4 flex gap-2">
        {(['all', 'published', 'unpublished', 'featured'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              filter === f
                ? 'bg-primary text-white'
                : 'border border-card-border bg-card-bg text-muted hover:text-foreground'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-card-border bg-card-bg">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-card-border">
              <th className="px-4 py-3 font-medium text-muted">Startup</th>
              <th className="px-4 py-3 font-medium text-muted">Owner</th>
              <th className="px-4 py-3 font-medium text-muted">Stage</th>
              <th className="px-4 py-3 font-medium text-muted">Location</th>
              <th className="px-4 py-3 font-medium text-muted">Published</th>
              <th className="px-4 py-3 font-medium text-muted">Featured</th>
              <th className="px-4 py-3 font-medium text-muted">Created</th>
              <th className="px-4 py-3 font-medium text-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-card-border" />
                    </td>
                  ))}
                </tr>
              ))
            ) : startups.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted">
                  No startup profiles found.
                </td>
              </tr>
            ) : (
              startups.map((startup) => (
                <tr key={startup.id} className="hover:bg-primary-light/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {startup.logo_url ? (
                        <img src={startup.logo_url} alt="" className="h-7 w-7 rounded-md object-cover border border-card-border" />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                          {startup.brand_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground">{startup.brand_name}</p>
                        {startup.tagline && (
                          <p className="text-xs text-muted truncate max-w-[160px]">{startup.tagline}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {startup.owner ? (
                      <div>
                        <p className="text-foreground">{startup.owner.full_name}</p>
                        <p className="text-xs text-muted">@{startup.owner.username}</p>
                      </div>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {startup.stage ? (
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_COLORS[startup.stage] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STAGE_LABELS[startup.stage] || startup.stage}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {[startup.city, startup.country].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3">
                    {actionLoading === `pub-${startup.id}` ? (
                      <Loader2 size={14} className="animate-spin text-muted" />
                    ) : (
                      <button
                        onClick={() => handleTogglePublished(startup.id, startup.is_published)}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                          startup.is_published
                            ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {startup.is_published ? <Eye size={10} /> : <EyeOff size={10} />}
                        {startup.is_published ? 'Yes' : 'No'}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {actionLoading === `feat-${startup.id}` ? (
                      <Loader2 size={14} className="animate-spin text-muted" />
                    ) : (
                      <button
                        onClick={() => handleToggleFeatured(startup.id, startup.is_featured)}
                        className={`rounded p-1.5 transition-colors ${
                          startup.is_featured
                            ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950'
                            : 'text-muted hover:bg-primary-light hover:text-primary'
                        }`}
                      >
                        {startup.is_featured ? <Star size={15} fill="currentColor" /> : <StarOff size={15} />}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {format(new Date(startup.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/startups/${startup.id}`}
                        className="rounded p-1.5 text-muted transition-colors hover:bg-primary-light hover:text-primary"
                      >
                        <Pencil size={16} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <span>Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-card-border px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-primary-light"
            >
              Prev
            </button>
            <span className="font-medium text-foreground">{page} / {pages}</span>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="rounded-lg border border-card-border px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-primary-light"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        open={!!deleteTarget}
        title={deleteTarget?.brand_name ?? ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
