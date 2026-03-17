'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireStartup } from '@/lib/auth';
import { writeAuditLog } from './rbac';
import { revalidatePath } from 'next/cache';
import { getStartupProfileCompleteness } from './startup-profile';

const MINIMUM_PROFILE_PERCENT = 50;

async function enforceProfileCompleteness() {
  const { percentage } = await getStartupProfileCompleteness();
  if (percentage < MINIMUM_PROFILE_PERCENT) {
    throw new Error(`Your startup profile is only ${percentage}% complete. Please complete at least ${MINIMUM_PROFILE_PERCENT}% of your profile before posting jobs or gigs.`);
  }
}

// ─── Startup: Get own startup profile ────────────────────────

async function getStartupProfileForUser(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('startup_profiles')
    .select('id')
    .eq('owner_id', userId)
    .single();
  return data?.id ?? null;
}

// ─── Facilitator Helpers ──────────────────────────────────────

export async function getMyApprovedFacilitators() {
  const session = await requireStartup();
  const admin = createAdminClient();
  const startupId = await getStartupProfileForUser(session.authId);
  if (!startupId) return [];

  const { data, error } = await admin
    .from('startup_facilitator_assignments')
    .select('facilitator_id')
    .eq('startup_id', startupId)
    .eq('status', 'approved');

  if (error || !data || data.length === 0) return [];

  const facilitatorIds = data.map((a: any) => a.facilitator_id as string);

  const [{ data: profiles }, { data: fpProfiles }] = await Promise.all([
    admin.from('admin_profiles').select('id, display_name, email').in('id', facilitatorIds),
    admin.from('facilitator_profiles').select('id, organisation_name').in('id', facilitatorIds),
  ]);

  const fpMap = new Map((fpProfiles ?? []).map((fp: any) => [fp.id, fp.organisation_name as string | null]));

  return (profiles ?? []).map((p: any) => ({
    id: p.id as string,
    organisation_name: fpMap.get(p.id) ?? null,
    display_name: p.display_name as string,
    email: p.email as string,
  }));
}

// ─── Dashboard Stats ──────────────────────────────────────────

export async function getStartupDashboardStats() {
  const session = await requireStartup();
  const admin = createAdminClient();
  const startupId = await getStartupProfileForUser(session.authId);

  if (!startupId) return { jobs: 0, gigs: 0, events: 0, competitions: 0, applications: 0 };

  const [jobs, gigs, events, competitions, applications] = await Promise.all([
    admin.from('jobs').select('id', { count: 'exact', head: true }).eq('startup_id', startupId),
    admin.from('gigs').select('id', { count: 'exact', head: true }).eq('startup_id', startupId),
    admin.from('events').select('id', { count: 'exact', head: true }).eq('startup_id', startupId),
    admin.from('competitions').select('id', { count: 'exact', head: true }).eq('startup_id', startupId),
    admin.from('applications').select('id', { count: 'exact', head: true }).eq('startup_id', startupId),
  ]);

  return {
    jobs: jobs.count ?? 0,
    gigs: gigs.count ?? 0,
    events: events.count ?? 0,
    competitions: competitions.count ?? 0,
    applications: applications.count ?? 0,
  };
}

// ─── Jobs ─────────────────────────────────────────────────────

