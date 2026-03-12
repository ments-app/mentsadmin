'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Loader2, Star, StarOff, Pencil, Plus, Rocket } from 'lucide-react';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import {
  getStartupProfiles,
  toggleStartupFeatured,
  deleteStartupProfile,
  type StartupProfile,
} from '@/actions/startups';

type Filter = 'all' | 'featured';

const STAGE_LABELS: Record<string, string> = {
  ideation: 'Ideation',
  mvp: 'MVP',
  scaling: 'Scaling',
  expansion: 'Expansion',
  maturity: 'Maturity',
};

const STAGE_COLORS: Record<string, string> = {
  ideation: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  mvp: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  scaling: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  expansion: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  maturity: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
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
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Startups</h1>
          <p className="mt-1 text-sm text-muted">Moderate startup listings</p>
        </div>
        <Link
          href="/dashboard/startups/create"
          className="btn-primary gap-1.5"
        >
          <Plus size={16} /> Create Profile
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-2">
        {(['all', 'featured'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all ${
              filter === f
                ? 'bg-primary text-white shadow-sm'
                : 'btn-ghost'
            }`}
          >
            {f === 'featured' && <Star size={13} className="mr-1.5 inline-block" />}
            {f}
          </button>
        ))}
        <span className="ml-auto self-center text-sm text-muted">{total} total</span>
      </div>

      {/* Table */}
      <div className="card-elevated overflow-hidden rounded-xl">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-card-border bg-background/50">
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">Startup</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">Owner</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">Stage</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">Location</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">Featured</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">Created</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 w-3/4 animate-pulse rounded-md bg-card-border/50" />
                    </td>
                  ))}
                </tr>
              ))
            ) : startups.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center">
                  <Rocket size={48} className="mx-auto mb-4 text-muted/30" />
                  <p className="text-base font-medium text-foreground">No startup profiles found</p>
                  <p className="mt-1 text-sm text-muted">Create a new startup profile to get started</p>
                </td>
              </tr>
            ) : (
              startups.map((startup) => (
                <tr key={startup.id} className="group transition-colors hover:bg-primary/[0.02]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {startup.logo_url ? (
                        <img src={startup.logo_url} alt="" className="h-9 w-9 rounded-lg object-cover border border-card-border" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                          {startup.brand_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground">{startup.brand_name}</p>
                        <p className="text-xs text-muted truncate max-w-[180px]">{startup.startup_email || startup.website || '\u2014'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {startup.owner ? (
                      <div>
                        <p className="text-foreground">{startup.owner.full_name}</p>
                        <p className="text-xs text-muted">@{startup.owner.username}</p>
                      </div>
                    ) : (
                      <span className="text-muted">&mdash;</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {startup.stage ? (
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_COLORS[startup.stage] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STAGE_LABELS[startup.stage] || startup.stage}
                      </span>
                    ) : (
                      <span className="text-muted">&mdash;</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-muted">
                    {[startup.city, startup.country].filter(Boolean).join(', ') || '\u2014'}
                  </td>
                  <td className="px-5 py-4">
                    {actionLoading === `feat-${startup.id}` ? (
                      <Loader2 size={16} className="animate-spin text-muted" />
                    ) : (
                      <button
                        onClick={() => handleToggleFeatured(startup.id, startup.is_featured)}
                        className={`rounded-lg p-2 transition-all ${
                          startup.is_featured
                            ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950'
                            : 'text-muted hover:bg-primary/5 hover:text-primary'
                        }`}
                      >
                        {startup.is_featured ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
                      </button>
                    )}
                  </td>
                  <td className="px-5 py-4 text-muted">
                    {format(new Date(startup.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/dashboard/startups/${startup.id}`}
                      className="btn-ghost !p-2 !rounded-lg"
                    >
                      <Pencil size={15} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm">
          <span className="text-muted">
            Showing <span className="font-medium text-foreground">{(page - 1) * LIMIT + 1}&ndash;{Math.min(page * LIMIT, total)}</span> of <span className="font-medium text-foreground">{total}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary !text-xs disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-3 font-medium text-foreground">{page} / {pages}</span>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="btn-secondary !text-xs disabled:opacity-40"
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
