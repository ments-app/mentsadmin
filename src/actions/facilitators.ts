'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireSuperAdmin, requireFacilitator } from '@/lib/auth';
import { writeAuditLog } from './rbac';
import { revalidatePath } from 'next/cache';

// ─── SuperAdmin: Manage Facilitators ──────────────────────────

export async function getFacilitators(filter?: 'all' | 'pending' | 'approved' | 'rejected' | 'suspended') {
  await requireSuperAdmin();
  const admin = createAdminClient();

  let query = admin
    .from('admin_profiles')
    .select(`
      *,
      facilitator_profiles (*)
    `)
    .eq('role', 'facilitator')
    .order('created_at', { ascending: false });

  if (filter && filter !== 'all') {
    query = query.eq('verification_status', filter);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getFacilitatorById(id: string) {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('admin_profiles')
    .select(`
      *,
      facilitator_profiles (*),
      startup_facilitator_assignments (
        id, status, created_at, reviewed_at, notes,
        startup_profiles: startup_id (id, brand_name, logo_url, stage, city, country)
      )
    `)
    .eq('id', id)
    .eq('role', 'facilitator')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function approveFacilitator(facilitatorId: string, notes?: string) {
  const session = await requireSuperAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from('admin_profiles')
    .update({ verification_status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', facilitatorId)
    .eq('role', 'facilitator');

  if (error) throw new Error(error.message);

  await admin.from('facilitator_profiles').update({
    approved_by: session.authId,
    approved_at: new Date().toISOString(),
    rejected_at: null,
    verification_notes: notes ?? null,
  }).eq('id', facilitatorId);

  await writeAuditLog({
    actionType: 'approve_facilitator',
    actorId: session.authId,
    actorRole: 'superadmin',
    targetType: 'facilitator',
    targetId: facilitatorId,
    details: { notes },
  });

  revalidatePath('/dashboard/facilitators');
}

export async function rejectFacilitator(facilitatorId: string, notes: string) {
  const session = await requireSuperAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from('admin_profiles')
    .update({ verification_status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', facilitatorId)
    .eq('role', 'facilitator');

  if (error) throw new Error(error.message);

  await admin.from('facilitator_profiles').update({
    rejected_at: new Date().toISOString(),
    verification_notes: notes,
  }).eq('id', facilitatorId);

  await writeAuditLog({
    actionType: 'reject_facilitator',
    actorId: session.authId,
    actorRole: 'superadmin',
    targetType: 'facilitator',
    targetId: facilitatorId,
    details: { notes },
  });

  revalidatePath('/dashboard/facilitators');
}

export async function suspendFacilitator(facilitatorId: string, reason: string) {
  const session = await requireSuperAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from('admin_profiles')
    .update({ verification_status: 'suspended', updated_at: new Date().toISOString() })
    .eq('id', facilitatorId)
    .eq('role', 'facilitator');

  if (error) throw new Error(error.message);

  await writeAuditLog({
    actionType: 'suspend_facilitator',
    actorId: session.authId,
    actorRole: 'superadmin',
    targetType: 'facilitator',
    targetId: facilitatorId,
    details: { reason },
  });

  revalidatePath('/dashboard/facilitators');
}

// ─── Facilitator: Manage Startups ─────────────────────────────

/** Get all startups visible to this facilitator (their approved/pending ones). */
export async function getFacilitatorStartups(statusFilter?: 'all' | 'pending' | 'approved' | 'rejected' | 'suspended') {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  let query = admin
    .from('startup_facilitator_assignments')
    .select(`
      id, status, created_at, reviewed_at, notes,
      startup_profiles: startup_id (
        id, brand_name, logo_url, stage, city, country,
        tagline, is_published, is_featured, owner_id
      )
    `)
    .eq('facilitator_id', session.authId)
    .order('created_at', { ascending: false });

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Get unverified startups not yet assigned to any facilitator. */
export async function getUnassignedStartups() {
  await requireFacilitator();
  const admin = createAdminClient();

  // Startups in admin_profiles with pending status and no assignment yet
  const { data: assignedStartupIds } = await admin
    .from('startup_facilitator_assignments')
    .select('startup_id');

  const excludeIds = (assignedStartupIds ?? []).map((r: { startup_id: string }) => r.startup_id);

  let query = admin
    .from('admin_profiles')
    .select(`
      id, display_name, email, created_at,
      startup_profiles: id (id, brand_name, logo_url, stage, city, country, tagline)
    `)
    .eq('role', 'startup')
    .eq('verification_status', 'pending');

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function claimStartupForVerification(startupUserId: string) {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  // Find the startup_profile linked to this user
  const { data: sp, error: spError } = await admin
    .from('startup_profiles')
    .select('id')
    .eq('owner_id', startupUserId)
    .single();

  if (spError || !sp) throw new Error('Startup profile not found');

  const { error } = await admin.from('startup_facilitator_assignments').insert({
    startup_id: sp.id,
    facilitator_id: session.authId,
    status: 'pending',
    assigned_by: session.authId,
  });

  if (error) throw new Error(error.message);

  await writeAuditLog({
    actionType: 'claim_startup_for_verification',
    actorId: session.authId,
    actorRole: 'facilitator',
    targetType: 'startup',
    targetId: sp.id,
  });

  revalidatePath('/facilitator/startups');
}

export async function approveStartup(startupId: string, notes?: string) {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  // Verify this facilitator owns the assignment
  const { data: assignment, error: ae } = await admin
    .from('startup_facilitator_assignments')
    .select('id')
    .eq('startup_id', startupId)
    .eq('facilitator_id', session.authId)
    .single();

  if (ae || !assignment) throw new Error('Forbidden: assignment not found');

  const { error } = await admin
    .from('startup_facilitator_assignments')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      notes: notes ?? null,
    })
    .eq('startup_id', startupId)
    .eq('facilitator_id', session.authId);

  if (error) throw new Error(error.message);

  // Also update admin_profiles verification_status for the startup's owner
  const { data: sp } = await admin
    .from('startup_profiles')
    .select('owner_id')
    .eq('id', startupId)
    .single();

  if (sp?.owner_id) {
    await admin
      .from('admin_profiles')
      .update({ verification_status: 'approved' })
      .eq('id', sp.owner_id);
  }

  await writeAuditLog({
    actionType: 'approve_startup',
    actorId: session.authId,
    actorRole: 'facilitator',
    targetType: 'startup',
    targetId: startupId,
    details: { notes },
  });

  revalidatePath('/facilitator/startups');
}

export async function rejectStartup(startupId: string, notes: string) {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  const { data: assignment } = await admin
    .from('startup_facilitator_assignments')
    .select('id')
    .eq('startup_id', startupId)
    .eq('facilitator_id', session.authId)
    .single();

  if (!assignment) throw new Error('Forbidden: assignment not found');

  await admin
    .from('startup_facilitator_assignments')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      notes,
    })
    .eq('startup_id', startupId)
    .eq('facilitator_id', session.authId);

  const { data: sp } = await admin
    .from('startup_profiles')
    .select('owner_id')
    .eq('id', startupId)
    .single();

  if (sp?.owner_id) {
    await admin
      .from('admin_profiles')
      .update({ verification_status: 'rejected' })
      .eq('id', sp.owner_id);
  }

  await writeAuditLog({
    actionType: 'reject_startup',
    actorId: session.authId,
    actorRole: 'facilitator',
    targetType: 'startup',
    targetId: startupId,
    details: { notes },
  });

  revalidatePath('/facilitator/startups');
}

export async function suspendStartup(startupId: string, reason: string) {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  const { data: assignment } = await admin
    .from('startup_facilitator_assignments')
    .select('id')
    .eq('startup_id', startupId)
    .eq('facilitator_id', session.authId)
    .single();

  if (!assignment) throw new Error('Forbidden: assignment not found');

  await admin
    .from('startup_facilitator_assignments')
    .update({ status: 'suspended', notes: reason })
    .eq('startup_id', startupId)
    .eq('facilitator_id', session.authId);

  const { data: sp } = await admin
    .from('startup_profiles')
    .select('owner_id')
    .eq('id', startupId)
    .single();

  if (sp?.owner_id) {
    await admin
      .from('admin_profiles')
      .update({ verification_status: 'suspended' })
      .eq('id', sp.owner_id);
  }

  await writeAuditLog({
    actionType: 'suspend_startup',
    actorId: session.authId,
    actorRole: 'facilitator',
    targetType: 'startup',
    targetId: startupId,
    details: { reason },
  });

  revalidatePath('/facilitator/startups');
}

// ─── Facilitator: Scoped Content ──────────────────────────────

export async function getFacilitatorJobs() {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('jobs')
    .select('*')
    .eq('facilitator_id', session.authId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getFacilitatorGigs() {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('gigs')
    .select('*')
    .eq('facilitator_id', session.authId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getFacilitatorEvents() {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('events')
    .select('*')
    .eq('facilitator_id', session.authId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getFacilitatorCompetitions() {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('competitions')
    .select('*')
    .eq('facilitator_id', session.authId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getFacilitatorApplications() {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('applications')
    .select('*')
    .eq('facilitator_id', session.authId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getFacilitatorDashboardStats() {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  const [jobs, gigs, events, competitions, applications, startups] = await Promise.all([
    admin.from('jobs').select('id', { count: 'exact', head: true }).eq('facilitator_id', session.authId),
    admin.from('gigs').select('id', { count: 'exact', head: true }).eq('facilitator_id', session.authId),
    admin.from('events').select('id', { count: 'exact', head: true }).eq('facilitator_id', session.authId),
    admin.from('competitions').select('id', { count: 'exact', head: true }).eq('facilitator_id', session.authId),
    admin.from('applications').select('id', { count: 'exact', head: true }).eq('facilitator_id', session.authId),
    admin.from('startup_facilitator_assignments').select('id', { count: 'exact', head: true })
      .eq('facilitator_id', session.authId).eq('status', 'approved'),
  ]);

  return {
    jobs: jobs.count ?? 0,
    gigs: gigs.count ?? 0,
    events: events.count ?? 0,
    competitions: competitions.count ?? 0,
    applications: applications.count ?? 0,
    startups: startups.count ?? 0,
  };
}

// ─── Audit Logs (SuperAdmin only) ────────────────────────────

export async function getAuditLogs(limit = 50) {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
