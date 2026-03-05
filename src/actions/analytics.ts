'use server';

import { createAdminClient } from '@/lib/supabase-server';

// ─── Types ────────────────────────────────────────────────────

export interface PlatformOverview {
  users: number;
  startups: number;
  facilitators: number;
  jobs: number;
  gigs: number;
  events: number;
  competitions: number;
  applications: number;
  competitionEntries: number;
  activePosts: number;
  resources: number;
  suspendedUsers: number;
  pendingFacilitators: number;
  pendingReports: number;
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface ContentStats {
  jobs: {
    total: number;
    active: number;
    byCategory: Record<string, number>;
    byType: Record<string, number>;
    byWorkMode: Record<string, number>;
    byVisibility: Record<string, number>;
  };
  gigs: {
    total: number;
    active: number;
    byCategory: Record<string, number>;
    byPaymentType: Record<string, number>;
    byVisibility: Record<string, number>;
  };
  events: {
    total: number;
    active: number;
    featured: number;
    byCategory: Record<string, number>;
    byType: Record<string, number>;
    byVisibility: Record<string, number>;
  };
  competitions: {
    total: number;
    active: number;
    featured: number;
    external: number;
    byDomain: Record<string, number>;
    byParticipationType: Record<string, number>;
    byVisibility: Record<string, number>;
  };
}

export interface ApplicationFunnel {
  total: number;
  unique_applicants: number;
  funnel: { status: string; count: number; pct: number }[];
  aiRecommendations: { label: string; count: number; pct: number }[];
  avgScores: { overall: number; match: number; interview: number };
  integrity: { avgTabSwitches: number; avgTimeMinutes: number };
  scoreDistribution: { bucket: string; count: number }[];
}

export interface FacilitatorStats {
  total: number;
  byVerificationStatus: Record<string, number>;
  totalStudents: number;
  topByStudents: { id: string; name: string; studentCount: number; startupCount: number }[];
}

export interface StartupStats {
  total: number;
  published: number;
  featured: number;
  activelyRaising: number;
  byStage: Record<string, number>;
  topCategories: { category: string; count: number }[];
  topCities: { city: string; count: number }[];
  avgTotalRaised: number;
  avgInvestorCount: number;
}

export interface AuditLogEntry {
  id: string;
  action_type: string;
  actor_id: string;
  actor_role: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface TopOpportunities {
  topJobs: { id: string; title: string; applicationCount: number }[];
  topGigs: { id: string; title: string; applicationCount: number }[];
}

export interface UserSegmentation {
  total: number;
  verified: number;
  suspended: number;
  byUserType: Record<string, number>;
  newThisWeek: number;
  newThisMonth: number;
  verificationRate: number;
  suspensionRate: number;
}

export interface SkillDemand {
  skill: string;
  count: number;
}

export interface GeographicDistribution {
  startupCities: { city: string; count: number }[];
  jobLocations: { location: string; count: number }[];
  gigLocations: { location: string; count: number }[];
}

export interface ContentPipelineHealth {
  jobs: { active: number; total: number; activeRate: number };
  gigs: { active: number; total: number; activeRate: number };
  events: { active: number; total: number; activeRate: number };
  competitions: { active: number; total: number; activeRate: number };
  expiringSoon: { jobs: number; gigs: number; competitions: number };
  recentlyAdded: { jobs: number; gigs: number; events: number; competitions: number };
}

export interface PlatformPulse {
  users: { current: number; prev: number; growth: number };
  applications: { current: number; prev: number; growth: number };
  contentPosted: { current: number; prev: number; growth: number };
  totalRaisedAcrossPlatform: number;
  avgApplicationsPerJob: number;
  avgApplicationsPerGig: number;
}

// ─── Helpers ──────────────────────────────────────────────────

function groupBy(items: Record<string, unknown>[], key: string): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of items) {
    const k = String(item[key] ?? 'unknown');
    result[k] = (result[k] ?? 0) + 1;
  }
  return result;
}

function avg(nums: number[]): number {
  return nums.length > 0 ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0;
}

function topN(data: Record<string, number>, n: number): { key: string; count: number }[] {
  return Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([key, count]) => ({ key, count }));
}

function growthPct(current: number, prev: number): number {
  if (prev === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - prev) / prev) * 100);
}

