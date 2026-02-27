'use client';

import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Trash2, RotateCcw, Loader2,
  AlertTriangle, CheckCircle, XCircle, EyeOff, Eye, UserX, UserCheck,
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
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Feed Moderation</h1>
          <p className="mt-1 text-muted">Review posts and handle user reports</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-2 border-b border-card-border">
        <button
          onClick={() => setTab('posts')}
          className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === 'posts'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          All Posts
          <span className="ml-2 rounded-full bg-card-border px-1.5 py-0.5 text-xs">{postsTotal}</span>
        </button>
        <button
          onClick={() => setTab('reports')}
          className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === 'reports'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          Reports
          {reportsTotal > 0 && (
            <span className="ml-2 rounded-full bg-red-100 px-1.5 py-0.5 text-xs text-red-700 dark:bg-red-900 dark:text-red-300">
              {reportsTotal}
            </span>
          )}
        </button>
      </div>

      {/* Posts Tab */}
      {tab === 'posts' && (
        <div className="mt-4">
          <div className="flex gap-2 mb-4">
            {(['all', 'active', 'deleted'] as PostFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => { setPostFilter(f); setPostPage(1); }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  postFilter === f
                    ? 'bg-primary text-white'
                    : 'border border-card-border bg-card-bg text-muted hover:text-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-lg border border-card-border bg-card-bg">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-card-border">
                  <th className="px-4 py-3 font-medium text-muted">Author</th>
                  <th className="px-4 py-3 font-medium text-muted">Content</th>
                  <th className="px-4 py-3 font-medium text-muted">Type</th>
                  <th className="px-4 py-3 font-medium text-muted">Likes</th>
                  <th className="px-4 py-3 font-medium text-muted">Replies</th>
                  <th className="px-4 py-3 font-medium text-muted">Reports</th>
                  <th className="px-4 py-3 font-medium text-muted">Status</th>
                  <th className="px-4 py-3 font-medium text-muted">Posted</th>
                  <th className="px-4 py-3 font-medium text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {postsLoading ? (
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
                    <td colSpan={9} className="px-4 py-8 text-center text-muted">No posts found.</td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post.id} className={`hover:bg-primary-light/30 ${post.deleted ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {post.author.avatar_url ? (
                            <img src={post.author.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                              {post.author.full_name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate max-w-[100px]">{post.author.full_name}</p>
                            <p className="text-xs text-muted">@{post.author.username}</p>
                            {post.author.is_suspended && (
                              <span className="text-[10px] font-medium text-red-600 dark:text-red-400">Suspended</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="truncate text-sm text-foreground">
                          {post.content || <span className="italic text-muted">(media only)</span>}
                        </p>
                        {post.media_count > 0 && (
                          <p className="text-xs text-muted">{post.media_count} media</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium capitalize text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          {post.post_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">{post.likes}</td>
                      <td className="px-4 py-3 font-mono text-sm">{post.replies}</td>
                      <td className="px-4 py-3">
                        {post.report_count > 0 ? (
                          <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-300">
                            {post.report_count}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          post.deleted
                            ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                            : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        }`}>
                          {post.deleted ? <EyeOff size={10} /> : <Eye size={10} />}
                          {post.deleted ? 'Deleted' : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                        {format(new Date(post.created_at), 'MMM d, HH:mm')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {actionLoading === post.id || actionLoading === `user-${post.author_id}` ? (
                            <Loader2 size={15} className="animate-spin text-muted" />
                          ) : (
                            <>
                              {post.deleted ? (
                                <button
                                  onClick={() => handleRestorePost(post.id)}
                                  title="Restore post"
                                  className="rounded p-1.5 text-muted transition-colors hover:bg-primary-light hover:text-primary"
                                >
                                  <RotateCcw size={15} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDeletePost(post.id)}
                                  title="Delete post"
                                  className="rounded p-1.5 text-muted transition-colors hover:bg-red-50 hover:text-danger dark:hover:bg-red-950"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                              {post.author.is_suspended ? (
                                <button
                                  onClick={() => handleSuspendUser(post.author_id, true)}
                                  title="Unsuspend user"
                                  className="rounded p-1.5 text-muted transition-colors hover:bg-primary-light hover:text-primary"
                                >
                                  <UserCheck size={15} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleSuspendUser(post.author_id, false)}
                                  title="Suspend user"
                                  className="rounded p-1.5 text-muted transition-colors hover:bg-red-50 hover:text-danger dark:hover:bg-red-950"
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

          {postPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted">
              <span>Showing {(postPage - 1) * LIMIT + 1}–{Math.min(postPage * LIMIT, postsTotal)} of {postsTotal}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPostPage((p) => Math.max(1, p - 1))}
                  disabled={postPage === 1}
                  className="rounded-lg border border-card-border px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-primary-light"
                >
                  Prev
                </button>
                <span className="font-medium text-foreground">{postPage} / {postPages}</span>
                <button
                  onClick={() => setPostPage((p) => Math.min(postPages, p + 1))}
                  disabled={postPage === postPages}
                  className="rounded-lg border border-card-border px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-primary-light"
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
        <div className="mt-4">
          <div className="flex gap-2 mb-4">
            {(['pending', 'resolved', 'dismissed', 'all'] as ReportFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => { setReportFilter(f); setReportPage(1); }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  reportFilter === f
                    ? 'bg-primary text-white'
                    : 'border border-card-border bg-card-bg text-muted hover:text-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {reportsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-card-border bg-card-bg p-4 space-y-2">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-card-border" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-card-border" />
                </div>
              ))
            ) : reports.length === 0 ? (
              <div className="rounded-lg border border-card-border bg-card-bg p-8 text-center text-muted">
                No {reportFilter === 'all' ? '' : reportFilter} reports found.
              </div>
            ) : (
              reports.map((report) => (
                <div
                  key={report.id}
                  className="rounded-lg border border-card-border bg-card-bg p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-3">
                        <ReportStatusBadge status={report.status} />
                        <span className="inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                          {report.reason}
                        </span>
                        <span className="text-xs text-muted">
                          {format(new Date(report.created_at), 'MMM d, yyyy HH:mm')}
                        </span>
                      </div>

                      {report.post && (
                        <div className={`mb-3 rounded-lg border p-3 ${
                          report.post.deleted
                            ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
                            : 'border-card-border bg-background'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted">Post by</span>
                            {report.post_author && (
                              <span className="text-xs font-medium text-foreground">@{report.post_author.username}</span>
                            )}
                            {report.post.deleted && (
                              <span className="text-xs text-red-600 dark:text-red-400">(deleted)</span>
                            )}
                          </div>
                          <p className="text-sm text-foreground line-clamp-3">
                            {report.post.content || <span className="italic text-muted">(media post)</span>}
                          </p>
                        </div>
                      )}

                      <p className="text-xs text-muted">
                        Reported by{' '}
                        <span className="font-medium text-foreground">
                          {report.reporter ? `@${report.reporter.username}` : 'unknown'}
                        </span>
                        {report.additional_info && ` — "${report.additional_info}"`}
                      </p>

                      {report.moderator_notes && (
                        <p className="mt-2 rounded-lg border border-card-border bg-background px-3 py-2 text-xs text-muted">
                          <span className="font-medium text-foreground">Mod note:</span> {report.moderator_notes}
                        </p>
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
                                className="rounded-lg bg-danger px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-danger-hover"
                              >
                                Remove Post
                              </button>
                            )}
                            <button
                              onClick={() => { setResolveModal({ reportId: report.id, postId: report.reported_post_id, action: 'resolve' }); setModeratorNotes(''); }}
                              className="rounded-lg border border-card-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-card-border/30"
                            >
                              Resolve
                            </button>
                            <button
                              onClick={() => { setResolveModal({ reportId: report.id, postId: report.reported_post_id, action: 'dismiss' }); setModeratorNotes(''); }}
                              className="rounded-lg border border-card-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-card-border/30"
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

          {reportPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted">
              <span>Showing {(reportPage - 1) * LIMIT + 1}–{Math.min(reportPage * LIMIT, reportsTotal)} of {reportsTotal}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setReportPage((p) => Math.max(1, p - 1))}
                  disabled={reportPage === 1}
                  className="rounded-lg border border-card-border px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-primary-light"
                >
                  Prev
                </button>
                <span className="font-medium text-foreground">{reportPage} / {reportPages}</span>
                <button
                  onClick={() => setReportPage((p) => Math.min(reportPages, p + 1))}
                  disabled={reportPage === reportPages}
                  className="rounded-lg border border-card-border px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-primary-light"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl border border-card-border bg-card-bg p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">
              {resolveModal.action === 'delete_resolve' ? 'Remove Post & Resolve' :
               resolveModal.action === 'dismiss' ? 'Dismiss Report' : 'Mark as Resolved'}
            </h3>
            <p className="mt-2 text-sm text-muted">
              {resolveModal.action === 'delete_resolve'
                ? 'This will delete the reported post and mark the report as resolved.'
                : resolveModal.action === 'dismiss'
                ? 'This will dismiss the report without taking action on the post.'
                : 'This will mark the report as reviewed and resolved.'}
            </p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-foreground mb-1">Moderator Notes (optional)</label>
              <textarea
                value={moderatorNotes}
                onChange={(e) => setModeratorNotes(e.target.value)}
                placeholder="Add a note about your decision..."
                rows={3}
                className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setResolveModal(null); setModeratorNotes(''); }}
                disabled={!!actionLoading}
                className="rounded-lg border border-card-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card-border/30"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveSubmit}
                disabled={!!actionLoading}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors ${
                  resolveModal.action === 'delete_resolve' ? 'bg-danger hover:bg-danger-hover' :
                  resolveModal.action === 'dismiss' ? 'bg-primary/70 hover:bg-primary' : 'bg-primary hover:bg-primary-hover'
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
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
        <AlertTriangle size={10} /> Pending
      </span>
    );
  }
  if (status === 'resolved') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
        <CheckCircle size={10} /> Resolved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
      <XCircle size={10} /> Dismissed
    </span>
  );
}
