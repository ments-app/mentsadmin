'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireSuperAdmin, requireFacilitator, requireAdminOrFacilitator } from '@/lib/auth';
import { writeAuditLog } from './rbac';
import { revalidatePath } from 'next/cache';

// ─── SuperAdmin: Manage Facilitators ──────────────────────────

export async function getFacilitators(filter?: 'all' | 'pending' | 'approved' | 'rejected' | 'suspended') {
  await requireSuperAdmin();
  const admin = createAdminClient();

  let query = admin
    .from('admin_profiles')
    .select('*')
    .eq('role', 'facilitator')
    .order('created_at', { ascending: false });

  if (filter && filter !== 'all') {
    query = query.eq('verification_status', filter);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return [];

  // Fetch facilitator_profiles separately to avoid PostgREST join issues
  const ids = data.map((f: { id: string }) => f.id);
  const { data: fpData } = await admin
    .from('facilitator_profiles')
    .select('*')
    .in('id', ids);

  const fpMap = new Map((fpData ?? []).map((fp: any) => [fp.id, fp]));
  return data.map((f: any) => ({ ...f, facilitator_profiles: fpMap.get(f.id) ?? null }));
}

export async function getFacilitatorById(id: string) {
  await requireSuperAdmin();
  const admin = createAdminClient();

  // Fetch base admin profile
  const { data, error } = await admin
    .from('admin_profiles')
    .select('*')
    .eq('id', id)
    .eq('role', 'facilitator')
    .single();

  if (error) throw new Error(error.message);

  // Fetch facilitator_profiles separately
  const { data: fp } = await admin
    .from('facilitator_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  // Fetch startup assignments separately
  const { data: assignments } = await admin
    .from('startup_facilitator_assignments')
    .select('id, status, created_at, reviewed_at, notes, startup_id')
    .eq('facilitator_id', id)
    .order('created_at', { ascending: false });

  let enrichedAssignments: any[] = [];
  if (assignments && assignments.length > 0) {
    const startupIds = assignments.map((a: any) => a.startup_id);
    const { data: startups } = await admin
      .from('startup_profiles')
      .select('id, brand_name, logo_url, stage, city, country')
      .in('id', startupIds);
    const spMap = new Map((startups ?? []).map((s: any) => [s.id, s]));
    enrichedAssignments = assignments.map((a: any) => ({
      ...a,
      startup_profiles: spMap.get(a.startup_id) ?? null,
    }));
  }

  return {
    ...data,
    facilitator_profiles: fp ?? null,
    startup_facilitator_assignments: enrichedAssignments,
  };
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

/** Get all startups visible to this facilitator (their approved/pending ones).
 *  SuperAdmins see ALL startups regardless of assignment. */
export async function getFacilitatorStartups(statusFilter?: 'all' | 'pending' | 'approved' | 'rejected' | 'suspended') {
  const session = await requireAdminOrFacilitator();
  const admin = createAdminClient();
  const isSuperAdmin = session.profile?.role === 'superadmin';

  if (isSuperAdmin) {
    // SuperAdmin: return ALL startup profiles directly (no assignment required)
    const { data: startups, error } = await admin
      .from('startup_profiles')
      .select('id, brand_name, logo_url, stage, city, country, is_published, is_featured, owner_id, created_at')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    if (!startups || startups.length === 0) return [];

    // Check assignment statuses for display
    const startupIds = startups.map((s: any) => s.id);
    const { data: assignments } = await admin
      .from('startup_facilitator_assignments')
      .select('startup_id, status, created_at, reviewed_at, notes')
      .in('startup_id', startupIds);
    const assignMap = new Map((assignments ?? []).map((a: any) => [a.startup_id, a]));

    let results = startups.map((s: any) => {
      const a = assignMap.get(s.id);
      return {
        id: a?.startup_id ?? s.id,
        status: a?.status ?? 'unassigned',
        created_at: a?.created_at ?? s.created_at,
        reviewed_at: a?.reviewed_at ?? null,
        notes: a?.notes ?? null,
        startup_id: s.id,
        startup_profiles: s,
      };
    });

    if (statusFilter && statusFilter !== 'all') {
      results = results.filter(r => r.status === statusFilter);
    }

    return results;
  }

  // Regular facilitator: only their assigned startups
  let query = admin
    .from('startup_facilitator_assignments')
    .select('id, status, created_at, reviewed_at, notes, startup_id')
    .eq('facilitator_id', session.effectiveFacilitatorId)
    .order('created_at', { ascending: false });

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return [];

  // Fetch startup profiles separately
  const startupIds = data.map((a: any) => a.startup_id);
  const { data: startups } = await admin
    .from('startup_profiles')
    .select('id, brand_name, logo_url, stage, city, country, is_published, is_featured, owner_id')
    .in('id', startupIds);
  const spMap = new Map((startups ?? []).map((s: any) => [s.id, s]));

  return data.map((a: any) => ({ ...a, startup_profiles: spMap.get(a.startup_id) ?? null }));
}

/** Get unverified startups not yet assigned to any facilitator. */
export async function getUnassignedStartups() {
  await requireAdminOrFacilitator();
  const admin = createAdminClient();

  // 1. Get all startup_profile IDs already in any assignment
  const { data: assignments } = await admin
    .from('startup_facilitator_assignments')
    .select('startup_id');
  const assignedSpIds = new Set((assignments ?? []).map((a: any) => a.startup_id as string));

  // 2. Get ALL startup profiles (then filter in JS — avoids PostgREST NOT IN issues with UUIDs)
  const { data: startups, error } = await admin
    .from('startup_profiles')
    .select('id, brand_name, logo_url, stage, city, country, owner_id, created_at')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  if (!startups || startups.length === 0) return [];

  // Filter out already-assigned ones in JS
  const unassigned = startups.filter((s: any) => !assignedSpIds.has(s.id));
  if (unassigned.length === 0) return [];

  // 3. Fetch admin_profiles for their owners — only those with pending verification
  const ownerIds = unassigned.map((s: any) => s.owner_id);
  const { data: adminProfiles } = await admin
    .from('admin_profiles')
    .select('id, display_name, email, verification_status, created_at')
    .in('id', ownerIds)
    .eq('role', 'startup')
    .eq('verification_status', 'pending');

  const apMap = new Map((adminProfiles ?? []).map((ap: any) => [ap.id, ap]));

  return unassigned
    .filter((s: any) => apMap.has(s.owner_id))
    .map((s: any) => {
      const ap = apMap.get(s.owner_id);
      return {
        id: ap.id,
        display_name: ap.display_name,
        email: ap.email,
        created_at: ap.created_at,
        startup_profiles: s,
      };
    });
}

export async function claimStartupForVerification(startupUserId: string) {
  const session = await requireAdminOrFacilitator();
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
    facilitator_id: session.effectiveFacilitatorId,
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
  const session = await requireAdminOrFacilitator();
  const admin = createAdminClient();
  const isSuperAdmin = session.profile?.role === 'superadmin';

  if (!isSuperAdmin) {
    // Verify this facilitator owns the assignment
    const { data: assignment, error: ae } = await admin
      .from('startup_facilitator_assignments')
      .select('id')
      .eq('startup_id', startupId)
      .eq('facilitator_id', session.effectiveFacilitatorId)
      .single();

    if (ae || !assignment) throw new Error('Forbidden: assignment not found');
  }

  // Update assignment if it exists
  const { error } = await admin
    .from('startup_facilitator_assignments')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      notes: notes ?? null,
    })
    .eq('startup_id', startupId)
    .match(isSuperAdmin ? {} : { facilitator_id: session.effectiveFacilitatorId });

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
  const session = await requireAdminOrFacilitator();
  const admin = createAdminClient();
  const isSuperAdmin = session.profile?.role === 'superadmin';

  if (!isSuperAdmin) {
    const { data: assignment } = await admin
      .from('startup_facilitator_assignments')
      .select('id')
      .eq('startup_id', startupId)
      .eq('facilitator_id', session.effectiveFacilitatorId)
      .single();

    if (!assignment) throw new Error('Forbidden: assignment not found');
  }

  await admin
    .from('startup_facilitator_assignments')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      notes,
    })
    .eq('startup_id', startupId)
    .match(isSuperAdmin ? {} : { facilitator_id: session.effectiveFacilitatorId });

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
  const session = await requireAdminOrFacilitator();
  const admin = createAdminClient();
  const isSuperAdmin = session.profile?.role === 'superadmin';

  if (!isSuperAdmin) {
    const { data: assignment } = await admin
      .from('startup_facilitator_assignments')
      .select('id')
      .eq('startup_id', startupId)
      .eq('facilitator_id', session.effectiveFacilitatorId)
      .single();

    if (!assignment) throw new Error('Forbidden: assignment not found');
  }

  await admin
    .from('startup_facilitator_assignments')
    .update({ status: 'suspended', notes: reason })
    .eq('startup_id', startupId)
    .match(isSuperAdmin ? {} : { facilitator_id: session.effectiveFacilitatorId });

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