// ─── Core Actions ─────────────────────────────────────────────

export async function getPlatformOverview(): Promise<PlatformOverview> {
  const supabase = createAdminClient();
  try {
    const [
      users, startups, facilitators, jobs, gigs, events, competitions,
      applications, competitionEntries, activePosts, resources,
      suspendedUsers, pendingFacilitators, pendingReports,
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('startup_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('admin_profiles').select('id', { count: 'exact', head: true })
        .eq('role', 'facilitator').eq('verification_status', 'approved'),
      supabase.from('jobs').select('id', { count: 'exact', head: true }),
      supabase.from('gigs').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('competitions').select('id', { count: 'exact', head: true }),
      supabase.from('applications').select('id', { count: 'exact', head: true }).neq('status', 'in_progress'),
      supabase.from('competition_entries').select('competition_id', { count: 'exact', head: true }),
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('deleted', false),
      supabase.from('resources').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_suspended', true),
      supabase.from('admin_profiles').select('id', { count: 'exact', head: true })
        .eq('role', 'facilitator').eq('verification_status', 'pending'),
      supabase.from('post_reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    return {
      users: users.count ?? 0,
      startups: startups.count ?? 0,
      facilitators: facilitators.count ?? 0,
      jobs: jobs.count ?? 0,
      gigs: gigs.count ?? 0,
      events: events.count ?? 0,
      competitions: competitions.count ?? 0,
      applications: applications.count ?? 0,
      competitionEntries: competitionEntries.count ?? 0,
      activePosts: activePosts.count ?? 0,
      resources: resources.count ?? 0,
      suspendedUsers: suspendedUsers.count ?? 0,
      pendingFacilitators: pendingFacilitators.count ?? 0,
      pendingReports: pendingReports.count ?? 0,
    };
  } catch {
    return {
      users: 0, startups: 0, facilitators: 0, jobs: 0, gigs: 0, events: 0,
      competitions: 0, applications: 0, competitionEntries: 0, activePosts: 0,
      resources: 0, suspendedUsers: 0, pendingFacilitators: 0, pendingReports: 0,
    };
  }
}

export async function getUserGrowthByDay(days: number): Promise<DailyCount[]> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  try {
    const { data } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', since.toISOString());

    const counts: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      counts[d.toISOString().split('T')[0]] = 0;
    }
    for (const row of data ?? []) {
      const date = (row.created_at as string).split('T')[0];
      if (date in counts) counts[date]++;
    }

    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  } catch {
    return [];
  }
}

export async function getApplicationVelocity(days: number): Promise<DailyCount[]> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  try {
    const { data } = await supabase
      .from('applications')
      .select('submitted_at')
      .neq('status', 'in_progress')
      .gte('submitted_at', since.toISOString());

    const counts: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      counts[d.toISOString().split('T')[0]] = 0;
    }
    for (const row of data ?? []) {
      const date = (row.submitted_at as string).split('T')[0];
      if (date in counts) counts[date]++;
    }

    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  } catch {
    return [];
  }
}

