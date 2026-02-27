'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export type FeedPostRow = {
  id: string;
  content: string | null;
  post_type: string;
  created_at: string;
  deleted: boolean;
  author_id: string;
  parent_post_id: string | null;
  likes: number;
  replies: number;
  media_count: number;
  report_count: number;
  author: {
    username: string;
    full_name: string;
    avatar_url: string | null;
    is_suspended: boolean;
  };
};

export type PostReport = {
  id: string;
  reported_post_id: string;
  reporter_id: string;
  reason: string;
  additional_info: string | null;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  updated_at: string | null;
  moderator_id: string | null;
  moderator_notes: string | null;
  post: {
    id: string;
    content: string | null;
    post_type: string;
    deleted: boolean;
    author_id: string;
  } | null;
  reporter: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
  post_author: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
};

export async function getFeedPosts(filter: 'all' | 'active' | 'deleted' = 'all', page = 1, limit = 50): Promise<{ posts: FeedPostRow[]; total: number }> {
  const supabase = createAdminClient();
  const offset = (page - 1) * limit;

  let query = supabase
    .from('posts')
    .select('id, content, post_type, created_at, deleted, author_id, parent_post_id', { count: 'exact' })
    .is('parent_post_id', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filter === 'active') query = query.eq('deleted', false);
  else if (filter === 'deleted') query = query.eq('deleted', true);

  const { data: posts, count } = await query;
  if (!posts || posts.length === 0) return { posts: [], total: count || 0 };

  const postIds = posts.map((p: { id: string }) => p.id);
  const authorIds = [...new Set(posts.map((p: { author_id: string }) => p.author_id))];

  const [likesRes, repliesRes, mediaRes, authorsRes, reportsRes] = await Promise.all([
    supabase.from('post_likes').select('post_id').in('post_id', postIds),
    supabase.from('posts').select('parent_post_id').in('parent_post_id', postIds),
    supabase.from('post_media').select('post_id').in('post_id', postIds),
    supabase.from('users').select('id, username, full_name, avatar_url, is_suspended').in('id', authorIds),
    supabase.from('post_reports').select('reported_post_id').in('reported_post_id', postIds).eq('status', 'pending'),
  ]);

  const likesMap = new Map<string, number>();
  likesRes.data?.forEach((l: { post_id: string }) => {
    likesMap.set(l.post_id, (likesMap.get(l.post_id) || 0) + 1);
  });

  const repliesMap = new Map<string, number>();
  repliesRes.data?.forEach((r: { parent_post_id: string }) => {
    repliesMap.set(r.parent_post_id, (repliesMap.get(r.parent_post_id) || 0) + 1);
  });

  const mediaMap = new Map<string, number>();
  mediaRes.data?.forEach((m: { post_id: string }) => {
    mediaMap.set(m.post_id, (mediaMap.get(m.post_id) || 0) + 1);
  });

  const authorsMap = new Map<string, { username: string; full_name: string; avatar_url: string | null; is_suspended: boolean }>();
  authorsRes.data?.forEach((a: { id: string; username: string; full_name: string; avatar_url: string | null; is_suspended: boolean }) => {
    authorsMap.set(a.id, { username: a.username, full_name: a.full_name, avatar_url: a.avatar_url, is_suspended: a.is_suspended });
  });

  const reportsMap = new Map<string, number>();
  reportsRes.data?.forEach((r: { reported_post_id: string }) => {
    reportsMap.set(r.reported_post_id, (reportsMap.get(r.reported_post_id) || 0) + 1);
  });

  return {
    posts: posts.map((p: { id: string; content: string | null; post_type: string; created_at: string; deleted: boolean; author_id: string; parent_post_id: string | null }) => ({
      id: p.id,
      content: p.content,
      post_type: p.post_type,
      created_at: p.created_at,
      deleted: p.deleted,
      author_id: p.author_id,
      parent_post_id: p.parent_post_id,
      likes: likesMap.get(p.id) || 0,
      replies: repliesMap.get(p.id) || 0,
      media_count: mediaMap.get(p.id) || 0,
      report_count: reportsMap.get(p.id) || 0,
      author: authorsMap.get(p.author_id) || { username: 'unknown', full_name: 'Unknown', avatar_url: null, is_suspended: false },
    })),
    total: count || 0,
  };
}