// ─── Facilitator: Create Content ──────────────────────────────

export async function createFacilitatorJob(jobData: {
  title: string;
  company: string;
  description?: string;
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
  company_logo_url?: string;
  company_website?: string;
  benefits?: string;
  responsibilities?: string;
  is_active?: boolean;
  visibility?: 'public' | 'email_restricted';
}) {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  const { data, error } = await admin.from('jobs').insert({
    ...jobData,
    created_by: session.authId,
    facilitator_id: session.effectiveFacilitatorId,
    is_active: jobData.is_active ?? true,
    visibility: jobData.visibility ?? 'public',
  }).select().single();

  if (error) throw new Error(error.message);

  await writeAuditLog({
    actionType: 'create_job',
    actorId: session.authId,
    actorRole: 'facilitator',
    targetType: 'job',
    targetId: data.id,
    details: { title: jobData.title },
  });

  revalidatePath('/facilitator/jobs');
  return data;
}

export async function createFacilitatorGig(gigData: {
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
  visibility?: 'public' | 'email_restricted';
}) {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  const { data, error } = await admin.from('gigs').insert({
    ...gigData,
    created_by: session.authId,
    facilitator_id: session.effectiveFacilitatorId,
    is_active: gigData.is_active ?? true,
    visibility: gigData.visibility ?? 'public',
  }).select().single();

  if (error) throw new Error(error.message);

  await writeAuditLog({
    actionType: 'create_gig',
    actorId: session.authId,
    actorRole: 'facilitator',
    targetType: 'gig',
    targetId: data.id,
    details: { title: gigData.title },
  });

  revalidatePath('/facilitator/gigs');
  return data;
}

