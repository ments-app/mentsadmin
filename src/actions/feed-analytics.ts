'use server';

import { createAdminClient } from '@/lib/supabase-server';

export async function getFeedAnalyticsSummary(days: number = 30) {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [impressions, engagements, dwellData, usersData, sessions] = await Promise.all([
    supabase
      .from('feed_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'impression')
      .gte('created_at', since),
    supabase
      .from('feed_events')
      .select('id', { count: 'exact', head: true })
      .in('event_type', ['like', 'reply', 'share', 'bookmark', 'click'])
      .gte('created_at', since),
    supabase
      .from('feed_events')
      .select('metadata')
      .eq('event_type', 'dwell')
      .gte('created_at', since)
      .limit(1000),
    supabase
      .from('feed_events')
      .select('user_id')
      .gte('created_at', since)
      .limit(10000),
    supabase
      .from('user_sessions')
      .select('feed_depth')
      .gte('started_at', since)
      .limit(5000),
  ]);

  const totalImpressions = impressions.count || 0;
  const totalEngagements = engagements.count || 0;
  const engagementRate = totalImpressions > 0 ? totalEngagements / totalImpressions : 0;

  const dwellValues = (dwellData.data || [])
    .map((e: { metadata: Record<string, unknown> }) => Number(e.metadata?.dwell_ms) || 0)
    .filter((v: number) => v > 0);
  const avgDwellMs = dwellValues.length > 0
    ? dwellValues.reduce((a: number, b: number) => a + b, 0) / dwellValues.length
    : 0;

  const uniqueUsers = new Set(
    (usersData.data || []).map((e: { user_id: string }) => e.user_id)
  ).size;

  const feedDepths = (sessions.data || []).map((s: { feed_depth: number }) => s.feed_depth);
  const avgFeedDepth = feedDepths.length > 0
    ? feedDepths.reduce((a: number, b: number) => a + b, 0) / feedDepths.length
    : 0;

  return {
    totalImpressions,
    totalEngagements,
    engagementRate: Math.round(engagementRate * 10000) / 100,
    avgDwellMs: Math.round(avgDwellMs),
    uniqueUsers,
    avgFeedDepth: Math.round(avgFeedDepth * 10) / 10,
  };
}

export async function getFeedAnalyticsDaily(days: number = 30) {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data } = await supabase
    .from('feed_analytics_daily')
    .select('*')
    .gte('date', since)
    .is('experiment_id', null)
    .order('date', { ascending: true });

  return data || [];
}

export async function getContentPerformance() {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Top posts by engagement
  const { data: topPosts } = await supabase
    .from('post_features')
    .select('post_id, engagement_score, virality_velocity, like_rate, reply_rate, ctr')
    .order('engagement_score', { ascending: false })
    .limit(20);

  // Top trending topics
  const { data: trendingTopics } = await supabase
    .from('trending_topics')
    .select('*')
    .order('velocity', { ascending: false })
    .limit(20);

  // Top creators by engagement
  const { data: creatorEvents } = await supabase
    .from('feed_events')
    .select('author_id, event_type')
    .in('event_type', ['like', 'reply', 'share'])
    .gte('created_at', since)
    .limit(5000);

  const creatorMap = new Map<string, number>();
  (creatorEvents || []).forEach((e: { author_id: string }) => {
    creatorMap.set(e.author_id, (creatorMap.get(e.author_id) || 0) + 1);
  });

  const topCreators = [...creatorMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => ({ author_id: id, engagement_count: count }));

  return {
    topPosts: topPosts || [],
    trendingTopics: trendingTopics || [],
    topCreators,
  };
}

export async function getExperimentsList() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('feed_experiments')
    .select('*')
    .order('created_at', { ascending: false });

  return data || [];
}

export async function getExperimentDetails(id: string) {
  const supabase = createAdminClient();

  const [experimentResult, assignmentsResult] = await Promise.all([
    supabase.from('feed_experiments').select('*').eq('id', id).single(),
    supabase.from('feed_experiment_assignments').select('variant_id').eq('experiment_id', id),
  ]);

  const variantCounts: Record<string, number> = {};
  (assignmentsResult.data || []).forEach((a: { variant_id: string }) => {
    variantCounts[a.variant_id] = (variantCounts[a.variant_id] || 0) + 1;
  });

  return {
    experiment: experimentResult.data,
    variantCounts,
  };
}

export async function getRetentionMetrics() {
  const supabase = createAdminClient();

  // DAU/WAU/MAU
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [dauResult, wauResult, mauResult, sessionsResult] = await Promise.all([
    supabase.from('feed_events').select('user_id').gte('created_at', dayAgo).limit(10000),
    supabase.from('feed_events').select('user_id').gte('created_at', weekAgo).limit(50000),
    supabase.from('feed_events').select('user_id').gte('created_at', monthAgo).limit(100000),
    supabase.from('user_sessions').select('feed_depth, user_id, started_at').gte('started_at', monthAgo).limit(10000),
  ]);

  const dau = new Set((dauResult.data || []).map((e: { user_id: string }) => e.user_id)).size;
  const wau = new Set((wauResult.data || []).map((e: { user_id: string }) => e.user_id)).size;
  const mau = new Set((mauResult.data || []).map((e: { user_id: string }) => e.user_id)).size;

  // Session depth distribution
  const depths = (sessionsResult.data || []).map((s: { feed_depth: number }) => s.feed_depth);
  const depthBuckets: Record<string, number> = { '0-5': 0, '6-10': 0, '11-20': 0, '21-50': 0, '50+': 0 };
  depths.forEach((d: number) => {
    if (d <= 5) depthBuckets['0-5']++;
    else if (d <= 10) depthBuckets['6-10']++;
    else if (d <= 20) depthBuckets['11-20']++;
    else if (d <= 50) depthBuckets['21-50']++;
    else depthBuckets['50+']++;
  });

  return {
    dau,
    wau,
    mau,
    depthDistribution: depthBuckets,
  };
}
