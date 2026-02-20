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
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            <Pin size={12} />
            Pinned
          </span>
        );
      case 'removed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-300">
            <EyeOff size={12} />
            Removed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
            <TrendingUp size={12} />
            Trending
          </span>
        );
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp size={24} className="text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Trending Management</h1>
            <p className="text-sm text-muted">Pin, remove, or reset trending posts</p>
          </div>
        </div>
        <button
          onClick={loadPosts}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-card-border bg-card-bg px-4 py-2 text-sm font-medium transition-colors hover:bg-primary-light"
        >
          <RotateCcw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-card-border bg-card-bg">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-card-border">
              <th className="px-4 py-3 font-medium text-muted w-12">Rank</th>
              <th className="px-4 py-3 font-medium text-muted">Author</th>
              <th className="px-4 py-3 font-medium text-muted">Content</th>
              <th className="px-4 py-3 font-medium text-muted text-right">Likes</th>
              <th className="px-4 py-3 font-medium text-muted text-right">Replies</th>
              <th className="px-4 py-3 font-medium text-muted text-right">Score</th>
              <th className="px-4 py-3 font-medium text-muted">Status</th>
              <th className="px-4 py-3 font-medium text-muted">Posted</th>
              <th className="px-4 py-3 font-medium text-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-card-border" />
                    </td>
                  ))}
                </tr>
              ))
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted">
                  No trending posts found.
                </td>
              </tr>
            ) : (
              posts.map((post, index) => (
                <tr key={post.id} className={`hover:bg-primary-light/30 ${post.override_status === 'removed' ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-mono text-xs text-muted">#{index + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {post.author.avatar_url ? (
                        <img src={post.author.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-light text-xs font-medium text-primary">
                          {post.author.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{post.author.full_name}</p>
                        <p className="text-xs text-muted">@{post.author.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="truncate text-sm">{post.content || '(media post)'}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm">{post.likes}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm">{post.replies}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-sm font-medium text-primary">{post.engagement_score}</span>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(post.override_status)}</td>
                  <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                    {format(new Date(post.created_at), 'MMM d, HH:mm')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {actionLoading === post.id ? (
                        <Loader2 size={16} className="animate-spin text-muted" />
                      ) : (
                        <>
                          {post.override_status !== 'pinned' && (
                            <button
                              onClick={() => handlePin(post.id)}
                              title="Pin to top"
                              className="rounded p-1.5 text-muted transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950"
                            >
                              <Pin size={16} />
                            </button>
                          )}
                          {post.override_status !== 'removed' && (
                            <button
                              onClick={() => handleRemove(post.id)}
                              title="Remove from trending"
                              className="rounded p-1.5 text-muted transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                            >
                              <EyeOff size={16} />
                            </button>
                          )}
                          {post.override_status && (
                            <button
                              onClick={() => handleReset(post.id)}
                              title="Reset to auto"
                              className="rounded p-1.5 text-muted transition-colors hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950"
                            >
                              <RotateCcw size={16} />
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