export async function createFacilitatorEvent(eventData: {
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
  visibility?: 'public' | 'email_restricted';
}) {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  const { data, error } = await admin.from('events').insert({
    ...eventData,
    created_by: session.authId,
    facilitator_id: session.effectiveFacilitatorId,
    is_active: eventData.is_active ?? true,
    tags: eventData.tags ?? [],
    is_featured: eventData.is_featured ?? false,
    visibility: eventData.visibility ?? 'public',
  }).select().single();

  if (error) throw new Error(error.message);

  await writeAuditLog({
    actionType: 'create_event',
    actorId: session.authId,
    actorRole: 'facilitator',
    targetType: 'event',
    targetId: data.id,
    details: { title: eventData.title },
  });

  revalidatePath('/facilitator/events');
  return data;
}

export async function createFacilitatorCompetition(compData: {
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
  visibility?: 'public' | 'email_restricted';
}) {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  const { data, error } = await admin.from('competitions').insert({
    ...compData,
    created_by: session.authId,
    facilitator_id: session.effectiveFacilitatorId,
    is_active: compData.is_active ?? true,
    tags: compData.tags ?? [],
    is_featured: compData.is_featured ?? false,
    is_external: compData.is_external ?? false,
    has_leaderboard: compData.has_leaderboard ?? false,
    participation_type: compData.participation_type ?? 'individual',
    team_size_min: compData.team_size_min ?? 1,
    team_size_max: compData.team_size_max ?? 4,
    visibility: compData.visibility ?? 'public',
  }).select('id').single();

  if (error) throw new Error(error.message);

  await writeAuditLog({
    actionType: 'create_competition',
    actorId: session.authId,
    actorRole: 'facilitator',
    targetType: 'competition',
    targetId: data.id,
    details: { title: compData.title },
  });

  revalidatePath('/facilitator/competitions');
  return data.id as string;
}

