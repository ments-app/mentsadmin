'use client';

import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Trash2, RotateCcw, Loader2,
  AlertTriangle, CheckCircle, XCircle, EyeOff, Eye, UserX, UserCheck,
  MessageSquare,
} from 'lucide-react';
import {
  getFeedPosts,
  getPostReports,
  deletePost,
  restorePost,
  resolveReport,
  deleteAndResolveReport,
  suspendUser,
  unsuspendUser,
  type FeedPostRow,
  type PostReport,
} from '@/actions/feed';

type Tab = 'posts' | 'reports';
type PostFilter = 'all' | 'active' | 'deleted';
type ReportFilter = 'pending' | 'resolved' | 'dismissed' | 'all';

const LIMIT = 30;

export default function FeedModerationPage() {
  const [tab, setTab] = useState<Tab>('posts');

  const [posts, setPosts] = useState<FeedPostRow[]>([]);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postPage, setPostPage] = useState(1);
  const [postFilter, setPostFilter] = useState<PostFilter>('all');
  const [postsLoading, setPostsLoading] = useState(true);

  const [reports, setReports] = useState<PostReport[]>([]);
  const [reportsTotal, setReportsTotal] = useState(0);
  const [reportPage, setReportPage] = useState(1);
  const [reportFilter, setReportFilter] = useState<ReportFilter>('pending');
  const [reportsLoading, setReportsLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resolveModal, setResolveModal] = useState<{ reportId: string; postId: string; action: 'delete_resolve' | 'dismiss' | 'resolve' } | null>(null);
  const [moderatorNotes, setModeratorNotes] = useState('');

  const loadPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      const result = await getFeedPosts(postFilter, postPage, LIMIT);
      setPosts(result.posts);
      setPostsTotal(result.total);
    } catch (e) {
      console.error(e);
    } finally {
      setPostsLoading(false);
    }
  }, [postFilter, postPage]);

  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const result = await getPostReports(reportFilter, reportPage, LIMIT);
      setReports(result.reports);
      setReportsTotal(result.total);
    } catch (e) {
      console.error(e);
    } finally {
      setReportsLoading(false);
    }
  }, [reportFilter, reportPage]);

  useEffect(() => { loadPosts(); }, [loadPosts]);
  useEffect(() => { loadReports(); }, [loadReports]);

  async function handleDeletePost(postId: string) {
    setActionLoading(postId);
    try { await deletePost(postId); await loadPosts(); } finally { setActionLoading(null); }
  }

  async function handleRestorePost(postId: string) {
    setActionLoading(postId);
    try { await restorePost(postId); await loadPosts(); } finally { setActionLoading(null); }
  }

  async function handleSuspendUser(userId: string, isSuspended: boolean) {
    setActionLoading(`user-${userId}`);
    try {
      if (isSuspended) await unsuspendUser(userId);
      else await suspendUser(userId, 'Suspended by admin');
      await loadPosts();
    } finally { setActionLoading(null); }
  }

  async function handleResolveSubmit() {
    if (!resolveModal) return;
    setActionLoading(resolveModal.reportId);
    try {
      if (resolveModal.action === 'delete_resolve') {
        await deleteAndResolveReport(resolveModal.reportId, resolveModal.postId, moderatorNotes);
      } else {
        await resolveReport(resolveModal.reportId, resolveModal.action === 'dismiss' ? 'dismissed' : 'resolved', moderatorNotes);
      }
      await loadReports();
      setResolveModal(null);
      setModeratorNotes('');
    } finally { setActionLoading(null); }
  }

  const postPages = Math.ceil(postsTotal / LIMIT);
  const reportPages = Math.ceil(reportsTotal / LIMIT);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <MessageSquare size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Feed Moderation</h1>
          <p className="text-sm text-muted">Review posts and handle user reports</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-card-border bg-card-bg p-1">
        <button
          onClick={() => setTab('posts')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            tab === 'posts'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted hover:text-foreground hover:bg-card-border/30'
          }`}
        >
          All Posts
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            tab === 'posts' ? 'bg-white/20' : 'bg-card-border'
          }`}>{postsTotal}</span>
        </button>
        <button
          onClick={() => setTab('reports')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            tab === 'reports'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted hover:text-foreground hover:bg-card-border/30'
          }`}
        >
          Reports
          {reportsTotal > 0 && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              tab === 'reports' ? 'bg-white/20' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
            }`}>
              {reportsTotal}
            </span>
          )}
        </button>
      </div>

      {/* Posts Tab */}
      {tab === 'posts' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2">
            {(['all', 'active', 'deleted'] as PostFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => { setPostFilter(f); setPostPage(1); }}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-all ${
                  postFilter === f
                    ? 'bg-primary text-white shadow-sm'
                    : 'btn-ghost'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Posts Table */}
          <div className="card-elevated rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-card-border bg-card-bg/60">
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">Author</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">Content</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">Type</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">Likes</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">Replies</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">Reports</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">Posted</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {postsLoading ? (
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
                      <MessageSquare size={40} className="mx-auto mb-3 text-muted/30" />
                      <p className="text-sm font-medium text-muted">No posts found</p>
                      <p className="mt-1 text-xs text-muted/70">Try adjusting your filter criteria</p>
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post.id} className={`transition-colors hover:bg-primary/[0.03] ${post.deleted ? 'opacity-50' : ''}`}>
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
                            <p className="text-sm font-medium text-foreground truncate max-w-[100px]">{post.author.full_name}</p>
                            <p className="text-xs text-muted">@{post.author.username}</p>
                            {post.author.is_suspended && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 dark:text-red-400">
                                <UserX size={9} /> Suspended
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 max-w-[200px]">
                        <p className="truncate text-sm text-foreground">
                          {post.content || <span className="italic text-muted">(media only)</span>}
                        </p>
                        {post.media_count > 0 && (
                          <p className="text-xs text-muted mt-0.5">{post.media_count} media</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold capitalize text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                          {post.post_type}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-sm text-foreground">{post.likes}</td>
                      <td className="px-5 py-4 font-mono text-sm text-foreground">{post.replies}</td>
                      <td className="px-5 py-4">
                        {post.report_count > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300">
                            {post.report_count}
                          </span>
                        ) : (
                          <span className="text-muted">--</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          post.deleted
                            ? 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        }`}>
                          {post.deleted ? <EyeOff size={11} /> : <Eye size={11} />}
                          {post.deleted ? 'Deleted' : 'Active'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-muted whitespace-nowrap">
                        {format(new Date(post.created_at), 'MMM d, HH:mm')}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          {actionLoading === post.id || actionLoading === `user-${post.author_id}` ? (
                            <Loader2 size={15} className="animate-spin text-muted" />
                          ) : (
                            <>
                              {post.deleted ? (
                                <button
                                  onClick={() => handleRestorePost(post.id)}
                                  title="Restore post"
                                  className="rounded-lg p-2 text-muted transition-all hover:bg-primary/10 hover:text-primary"
                                >
                                  <RotateCcw size={15} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDeletePost(post.id)}
                                  title="Delete post"
                                  className="rounded-lg p-2 text-muted transition-all hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                              {post.author.is_suspended ? (
                                <button
                                  onClick={() => handleSuspendUser(post.author_id, true)}
                                  title="Unsuspend user"
                                  className="rounded-lg p-2 text-muted transition-all hover:bg-primary/10 hover:text-primary"
                                >
                                  <UserCheck size={15} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleSuspendUser(post.author_id, false)}
                                  title="Suspend user"
                                  className="rounded-lg p-2 text-muted transition-all hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                                >
                                  <UserX size={15} />
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

          {/* Pagination */}
          {postPages > 1 && (
            <div className="flex items-center justify-between rounded-xl border border-card-border bg-card-bg px-5 py-3 text-sm">
              <span className="text-muted">Showing {(postPage - 1) * LIMIT + 1}--{Math.min(postPage * LIMIT, postsTotal)} of {postsTotal}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPostPage((p) => Math.max(1, p - 1))}
                  disabled={postPage === 1}
                  className="btn-ghost text-xs disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{postPage} / {postPages}</span>
                <button
                  onClick={() => setPostPage((p) => Math.min(postPages, p + 1))}
                  disabled={postPage === postPages}
                  className="btn-ghost text-xs disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {tab === 'reports' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2">
            {(['pending', 'resolved', 'dismissed', 'all'] as ReportFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => { setReportFilter(f); setReportPage(1); }}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-all ${
                  reportFilter === f
                    ? 'bg-primary text-white shadow-sm'
                    : 'btn-ghost'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Reports List */}
          <div className="space-y-3">
            {reportsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card-elevated rounded-xl p-5 space-y-3">
                  <div className="h-4 w-1/3 animate-pulse rounded-md bg-card-border/60" />
                  <div className="h-3 w-2/3 animate-pulse rounded-md bg-card-border/60" />
                </div>
              ))
            ) : reports.length === 0 ? (
              <div className="card-elevated rounded-xl p-16 text-center">
                <AlertTriangle size={40} className="mx-auto mb-3 text-muted/30" />
                <p className="text-sm font-medium text-muted">No {reportFilter === 'all' ? '' : reportFilter} reports found</p>
                <p className="mt-1 text-xs text-muted/70">Reports will appear here when users flag content</p>
              </div>
            ) : (
              reports.map((report) => (
                <div
                  key={report.id}
                  className="card-elevated rounded-xl p-5 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-3">
                        <ReportStatusBadge status={report.status} />
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          {report.reason}
                        </span>
                        <span className="text-xs text-muted">
                          {format(new Date(report.created_at), 'MMM d, yyyy HH:mm')}
                        </span>
                      </div>

                      {report.post && (
                        <div className={`mb-3 rounded-xl border p-4 ${
                          report.post.deleted
                            ? 'border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20'
                            : 'border-card-border bg-card-bg/50'
                        }`}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs text-muted">Post by</span>
                            {report.post_author && (
                              <span className="text-xs font-semibold text-foreground">@{report.post_author.username}</span>
                            )}
                            {report.post.deleted && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                                <EyeOff size={10} /> deleted
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-foreground line-clamp-3">
                            {report.post.content || <span className="italic text-muted">(media post)</span>}
                          </p>
                        </div>
                      )}

                      <p className="text-xs text-muted">
                        Reported by{' '}
                        <span className="font-semibold text-foreground">
                          {report.reporter ? `@${report.reporter.username}` : 'unknown'}
                        </span>
                        {report.additional_info && ` -- "${report.additional_info}"`}
                      </p>

                      {report.moderator_notes && (
                        <div className="mt-3 rounded-lg border border-card-border bg-card-bg/50 px-4 py-3 text-xs text-muted">
                          <span className="font-semibold text-foreground">Mod note:</span> {report.moderator_notes}
                        </div>
                      )}
                    </div>

                    {report.status === 'pending' && report.post && (
                      <div className="flex flex-col gap-2 shrink-0">
                        {actionLoading === report.id ? (
                          <Loader2 size={16} className="animate-spin text-muted" />
                        ) : (
                          <>
                            {!report.post.deleted && (
                              <button
                                onClick={() => { setResolveModal({ reportId: report.id, postId: report.reported_post_id, action: 'delete_resolve' }); setModeratorNotes(''); }}
                                className="btn-danger text-xs"
                              >
                                Remove Post
                              </button>
                            )}
                            <button
                              onClick={() => { setResolveModal({ reportId: report.id, postId: report.reported_post_id, action: 'resolve' }); setModeratorNotes(''); }}
                              className="btn-secondary text-xs"
                            >
                              Resolve
                            </button>
                            <button
                              onClick={() => { setResolveModal({ reportId: report.id, postId: report.reported_post_id, action: 'dismiss' }); setModeratorNotes(''); }}
                              className="btn-ghost text-xs"
                            >
                              Dismiss
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {reportPages > 1 && (
            <div className="flex items-center justify-between rounded-xl border border-card-border bg-card-bg px-5 py-3 text-sm">
              <span className="text-muted">Showing {(reportPage - 1) * LIMIT + 1}--{Math.min(reportPage * LIMIT, reportsTotal)} of {reportsTotal}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setReportPage((p) => Math.max(1, p - 1))}
                  disabled={reportPage === 1}
                  className="btn-ghost text-xs disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{reportPage} / {reportPages}</span>
                <button
                  onClick={() => setReportPage((p) => Math.min(reportPages, p + 1))}
                  disabled={reportPage === reportPages}
                  className="btn-ghost text-xs disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resolve modal */}
      {resolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-card-border bg-card-bg p-6 shadow-2xl animate-fade-in">
            <h3 className="text-lg font-semibold text-foreground">
              {resolveModal.action === 'delete_resolve' ? 'Remove Post & Resolve' :
               resolveModal.action === 'dismiss' ? 'Dismiss Report' : 'Mark as Resolved'}
            </h3>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              {resolveModal.action === 'delete_resolve'
                ? 'This will delete the reported post and mark the report as resolved.'
                : resolveModal.action === 'dismiss'
                ? 'This will dismiss the report without taking action on the post.'
                : 'This will mark the report as reviewed and resolved.'}
            </p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-foreground mb-1.5">Moderator Notes (optional)</label>
              <textarea
                value={moderatorNotes}
                onChange={(e) => setModeratorNotes(e.target.value)}
                placeholder="Add a note about your decision..."
                rows={3}
                className="w-full rounded-xl border border-card-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none transition-all"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setResolveModal(null); setModeratorNotes(''); }}
                disabled={!!actionLoading}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveSubmit}
                disabled={!!actionLoading}
                className={`flex items-center gap-2 ${
                  resolveModal.action === 'delete_resolve' ? 'btn-danger' : 'btn-primary'
                }`}
              >
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportStatusBadge({ status }: { status: PostReport['status'] }) {
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
        <AlertTriangle size={11} /> Pending
      </span>
    );
  }
  if (status === 'resolved') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
        <CheckCircle size={11} /> Resolved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
      <XCircle size={11} /> Dismissed
    </span>
  );
}