export async function getContentStats(): Promise<ContentStats> {
  const supabase = createAdminClient();
  try {
    const [jobsRes, gigsRes, eventsRes, compsRes] = await Promise.all([
      supabase.from('jobs').select('category,job_type,work_mode,visibility,is_active'),
      supabase.from('gigs').select('category,payment_type,visibility,is_active'),
      supabase.from('events').select('category,event_type,visibility,is_active,is_featured'),
      supabase.from('competitions').select('domain,participation_type,visibility,is_active,is_external,is_featured'),
    ]);

    const jobs = (jobsRes.data ?? []) as Record<string, unknown>[];
    const gigs = (gigsRes.data ?? []) as Record<string, unknown>[];
    const events = (eventsRes.data ?? []) as Record<string, unknown>[];
    const comps = (compsRes.data ?? []) as Record<string, unknown>[];

    return {
      jobs: {
        total: jobs.length,
        active: jobs.filter((j) => j.is_active).length,
        byCategory: groupBy(jobs, 'category'),
        byType: groupBy(jobs, 'job_type'),
        byWorkMode: groupBy(jobs, 'work_mode'),
        byVisibility: groupBy(jobs, 'visibility'),
      },
      gigs: {
        total: gigs.length,
        active: gigs.filter((g) => g.is_active).length,
        byCategory: groupBy(gigs, 'category'),
        byPaymentType: groupBy(gigs, 'payment_type'),
        byVisibility: groupBy(gigs, 'visibility'),
      },
      events: {
        total: events.length,
        active: events.filter((e) => e.is_active).length,
        featured: events.filter((e) => e.is_featured).length,
        byCategory: groupBy(events, 'category'),
        byType: groupBy(events, 'event_type'),
        byVisibility: groupBy(events, 'visibility'),
      },
      competitions: {
        total: comps.length,
        active: comps.filter((c) => c.is_active).length,
        featured: comps.filter((c) => c.is_featured).length,
        external: comps.filter((c) => c.is_external).length,
        byDomain: groupBy(comps, 'domain'),
        byParticipationType: groupBy(comps, 'participation_type'),
        byVisibility: groupBy(comps, 'visibility'),
      },
    };
  } catch {
    const empty = { total: 0, active: 0, byCategory: {}, byType: {}, byVisibility: {} };
    return {
      jobs: { ...empty, byWorkMode: {} },
      gigs: { ...empty, byPaymentType: {} },
      events: { ...empty, featured: 0, byType: {} },
      competitions: { ...empty, featured: 0, external: 0, byDomain: {}, byParticipationType: {} },
    };
  }
}

export async function getApplicationFunnel(): Promise<ApplicationFunnel> {
  const supabase = createAdminClient();
  try {
    const { data } = await supabase
      .from('applications')
      .select('status,ai_recommendation,overall_score,match_score,interview_score,tab_switch_count,time_spent_seconds,user_id')
      .neq('status', 'in_progress');

    const apps = (data ?? []) as Record<string, unknown>[];
    const total = apps.length;

    // Unique applicants
    const unique_applicants = new Set(apps.map((a) => a.user_id)).size;

    // Status funnel
    const statusOrder = ['submitted', 'reviewed', 'shortlisted', 'rejected'];
    const statusCounts: Record<string, number> = {};
    for (const a of apps) {
      const s = String(a.status ?? 'unknown');
      statusCounts[s] = (statusCounts[s] ?? 0) + 1;
    }
    const funnel = statusOrder.map((s) => ({
      status: s,
      count: statusCounts[s] ?? 0,
      pct: total > 0 ? Math.round(((statusCounts[s] ?? 0) / total) * 100) : 0,
    }));

    // AI recommendations
    const recOrder = ['strongly_recommend', 'recommend', 'maybe', 'not_recommend', 'pending'];
    const recLabels: Record<string, string> = {
      strongly_recommend: 'Strongly Recommend',
      recommend: 'Recommend',
      maybe: 'Maybe',
      not_recommend: 'Not Recommend',
      pending: 'Pending',
    };
    const recCounts: Record<string, number> = {};
    for (const a of apps) {
      const r = String(a.ai_recommendation ?? 'pending');
      recCounts[r] = (recCounts[r] ?? 0) + 1;
    }
    const aiRecommendations = recOrder.map((r) => ({
      label: recLabels[r] ?? r,
      count: recCounts[r] ?? 0,
      pct: total > 0 ? Math.round(((recCounts[r] ?? 0) / total) * 100) : 0,
    }));

    // Score distribution buckets
    const scoreBuckets: Record<string, number> = { '0–25': 0, '26–50': 0, '51–75': 0, '76–100': 0 };
    for (const a of apps) {
      const s = Number(a.overall_score ?? 0);
      if (s <= 25) scoreBuckets['0–25']++;
      else if (s <= 50) scoreBuckets['26–50']++;
      else if (s <= 75) scoreBuckets['51–75']++;
      else scoreBuckets['76–100']++;
    }
    const scoreDistribution = Object.entries(scoreBuckets).map(([bucket, count]) => ({ bucket, count }));

    // Avg scores
    const overallScores = apps.map((a) => Number(a.overall_score ?? 0)).filter(Boolean);
    const matchScores = apps.map((a) => Number(a.match_score ?? 0)).filter(Boolean);
    const interviewScores = apps.map((a) => Number(a.interview_score ?? 0)).filter(Boolean);

    // Integrity
    const tabSwitches = apps.map((a) => Number(a.tab_switch_count ?? 0));
    const timeSeconds = apps.map((a) => Number(a.time_spent_seconds ?? 0));
    const avgTimeMinutes =
      timeSeconds.length > 0
        ? Math.round(timeSeconds.reduce((a, b) => a + b, 0) / timeSeconds.length / 60)
        : 0;

    return {
      total,
      unique_applicants,
      funnel,
      aiRecommendations,
      avgScores: {
        overall: avg(overallScores),
        match: avg(matchScores),
        interview: avg(interviewScores),
      },
      integrity: { avgTabSwitches: avg(tabSwitches), avgTimeMinutes },
      scoreDistribution,
    };
  } catch {
    return {
      total: 0,
      unique_applicants: 0,
      funnel: [],
      aiRecommendations: [],
      avgScores: { overall: 0, match: 0, interview: 0 },
      integrity: { avgTabSwitches: 0, avgTimeMinutes: 0 },
      scoreDistribution: [],
    };
  }
}

