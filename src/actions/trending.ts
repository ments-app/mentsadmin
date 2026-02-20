'use server';

import { createAdminClient, createAuthClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export type TrendingPostRow = {
  id: string;
  content: string | null;
  created_at: string;
  author_id: string;
  likes: number;
  replies: number;
  engagement_score: number;
  override_status: 'pinned' | 'removed' | null;
  author: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
};

export async function getTrendingPosts(): Promise<TrendingPostRow[]> {
  const supabase = createAdminClient();

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const { data: recentPosts } = await supabase
    .from('posts')
    .select('id, content, created_at, author_id')
    .eq('deleted', false)
    .is('parent_post_id', null)
    .gte('created_at', fourteenDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(500);

  if (!recentPosts || recentPosts.length === 0) return [];

  const postIds = recentPosts.map((p: { id: string }) => p.id);
  const authorIds = [...new Set(recentPosts.map((p: { author_id: string }) => p.author_id))];

  const [likesRes, repliesRes, mediaRes, authorsRes, overridesRes] = await Promise.all([
    supabase.from('post_likes').select('post_id').in('post_id', postIds),
    supabase.from('posts').select('parent_post_id').in('parent_post_id', postIds).eq('deleted', false),
    supabase.from('post_media').select('post_id').in('post_id', postIds),
    supabase.from('users').select('id, username, full_name, avatar_url').in('id', authorIds),
    supabase.from('trending_overrides').select('post_id, status'),
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

  const authorsMap = new Map<string, { username: string; full_name: string; avatar_url: string | null }>();
  authorsRes.data?.forEach((a: { id: string; username: string; full_name: string; avatar_url: string | null }) => {
    authorsMap.set(a.id, { username: a.username, full_name: a.full_name, avatar_url: a.avatar_url });
  });

  const overridesMap = new Map<string, string>();
  overridesRes.data?.forEach((o: { post_id: string; status: string }) => {
    overridesMap.set(o.post_id, o.status);
  });

  const now = Date.now();

  const scored = recentPosts.map((p: { id: string; content: string | null; created_at: string; author_id: string }) => {
    const likes = likesMap.get(p.id) || 0;
    const replies = repliesMap.get(p.id) || 0;
    const mediaCount = Math.min(mediaMap.get(p.id) || 0, 3);
    const ageMs = now - new Date(p.created_at).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);

    const recencyMultiplier = ageHours <= 24 ? 1.5 : ageHours <= 48 ? 1.2 : 1.0;
    const velocityBonus = ageHours > 0 ? (likes / ageHours) * 10 : 0;
    const score = ((likes * 3) + (replies * 5) + (mediaCount * 2) + velocityBonus) * recencyMultiplier;

    const overrideStatus = overridesMap.get(p.id) as 'pinned' | 'removed' | undefined;

    return {
      id: p.id,
      content: p.content,
      created_at: p.created_at,
      author_id: p.author_id,
      likes,
      replies,
      engagement_score: Math.round(score * 10) / 10,
      override_status: overrideStatus || null,
      author: authorsMap.get(p.author_id) || { username: 'unknown', full_name: 'Unknown', avatar_url: null },
    };
  });

  // Pinned first, then by score; removed posts still shown in admin but marked
  scored.sort((a, b) => {
    if (a.override_status === 'pinned' && b.override_status !== 'pinned') return -1;
    if (a.override_status !== 'pinned' && b.override_status === 'pinned') return 1;
    return b.engagement_score - a.engagement_score;
  });

  return scored.slice(0, 100);
}

export async function pinPost(postId: string) {
  const supabase = createAdminClient();
  const authClient = await createAuthClient();
  const { data: { user } } = await authClient.auth.getUser();

  await supabase
    .from('trending_overrides')
    .upsert({
      post_id: postId,
      status: 'pinned',
      pinned_by: user?.id || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'post_id' });

  revalidatePath('/dashboard/trending');
}

export async function removePost(postId: string) {
  const supabase = createAdminClient();

  await supabase
    .from('trending_overrides')
    .upsert({
      post_id: postId,
      status: 'removed',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'post_id' });

  revalidatePath('/dashboard/trending');
}

export async function resetPost(postId: string) {
  const supabase = createAdminClient();

  await supabase
    .from('trending_overrides')
    .delete()
    .eq('post_id', postId);

  revalidatePath('/dashboard/trending');
}
