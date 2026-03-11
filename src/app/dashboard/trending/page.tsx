'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { TrendingUp, Pin, EyeOff, RotateCcw, Loader2 } from 'lucide-react';
import { getTrendingPosts, pinPost, removePost, resetPost, type TrendingPostRow } from '@/actions/trending';

export default function TrendingAdminPage() {
  const [posts, setPosts] = useState<TrendingPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function loadPosts() {
    setLoading(true);
    try {
      const data = await getTrendingPosts();
      setPosts(data);
    } catch (e) {
      console.error('Failed to load trending posts:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  async function handlePin(postId: string) {
    setActionLoading(postId);
    try {
      await pinPost(postId);
      await loadPosts();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRemove(postId: string) {
    setActionLoading(postId);
    try {
      await removePost(postId);
      await loadPosts();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReset(postId: string) {
    setActionLoading(postId);
    try {
      await resetPost(postId);
      await loadPosts();
    } finally {
      setActionLoading(null);
    }
  }

  function getStatusBadge(status: TrendingPostRow['override_status']) {
    switch (status) {
      case 'pinned':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
            <Pin size={11} />
            Pinned
          </span>
        );
      case 'removed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300">
            <EyeOff size={11} />
            Removed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            <TrendingUp size={11} />
            Trending
          </span>
        );
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <TrendingUp size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Trending Management</h1>
            <p className="text-sm text-muted">Pin, remove, or reset trending posts</p>
          </div>
        </div>
        <button
          onClick={loadPosts}
          disabled={loading}
          className="btn-secondary gap-2"
        >
          <RotateCcw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="card-elevated rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-card-border bg-card-bg/60">
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted w-14">Rank</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">Author</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">Content</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted text-right">Likes</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted text-right">Replies</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted text-right">Score</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">Posted</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 w-3/4 animate-pulse rounded-md bg-card-border/60" />
                    </td>
                  ))}
                </tr>
              ))
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-16 text-center">
                  <TrendingUp size={40} className="mx-auto mb-3 text-muted/30" />
                  <p className="text-sm font-medium text-muted">No trending posts found</p>
                  <p className="mt-1 text-xs text-muted/70">Posts will appear here once they start trending</p>
                </td>
              </tr>
            ) : (
              posts.map((post, index) => (
                <tr key={post.id} className={`transition-colors hover:bg-primary/[0.03] ${post.override_status === 'removed' ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-4">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-card-border/40 font-mono text-xs font-semibold text-muted">
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {post.author.avatar_url ? (
                        <img src={post.author.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-card-border" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-2 ring-primary/20">
                          {post.author.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{post.author.full_name}</p>
                        <p className="text-xs text-muted">@{post.author.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 max-w-[220px]">
                    <p className="truncate text-sm text-foreground">{post.content || '(media post)'}</p>
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-sm text-foreground">{post.likes}</td>
                  <td className="px-5 py-4 text-right font-mono text-sm text-foreground">{post.replies}</td>
                  <td className="px-5 py-4 text-right">
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 font-mono text-sm font-bold text-primary">
                      {post.engagement_score}
                    </span>
                  </td>
                  <td className="px-5 py-4">{getStatusBadge(post.override_status)}</td>
                  <td className="px-5 py-4 text-xs text-muted whitespace-nowrap">
                    {format(new Date(post.created_at), 'MMM d, HH:mm')}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      {actionLoading === post.id ? (
                        <Loader2 size={16} className="animate-spin text-muted" />
                      ) : (
                        <>
                          {post.override_status !== 'pinned' && (
                            <button
                              onClick={() => handlePin(post.id)}
                              title="Pin to top"
                              className="rounded-lg p-2 text-muted transition-all hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40"
                            >
                              <Pin size={15} />
                            </button>
                          )}
                          {post.override_status !== 'removed' && (
                            <button
                              onClick={() => handleRemove(post.id)}
                              title="Remove from trending"
                              className="rounded-lg p-2 text-muted transition-all hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                            >
                              <EyeOff size={15} />
                            </button>
                          )}
                          {post.override_status && (
                            <button
                              onClick={() => handleReset(post.id)}
                              title="Reset to auto"
                              className="rounded-lg p-2 text-muted transition-all hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40"
                            >
                              <RotateCcw size={15} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