export async function getFacilitatorStats(): Promise<FacilitatorStats> {
  const supabase = createAdminClient();
  try {
    const [adminProfilesRes, studentEmailsRes, assignmentsRes] = await Promise.all([
      supabase.from('admin_profiles').select('id,display_name,verification_status').eq('role', 'facilitator'),
      supabase.from('facilitator_student_emails').select('facilitator_id'),
      supabase.from('startup_facilitator_assignments').select('facilitator_id').eq('status', 'approved'),
    ]);

    const profiles = (adminProfilesRes.data ?? []) as {
      id: string;
      display_name: string | null;
      verification_status: string;
    }[];
    const total = profiles.length;

    const byVerificationStatus: Record<string, number> = {};
    for (const p of profiles) {
      const s = p.verification_status ?? 'unknown';
      byVerificationStatus[s] = (byVerificationStatus[s] ?? 0) + 1;
    }

    const studentMap: Record<string, number> = {};
    for (const e of (studentEmailsRes.data ?? []) as { facilitator_id: string }[]) {
      studentMap[e.facilitator_id] = (studentMap[e.facilitator_id] ?? 0) + 1;
    }
    const totalStudents = Object.values(studentMap).reduce((a, b) => a + b, 0);

    const startupMap: Record<string, number> = {};
    for (const a of (assignmentsRes.data ?? []) as { facilitator_id: string }[]) {
      startupMap[a.facilitator_id] = (startupMap[a.facilitator_id] ?? 0) + 1;
    }

    const topByStudents = profiles
      .map((p) => ({
        id: p.id,
        name: p.display_name ?? 'Unknown',
        studentCount: studentMap[p.id] ?? 0,
        startupCount: startupMap[p.id] ?? 0,
      }))
      .sort((a, b) => b.studentCount - a.studentCount)
      .slice(0, 5);

    return { total, byVerificationStatus, totalStudents, topByStudents };
  } catch {
    return { total: 0, byVerificationStatus: {}, totalStudents: 0, topByStudents: [] };
  }
}

export async function getStartupStats(): Promise<StartupStats> {
  const supabase = createAdminClient();
  try {
    const { data } = await supabase
      .from('startup_profiles')
      .select('stage,categories,is_published,is_featured,is_actively_raising,total_raised,investor_count,city');

    const startups = (data ?? []) as {
      stage: string | null;
      categories: string[] | null;
      is_published: boolean;
      is_featured: boolean;
      is_actively_raising: boolean;
      total_raised: number | null;
      investor_count: number | null;
      city: string | null;
    }[];

    const total = startups.length;
    const published = startups.filter((s) => s.is_published).length;
    const featured = startups.filter((s) => s.is_featured).length;
    const activelyRaising = startups.filter((s) => s.is_actively_raising).length;

    const byStage: Record<string, number> = {};
    for (const s of startups) {
      const stage = s.stage ?? 'unknown';
      byStage[stage] = (byStage[stage] ?? 0) + 1;
    }

    const catCounts: Record<string, number> = {};
    for (const s of startups) {
      for (const c of s.categories ?? []) {
        catCounts[c] = (catCounts[c] ?? 0) + 1;
      }
    }
    const topCategories = Object.entries(catCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));

    const cityCounts: Record<string, number> = {};
    for (const s of startups) {
      if (s.city) cityCounts[s.city] = (cityCounts[s.city] ?? 0) + 1;
    }
    const topCities = Object.entries(cityCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([city, count]) => ({ city, count }));

    const raisedValues = startups.map((s) => Number(s.total_raised ?? 0)).filter(Boolean);
    const investorValues = startups.map((s) => Number(s.investor_count ?? 0)).filter(Boolean);

    return {
      total,
      published,
      featured,
      activelyRaising,
      byStage,
      topCategories,
      topCities,
      avgTotalRaised: avg(raisedValues),
      avgInvestorCount: avg(investorValues),
    };
  } catch {
    return {
      total: 0, published: 0, featured: 0, activelyRaising: 0,
      byStage: {}, topCategories: [], topCities: [],
      avgTotalRaised: 0, avgInvestorCount: 0,
    };
  }
}

