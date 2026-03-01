'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireStartup } from '@/lib/auth';
import { writeAuditLog } from './rbac';
import { revalidatePath } from 'next/cache';

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
  job_type?: string;
  requirements?: string;
  deadline?: string;
  skills_required?: string[];
  experience_level?: string;
  category?: string;
  work_mode?: string;
  contact_email?: string;
}) {
  const session = await requireStartup();
  const admin = createAdminClient();
  const startupId = await getStartupProfileForUser(session.authId);
  if (!startupId) throw new Error('No startup profile found');

  const { data, error } = await admin.from('jobs').insert({
    ...jobData,
    created_by: session.authId,
    startup_id: startupId,
    is_active: true,
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