// ─── Facilitator: Scoped Content ──────────────────────────────

export async function getFacilitatorJobs() {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  // 1. Facilitator's own jobs
  const { data: ownJobs, error: ownError } = await admin
    .from('jobs')
    .select('*')
    .eq('facilitator_id', session.effectiveFacilitatorId)
    .order('created_at', { ascending: false });

  if (ownError) throw new Error(ownError.message);

  // 2. Approved startup IDs for this facilitator
  const { data: assignments } = await admin
    .from('startup_facilitator_assignments')
    .select('startup_id')
    .eq('facilitator_id', session.effectiveFacilitatorId)
    .eq('status', 'approved');

  const approvedStartupIds = (assignments ?? []).map((a: any) => a.startup_id as string);

  let startupJobs: any[] = [];
  if (approvedStartupIds.length > 0) {
    // 3. Startup jobs posted to facilitators (facilitator_only visibility) from approved startups
    const { data: sJobs } = await admin
      .from('jobs')
      .select('*')
      .in('startup_id', approvedStartupIds)
      .eq('visibility', 'facilitator_only')
      .order('created_at', { ascending: false });

    if (sJobs && sJobs.length > 0) {
      const { data: startups } = await admin
        .from('startup_profiles')
        .select('id, brand_name')
        .in('id', approvedStartupIds);

      const startupMap = new Map((startups ?? []).map((s: any) => [s.id, s.brand_name as string]));

      startupJobs = sJobs
        .filter((j: any) => !j.target_facilitator_ids || j.target_facilitator_ids.includes(session.authId))
        .map((j: any) => ({
          ...j,
          _startup_name: startupMap.get(j.startup_id) ?? 'Unknown Startup',
        }));
    }
  }

  // Combine and sort by created_at descending
  const allJobs = [
    ...(ownJobs ?? []).map((j: any) => ({ ...j, _startup_name: null })),
    ...startupJobs,
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return allJobs;
}

export async function getFacilitatorGigs() {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  // 1. Facilitator's own gigs
  const { data: ownGigs, error: ownError } = await admin
    .from('gigs')
    .select('*')
    .eq('facilitator_id', session.effectiveFacilitatorId)
    .order('created_at', { ascending: false });

  if (ownError) throw new Error(ownError.message);

  // 2. Approved startup IDs for this facilitator
  const { data: assignments } = await admin
    .from('startup_facilitator_assignments')
    .select('startup_id')
    .eq('facilitator_id', session.effectiveFacilitatorId)
    .eq('status', 'approved');

  const approvedStartupIds = (assignments ?? []).map((a: any) => a.startup_id as string);

  let startupGigs: any[] = [];
  if (approvedStartupIds.length > 0) {
    const { data: sGigs } = await admin
      .from('gigs')
      .select('*')
      .in('startup_id', approvedStartupIds)
      .eq('visibility', 'facilitator_only')
      .order('created_at', { ascending: false });

    if (sGigs && sGigs.length > 0) {
      const { data: startups } = await admin
        .from('startup_profiles')
        .select('id, brand_name')
        .in('id', approvedStartupIds);

      const startupMap = new Map((startups ?? []).map((s: any) => [s.id, s.brand_name as string]));

      startupGigs = sGigs
        .filter((g: any) => !g.target_facilitator_ids || g.target_facilitator_ids.includes(session.authId))
        .map((g: any) => ({
          ...g,
          _startup_name: startupMap.get(g.startup_id) ?? 'Unknown Startup',
        }));
    }
  }

  return [
    ...(ownGigs ?? []).map((g: any) => ({ ...g, _startup_name: null })),
    ...startupGigs,
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getFacilitatorEvents() {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  // 1. Facilitator's own events
  const { data: ownEvents, error: ownError } = await admin
    .from('events')
    .select('*')
    .eq('facilitator_id', session.effectiveFacilitatorId)
    .order('created_at', { ascending: false });

  if (ownError) throw new Error(ownError.message);

  // 2. Approved startup IDs for this facilitator
  const { data: assignments } = await admin
    .from('startup_facilitator_assignments')
    .select('startup_id')
    .eq('facilitator_id', session.effectiveFacilitatorId)
    .eq('status', 'approved');

  const approvedStartupIds = (assignments ?? []).map((a: any) => a.startup_id as string);

  let startupEvents: any[] = [];
  if (approvedStartupIds.length > 0) {
    const { data: sEvents } = await admin
      .from('events')
      .select('*')
      .in('startup_id', approvedStartupIds)
      .eq('visibility', 'facilitator_only')
      .order('created_at', { ascending: false });

    if (sEvents && sEvents.length > 0) {
      const { data: startups } = await admin
        .from('startup_profiles')
        .select('id, brand_name')
        .in('id', approvedStartupIds);

      const startupMap = new Map((startups ?? []).map((s: any) => [s.id, s.brand_name as string]));

      startupEvents = sEvents
        .filter((e: any) => !e.target_facilitator_ids || e.target_facilitator_ids.includes(session.authId))
        .map((e: any) => ({
          ...e,
          _startup_name: startupMap.get(e.startup_id) ?? 'Unknown Startup',
        }));
    }
  }

  const allEvents = [
    ...(ownEvents ?? []).map((e: any) => ({ ...e, _startup_name: null })),
    ...startupEvents,
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return allEvents;
}

export async function getFacilitatorCompetitions() {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  // 1. Facilitator's own competitions
  const { data: ownComps, error: ownError } = await admin
    .from('competitions')
    .select('*, participant_count:competition_entries(count)')
    .eq('facilitator_id', session.effectiveFacilitatorId)
    .order('created_at', { ascending: false });

  if (ownError) throw new Error(ownError.message);

  const normalizeComp = (row: any) => ({
    ...row,
    participant_count: Array.isArray(row.participant_count)
      ? (row.participant_count as { count: number }[])[0]?.count ?? 0
      : (row.participant_count ?? 0),
    tags: row.tags ?? [],
  });

  // 2. Approved startup IDs for this facilitator
  const { data: assignments } = await admin
    .from('startup_facilitator_assignments')
    .select('startup_id')
    .eq('facilitator_id', session.effectiveFacilitatorId)
    .eq('status', 'approved');

  const approvedStartupIds = (assignments ?? []).map((a: any) => a.startup_id as string);

  let startupComps: any[] = [];
  if (approvedStartupIds.length > 0) {
    const { data: sComps } = await admin
      .from('competitions')
      .select('*, participant_count:competition_entries(count)')
      .in('startup_id', approvedStartupIds)
      .eq('visibility', 'facilitator_only')
      .order('created_at', { ascending: false });

    if (sComps && sComps.length > 0) {
      const { data: startups } = await admin
        .from('startup_profiles')
        .select('id, brand_name')
        .in('id', approvedStartupIds);

      const startupMap = new Map((startups ?? []).map((s: any) => [s.id, s.brand_name as string]));

      startupComps = sComps
        .filter((c: any) => !c.target_facilitator_ids || c.target_facilitator_ids.includes(session.authId))
        .map((c: any) => ({
          ...normalizeComp(c),
          _startup_name: startupMap.get(c.startup_id) ?? 'Unknown Startup',
        }));
    }
  }

  const allComps = [
    ...(ownComps ?? []).map((c: any) => ({ ...normalizeComp(c), _startup_name: null })),
    ...startupComps,
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return allComps;
}

export async function getFacilitatorApplications() {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('applications')
    .select('*')
    .eq('facilitator_id', session.effectiveFacilitatorId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getFacilitatorDashboardStats() {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  const eid = session.effectiveFacilitatorId;
  const [jobs, gigs, events, competitions, applications, startups] = await Promise.all([
    admin.from('jobs').select('id', { count: 'exact', head: true }).eq('facilitator_id', eid),
    admin.from('gigs').select('id', { count: 'exact', head: true }).eq('facilitator_id', eid),
    admin.from('events').select('id', { count: 'exact', head: true }).eq('facilitator_id', eid),
    admin.from('competitions').select('id', { count: 'exact', head: true }).eq('facilitator_id', eid),
    admin.from('applications').select('id', { count: 'exact', head: true }).eq('facilitator_id', eid),
    admin.from('startup_facilitator_assignments').select('id', { count: 'exact', head: true })
      .eq('facilitator_id', eid).eq('status', 'approved'),
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

/** Get full startup profile detail — only if assigned to this facilitator (or superadmin). */
export async function getFacilitatorStartupDetail(startupProfileId: string) {
  const session = await requireAdminOrFacilitator();
  const admin = createAdminClient();
  const isSuperAdmin = session.profile?.role === 'superadmin';

  let assignment: any = null;
  if (isSuperAdmin) {
    // SuperAdmin can view any startup; fetch assignment if it exists
    const { data } = await admin
      .from('startup_facilitator_assignments')
      .select('id, status, notes, created_at, reviewed_at')
      .eq('startup_id', startupProfileId)
      .maybeSingle();
    assignment = data ?? { id: null, status: 'unassigned', notes: null, created_at: null, reviewed_at: null };
  } else {
    const { data, error: ae } = await admin
      .from('startup_facilitator_assignments')
      .select('id, status, notes, created_at, reviewed_at')
      .eq('startup_id', startupProfileId)
      .eq('facilitator_id', session.effectiveFacilitatorId)
      .maybeSingle();

    if (ae) throw new Error(ae.message);
    if (!data) throw new Error('Forbidden: startup not assigned to you');
    assignment = data;
  }

  // Fetch full startup profile
  const { data: sp, error: spe } = await admin
    .from('startup_profiles')
    .select('*')
    .eq('id', startupProfileId)
    .single();

  if (spe || !sp) throw new Error('Startup profile not found');

  // Fetch related tables separately (avoid PostgREST join issues)
  const [founderRes, fundingRes, incubatorRes, awardRes] = await Promise.all([
    admin.from('startup_founders').select('*').eq('startup_id', sp.id).order('display_order', { ascending: true }),
    admin.from('startup_funding_rounds').select('*').eq('startup_id', sp.id).order('round_date', { ascending: false }),
    admin.from('startup_incubators').select('*').eq('startup_id', sp.id).order('year', { ascending: false }),
    admin.from('startup_awards').select('*').eq('startup_id', sp.id).order('year', { ascending: false }),
  ]);

  return {
    assignment,
    profile: {
      ...sp,
      keywords: sp.keywords || [],
      categories: sp.categories || [],
      founders: founderRes.data || [],
      funding_rounds: fundingRes.data || [],
      incubators: incubatorRes.data || [],
      awards: awardRes.data || [],
    },
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