export async function getRecentAuditActivity(limit = 10): Promise<AuditLogEntry[]> {
  const supabase = createAdminClient();
  try {
    const { data } = await supabase
      .from('audit_logs')
      .select('id,action_type,actor_id,actor_role,target_type,target_id,details,created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    return (data ?? []) as AuditLogEntry[];
  } catch {
    return [];
  }
}

export async function getTopOpportunities(): Promise<TopOpportunities> {
  const supabase = createAdminClient();
  try {
    const { data: apps } = await supabase
      .from('applications')
      .select('job_id,gig_id')
      .neq('status', 'in_progress');

    const jobCounts: Record<string, number> = {};
    const gigCounts: Record<string, number> = {};
    for (const a of (apps ?? []) as { job_id: string | null; gig_id: string | null }[]) {
      if (a.job_id) jobCounts[a.job_id] = (jobCounts[a.job_id] ?? 0) + 1;
      if (a.gig_id) gigCounts[a.gig_id] = (gigCounts[a.gig_id] ?? 0) + 1;
    }

    const topJobIds = Object.entries(jobCounts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([id]) => id);
    const topGigIds = Object.entries(gigCounts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([id]) => id);

    const [jobsRes, gigsRes] = await Promise.all([
      topJobIds.length > 0
        ? supabase.from('jobs').select('id,title').in('id', topJobIds)
        : { data: [] as { id: string; title: string }[] },
      topGigIds.length > 0
        ? supabase.from('gigs').select('id,title').in('id', topGigIds)
        : { data: [] as { id: string; title: string }[] },
    ]);

    const topJobs = (jobsRes.data ?? [])
      .map((j) => ({ id: j.id, title: j.title ?? 'Unknown', applicationCount: jobCounts[j.id] ?? 0 }))
      .sort((a, b) => b.applicationCount - a.applicationCount);

    const topGigs = (gigsRes.data ?? [])
      .map((g) => ({ id: g.id, title: g.title ?? 'Unknown', applicationCount: gigCounts[g.id] ?? 0 }))
      .sort((a, b) => b.applicationCount - a.applicationCount);

    return { topJobs, topGigs };
  } catch {
    return { topJobs: [], topGigs: [] };
  }
}

// ─── Deep Analytics Actions ───────────────────────────────────

export async function getUserSegmentation(): Promise<UserSegmentation> {
  const supabase = createAdminClient();
  try {
    const [allUsersRes, newWeekRes, newMonthRes] = await Promise.all([
      supabase.from('users').select('user_type,is_verified,is_suspended'),
      supabase.from('users').select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('users').select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    const users = (allUsersRes.data ?? []) as {
      user_type: string | null;
      is_verified: boolean;
      is_suspended: boolean;
    }[];

    const total = users.length;
    const verified = users.filter((u) => u.is_verified).length;
    const suspended = users.filter((u) => u.is_suspended).length;
    const byUserType = groupBy(users as unknown as Record<string, unknown>[], 'user_type');

    return {
      total,
      verified,
      suspended,
      byUserType,
      newThisWeek: newWeekRes.count ?? 0,
      newThisMonth: newMonthRes.count ?? 0,
      verificationRate: total > 0 ? Math.round((verified / total) * 100) : 0,
      suspensionRate: total > 0 ? Math.round((suspended / total) * 100) : 0,
    };
  } catch {
    return {
      total: 0, verified: 0, suspended: 0, byUserType: {},
      newThisWeek: 0, newThisMonth: 0, verificationRate: 0, suspensionRate: 0,
    };
  }
}

export async function getSkillsDemand(limit = 20): Promise<SkillDemand[]> {
  const supabase = createAdminClient();
  try {
    const [jobsRes, gigsRes] = await Promise.all([
      supabase.from('jobs').select('skills_required').eq('is_active', true),
      supabase.from('gigs').select('skills_required').eq('is_active', true),
    ]);

    const skillCounts: Record<string, number> = {};
    for (const item of [...(jobsRes.data ?? []), ...(gigsRes.data ?? [])]) {
      const skills: string[] = (item as { skills_required: string[] | null }).skills_required ?? [];
      for (const skill of skills) {
        const s = skill.trim();
        if (s) skillCounts[s] = (skillCounts[s] ?? 0) + 1;
      }
    }

    return Object.entries(skillCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([skill, count]) => ({ skill, count }));
  } catch {
    return [];
  }
}

export async function getGeographicDistribution(): Promise<GeographicDistribution> {
  const supabase = createAdminClient();
  try {
    const [startupRes, jobRes, gigRes] = await Promise.all([
      supabase.from('startup_profiles').select('city'),
      supabase.from('jobs').select('location').eq('is_active', true),
      supabase.from('gigs').select('location').eq('is_active', true),
    ]);

    const startupCityCounts: Record<string, number> = {};
    for (const s of (startupRes.data ?? []) as { city: string | null }[]) {
      if (s.city) startupCityCounts[s.city] = (startupCityCounts[s.city] ?? 0) + 1;
    }

    const jobLocCounts: Record<string, number> = {};
    for (const j of (jobRes.data ?? []) as { location: string | null }[]) {
      if (j.location) jobLocCounts[j.location] = (jobLocCounts[j.location] ?? 0) + 1;
    }

    const gigLocCounts: Record<string, number> = {};
    for (const g of (gigRes.data ?? []) as { location: string | null }[]) {
      if (g.location) gigLocCounts[g.location] = (gigLocCounts[g.location] ?? 0) + 1;
    }

    const sortedCities = topN(startupCityCounts, 10).map((e) => ({ city: e.key, count: e.count }));
    const sortedJobLocs = topN(jobLocCounts, 8).map((e) => ({ location: e.key, count: e.count }));
    const sortedGigLocs = topN(gigLocCounts, 8).map((e) => ({ location: e.key, count: e.count }));

    return { startupCities: sortedCities, jobLocations: sortedJobLocs, gigLocations: sortedGigLocs };
  } catch {
    return { startupCities: [], jobLocations: [], gigLocations: [] };
  }
}

export async function getContentPipelineHealth(): Promise<ContentPipelineHealth> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const [
      activeJobs, totalJobs, activeGigs, totalGigs,
      activeEvents, totalEvents, activeComps, totalComps,
      expiringJobs, expiringGigs, expiringComps,
      recentJobs, recentGigs, recentEvents, recentComps,
    ] = await Promise.all([
      supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('jobs').select('id', { count: 'exact', head: true }),
      supabase.from('gigs').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('gigs').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('competitions').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('competitions').select('id', { count: 'exact', head: true }),
      supabase.from('jobs').select('id', { count: 'exact', head: true })
        .gte('deadline', now).lte('deadline', sevenDaysLater),
      supabase.from('gigs').select('id', { count: 'exact', head: true })
        .gte('deadline', now).lte('deadline', sevenDaysLater),
      supabase.from('competitions').select('id', { count: 'exact', head: true })
        .gte('deadline', now).lte('deadline', sevenDaysLater),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
      supabase.from('gigs').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
      supabase.from('events').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
      supabase.from('competitions').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    ]);

    const activeRate = (active: number | null, total: number | null) =>
      (total ?? 0) > 0 ? Math.round(((active ?? 0) / (total ?? 1)) * 100) : 0;

    return {
      jobs: { active: activeJobs.count ?? 0, total: totalJobs.count ?? 0, activeRate: activeRate(activeJobs.count, totalJobs.count) },
      gigs: { active: activeGigs.count ?? 0, total: totalGigs.count ?? 0, activeRate: activeRate(activeGigs.count, totalGigs.count) },
      events: { active: activeEvents.count ?? 0, total: totalEvents.count ?? 0, activeRate: activeRate(activeEvents.count, totalEvents.count) },
      competitions: { active: activeComps.count ?? 0, total: totalComps.count ?? 0, activeRate: activeRate(activeComps.count, totalComps.count) },
      expiringSoon: {
        jobs: expiringJobs.count ?? 0,
        gigs: expiringGigs.count ?? 0,
        competitions: expiringComps.count ?? 0,
      },
      recentlyAdded: {
        jobs: recentJobs.count ?? 0,
        gigs: recentGigs.count ?? 0,
        events: recentEvents.count ?? 0,
        competitions: recentComps.count ?? 0,
      },
    };
  } catch {
    const zero = { active: 0, total: 0, activeRate: 0 };
    return {
      jobs: zero, gigs: zero, events: zero, competitions: zero,
      expiringSoon: { jobs: 0, gigs: 0, competitions: 0 },
      recentlyAdded: { jobs: 0, gigs: 0, events: 0, competitions: 0 },
    };
  }
}

export async function getPlatformPulse(days: number): Promise<PlatformPulse> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const prevSince = new Date(Date.now() - 2 * days * 24 * 60 * 60 * 1000).toISOString();

  try {
    const [
      curUsers, prevUsers,
      curApps, prevApps,
      curJobs, prevJobs,
      curGigs, prevGigs,
      totalRaisedRes,
      totalJobsRes, totalGigsRes,
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('users').select('id', { count: 'exact', head: true })
        .gte('created_at', prevSince).lt('created_at', since),
      supabase.from('applications').select('id', { count: 'exact', head: true })
        .neq('status', 'in_progress').gte('submitted_at', since),
      supabase.from('applications').select('id', { count: 'exact', head: true })
        .neq('status', 'in_progress').gte('submitted_at', prevSince).lt('submitted_at', since),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('jobs').select('id', { count: 'exact', head: true })
        .gte('created_at', prevSince).lt('created_at', since),
      supabase.from('gigs').select('id', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('gigs').select('id', { count: 'exact', head: true })
        .gte('created_at', prevSince).lt('created_at', since),
      supabase.from('startup_profiles').select('total_raised,investor_count'),
      supabase.from('jobs').select('id', { count: 'exact', head: true }),
      supabase.from('gigs').select('id', { count: 'exact', head: true }),
    ]);

    const curContent = (curJobs.count ?? 0) + (curGigs.count ?? 0);
    const prevContent = (prevJobs.count ?? 0) + (prevGigs.count ?? 0);

    const raised = (totalRaisedRes.data ?? []).reduce(
      (sum: number, s: unknown) => sum + Number((s as { total_raised: number | null }).total_raised ?? 0),
      0
    );

    const totalApps = (curApps.count ?? 0);
    const totalJobs = (totalJobsRes.count ?? 0);
    const totalGigs = (totalGigsRes.count ?? 0);
    const avgApplicationsPerJob = totalJobs > 0 ? Math.round(totalApps / totalJobs) : 0;
    const avgApplicationsPerGig = totalGigs > 0 ? Math.round(totalApps / totalGigs) : 0;

    return {
      users: {
        current: curUsers.count ?? 0,
        prev: prevUsers.count ?? 0,
        growth: growthPct(curUsers.count ?? 0, prevUsers.count ?? 0),
      },
      applications: {
        current: curApps.count ?? 0,
        prev: prevApps.count ?? 0,
        growth: growthPct(curApps.count ?? 0, prevApps.count ?? 0),
      },
      contentPosted: {
        current: curContent,
        prev: prevContent,
        growth: growthPct(curContent, prevContent),
      },
      totalRaisedAcrossPlatform: raised,
      avgApplicationsPerJob,
      avgApplicationsPerGig,
    };
  } catch {
    return {
      users: { current: 0, prev: 0, growth: 0 },
      applications: { current: 0, prev: 0, growth: 0 },
      contentPosted: { current: 0, prev: 0, growth: 0 },
      totalRaisedAcrossPlatform: 0,
      avgApplicationsPerJob: 0,
      avgApplicationsPerGig: 0,
    };
  }
}