export async function getPostReports(filter: 'pending' | 'resolved' | 'dismissed' | 'all' = 'pending', page = 1, limit = 50): Promise<{ reports: PostReport[]; total: number }> {
  const supabase = createAdminClient();
  const offset = (page - 1) * limit;

  let query = supabase
    .from('post_reports')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filter !== 'all') query = query.eq('status', filter);

  const { data: reports, count } = await query;
  if (!reports || reports.length === 0) return { reports: [], total: count || 0 };

  const postIds = [...new Set(reports.map((r: { reported_post_id: string }) => r.reported_post_id))];
  const reporterIds = [...new Set(reports.map((r: { reporter_id: string }) => r.reporter_id))];

  const [postsRes, reportersRes] = await Promise.all([
    supabase.from('posts').select('id, content, post_type, deleted, author_id').in('id', postIds),
    supabase.from('users').select('id, username, full_name, avatar_url').in('id', reporterIds),
  ]);

  const postsMap = new Map<string, { id: string; content: string | null; post_type: string; deleted: boolean; author_id: string }>();
  postsRes.data?.forEach((p: { id: string; content: string | null; post_type: string; deleted: boolean; author_id: string }) => {
    postsMap.set(p.id, p);
  });

  const postAuthorIds = [...new Set((postsRes.data || []).map((p: { author_id: string }) => p.author_id))];
  const authorIds = [...new Set([...reporterIds, ...postAuthorIds])];

  const authorsRes = await supabase.from('users').select('id, username, full_name, avatar_url').in('id', authorIds);
  const authorsMap = new Map<string, { username: string; full_name: string; avatar_url: string | null }>();
  authorsRes.data?.forEach((a: { id: string; username: string; full_name: string; avatar_url: string | null }) => {
    authorsMap.set(a.id, { username: a.username, full_name: a.full_name, avatar_url: a.avatar_url });
  });

  const reportersMap = new Map<string, { username: string; full_name: string; avatar_url: string | null }>();
  reportersRes.data?.forEach((r: { id: string; username: string; full_name: string; avatar_url: string | null }) => {
    reportersMap.set(r.id, { username: r.username, full_name: r.full_name, avatar_url: r.avatar_url });
  });

  return {
    reports: reports.map((r: { id: string; reported_post_id: string; reporter_id: string; reason: string; additional_info: string | null; status: 'pending' | 'resolved' | 'dismissed'; created_at: string; updated_at: string | null; moderator_id: string | null; moderator_notes: string | null }) => {
      const post = postsMap.get(r.reported_post_id) || null;
      return {
        id: r.id,
        reported_post_id: r.reported_post_id,
        reporter_id: r.reporter_id,
        reason: r.reason,
        additional_info: r.additional_info,
        status: r.status,
        created_at: r.created_at,
        updated_at: r.updated_at,
        moderator_id: r.moderator_id,
        moderator_notes: r.moderator_notes,
        post,
        reporter: reportersMap.get(r.reporter_id) || null,
        post_author: post ? authorsMap.get(post.author_id) || null : null,
      };
    }),
    total: count || 0,
  };
}

export async function deletePost(postId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('posts').update({ deleted: true }).eq('id', postId);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/feed');
}

export async function restorePost(postId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('posts').update({ deleted: false }).eq('id', postId);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/feed');
}

export async function resolveReport(reportId: string, action: 'resolved' | 'dismissed', moderatorNotes?: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('post_reports')
    .update({
      status: action,
      updated_at: new Date().toISOString(),
      moderator_notes: moderatorNotes || null,
    })
    .eq('id', reportId);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/feed');
}

export async function deleteAndResolveReport(reportId: string, postId: string, moderatorNotes?: string) {
  const supabase = createAdminClient();
  await Promise.all([
    supabase.from('posts').update({ deleted: true }).eq('id', postId),
    supabase.from('post_reports').update({
      status: 'resolved',
      updated_at: new Date().toISOString(),
      moderator_notes: moderatorNotes || 'Post removed by moderator',
    }).eq('id', reportId),
  ]);
  revalidatePath('/dashboard/feed');
}

export async function suspendUser(userId: string, reason: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('users').update({
    is_suspended: true,
    suspended_at: new Date().toISOString(),
    suspended_reason: reason,
  }).eq('id', userId);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/feed');
}

export async function unsuspendUser(userId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('users').update({
    is_suspended: false,
    suspended_at: null,
    suspended_reason: null,
  }).eq('id', userId);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/feed');
}