export async function getStartupJobs() {
  const session = await requireStartup();
  const admin = createAdminClient();
  const startupId = await getStartupProfileForUser(session.authId);
  if (!startupId) return [];

  const { data, error } = await admin
    .from('jobs')
    .select('*')
    .or(`startup_id.eq.${startupId},created_by.eq.${session.authId}`)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createStartupJob(jobData: {
  title: string;
  company: string;
  description: string;
  location?: string;
  salary_range?: string;
  is_unpaid?: boolean;
  job_type?: string;
  requirements?: string;
  deadline?: string;
  skills_required?: string[];
  experience_level?: string;
  category?: string;
  work_mode?: string;
  contact_email?: string;
  visibility?: 'public' | 'facilitator_only';
  target_facilitator_ids?: string[] | null;
}) {
  const session = await requireStartup();
  await enforceProfileCompleteness();
  const admin = createAdminClient();
  const startupId = await getStartupProfileForUser(session.authId);
  if (!startupId) throw new Error('No startup profile found');

  const { data, error } = await admin.from('jobs').insert({
    ...jobData,
    created_by: session.authId,
    startup_id: startupId,
    is_active: false,
    approval_status: 'pending',
    visibility: jobData.visibility ?? 'public',
    target_facilitator_ids: jobData.target_facilitator_ids ?? null,
  }).select().single();

  if (error) throw new Error(error.message);

  await writeAuditLog({
    actionType: 'create_job',
    actorId: session.authId,
    actorRole: 'startup',
    targetType: 'job',
    targetId: data.id,
    details: { title: jobData.title },
  });

  revalidatePath('/startup/jobs');
  return data;
}

export async function deleteStartupJob(jobId: string) {
  const session = await requireStartup();
  const admin = createAdminClient();
  const startupId = await getStartupProfileForUser(session.authId);
  if (!startupId) throw new Error('No startup profile found');

  // Ownership check
  const { data: job } = await admin.from('jobs').select('startup_id').eq('id', jobId).single();
  if (!job || job.startup_id !== startupId) throw new Error('Forbidden');

  const { error } = await admin.from('jobs').delete().eq('id', jobId);
  if (error) throw new Error(error.message);
  revalidatePath('/startup/jobs');
}

// ─── Gigs ─────────────────────────────────────────────────────

export async function getStartupGigs() {
  const session = await requireStartup();
  const admin = createAdminClient();
  const startupId = await getStartupProfileForUser(session.authId);
  if (!startupId) return [];

  const { data, error } = await admin
    .from('gigs')
    .select('*')
    .eq('startup_id', startupId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ─── Events ───────────────────────────────────────────────────

export async function getStartupEvents() {
  const session = await requireStartup();
  const admin = createAdminClient();
  const startupId = await getStartupProfileForUser(session.authId);
  if (!startupId) return [];

  const { data, error } = await admin
    .from('events')
    .select('*')
    .eq('startup_id', startupId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ─── Competitions ─────────────────────────────────────────────

export async function getStartupCompetitions() {
  const session = await requireStartup();
  const admin = createAdminClient();
  const startupId = await getStartupProfileForUser(session.authId);
  if (!startupId) return [];

  const { data, error } = await admin
    .from('competitions')
    .select('*')
    .eq('startup_id', startupId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ─── Gig CRUD ─────────────────────────────────────────────────

export async function createStartupGig(gigData: {
  title: string;
  description?: string;
  budget?: string;
  duration?: string;
  skills_required?: string[];
  deadline?: string;
  company?: string;
  company_logo_url?: string;
  company_website?: string;
  category?: string;
  experience_level?: string;
  payment_type?: string;
  deliverables?: string;
  responsibilities?: string;
  contact_email?: string;
  is_active?: boolean;
  visibility?: 'public' | 'facilitator_only';
  target_facilitator_ids?: string[] | null;
}) {
  const session = await requireStartup();
  await enforceProfileCompleteness();
  const admin = createAdminClient();
  const startupId = await getStartupProfileForUser(session.authId);
  if (!startupId) throw new Error('No startup profile found');

  const { data, error } = await admin.from('gigs').insert({
    ...gigData,
    created_by: session.authId,
    startup_id: startupId,
    is_active: false,
    approval_status: 'pending',
    visibility: gigData.visibility ?? 'public',
    target_facilitator_ids: gigData.target_facilitator_ids ?? null,
  }).select().single();

  if (error) throw new Error(error.message);

  await writeAuditLog({
    actionType: 'create_gig',
    actorId: session.authId,
    actorRole: 'startup',
    targetType: 'gig',
    targetId: data.id,
    details: { title: gigData.title },
  });

  revalidatePath('/startup/gigs');
  return data;
}

export async function deleteStartupGig(gigId: string) {
  const session = await requireStartup();
  const admin = createAdminClient();
  const startupId = await getStartupProfileForUser(session.authId);
  if (!startupId) throw new Error('No startup profile found');

  const { data: gig } = await admin.from('gigs').select('startup_id').eq('id', gigId).single();
  if (!gig || gig.startup_id !== startupId) throw new Error('Forbidden');

  const { error } = await admin.from('gigs').delete().eq('id', gigId);
  if (error) throw new Error(error.message);
  revalidatePath('/startup/gigs');
}

// ─── Event CRUD ────────────────────────────────────────────────

export async function createStartupEvent(eventData: {
  title: string;
  description?: string;
  event_date?: string;
  location?: string;
  event_url?: string;
  banner_image_url?: string;
  event_type?: string;
  is_active?: boolean;
  tags?: string[];
  is_featured?: boolean;
  organizer_name?: string;
  category?: string;
  visibility?: 'public' | 'facilitator_only';
  target_facilitator_ids?: string[] | null;
}) {
  const session = await requireStartup();
  const admin = createAdminClient();
  const startupId = await getStartupProfileForUser(session.authId);
  if (!startupId) throw new Error('No startup profile found');

  const { data, error } = await admin.from('events').insert({
    ...eventData,
    created_by: session.authId,
    startup_id: startupId,
    is_active: false,
    approval_status: 'pending',
    tags: eventData.tags ?? [],
    is_featured: eventData.is_featured ?? false,
    visibility: eventData.visibility ?? 'public',
    target_facilitator_ids: eventData.target_facilitator_ids ?? null,
  }).select().single();

  if (error) throw new Error(error.message);

  await writeAuditLog({
    actionType: 'create_event',
    actorId: session.authId,
    actorRole: 'startup',
    targetType: 'event',
    targetId: data.id,
    details: { title: eventData.title },
  });

  revalidatePath('/startup/events');
  return data;
}

export async function deleteStartupEvent(eventId: string) {
  const session = await requireStartup();
  const admin = createAdminClient();
  const startupId = await getStartupProfileForUser(session.authId);
  if (!startupId) throw new Error('No startup profile found');

  const { data: ev } = await admin.from('events').select('startup_id').eq('id', eventId).single();
  if (!ev || ev.startup_id !== startupId) throw new Error('Forbidden');

  const { error } = await admin.from('events').delete().eq('id', eventId);
  if (error) throw new Error(error.message);
  revalidatePath('/startup/events');
}

// ─── Competition CRUD ──────────────────────────────────────────

export async function createStartupCompetition(compData: {
  title: string;
  description?: string;
  deadline?: string;
  is_external?: boolean;
  external_url?: string;
  has_leaderboard?: boolean;
  prize_pool?: string;
  banner_image_url?: string;
  tags?: string[];
  is_featured?: boolean;
  is_active?: boolean;
  domain?: string;
  organizer_name?: string;
  participation_type?: string;
  team_size_min?: number;
  team_size_max?: number;
  eligibility_criteria?: string;
  visibility?: 'public' | 'facilitator_only';
  target_facilitator_ids?: string[] | null;
}) {
  const session = await requireStartup();
  const admin = createAdminClient();
  const startupId = await getStartupProfileForUser(session.authId);
  if (!startupId) throw new Error('No startup profile found');

  const { data, error } = await admin.from('competitions').insert({
    ...compData,
    created_by: session.authId,
    startup_id: startupId,
    is_active: false,
    approval_status: 'pending',
    tags: compData.tags ?? [],
    is_featured: compData.is_featured ?? false,
    is_external: compData.is_external ?? false,
    has_leaderboard: compData.has_leaderboard ?? false,
    participation_type: compData.participation_type ?? 'individual',
    team_size_min: compData.team_size_min ?? 1,
    team_size_max: compData.team_size_max ?? 4,
    visibility: compData.visibility ?? 'public',
    target_facilitator_ids: compData.target_facilitator_ids ?? null,
  }).select('id').single();

  if (error) throw new Error(error.message);

  await writeAuditLog({
    actionType: 'create_competition',
    actorId: session.authId,
    actorRole: 'startup',
    targetType: 'competition',
    targetId: data.id,
    details: { title: compData.title },
  });

  revalidatePath('/startup/competitions');
  return data.id as string;
}

export async function deleteStartupCompetition(competitionId: string) {
  const session = await requireStartup();
  const admin = createAdminClient();
  const startupId = await getStartupProfileForUser(session.authId);
  if (!startupId) throw new Error('No startup profile found');

  const { data: comp } = await admin.from('competitions').select('startup_id').eq('id', competitionId).single();
  if (!comp || comp.startup_id !== startupId) throw new Error('Forbidden');

  const { error } = await admin.from('competitions').delete().eq('id', competitionId);
  if (error) throw new Error(error.message);
  revalidatePath('/startup/competitions');
}

// ─── Applications (read-only for own posts) ───────────────────

export async function getStartupApplications() {
  const session = await requireStartup();
  const admin = createAdminClient();
  const startupId = await getStartupProfileForUser(session.authId);
  if (!startupId) return [];

  const { data, error } = await admin
    .from('applications')
    .select('*')
    .eq('startup_id', startupId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}
