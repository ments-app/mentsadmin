'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireAdminOrFacilitator } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function getEditableFacilitatorStartup(admin: ReturnType<typeof createAdminClient>, facilitatorId: string, startupId: string, isSuperAdmin = false) {
  const { data: startup, error: startupError } = await admin
    .from('startup_profiles')
    .select('id, owner_id')
    .eq('id', startupId)
    .maybeSingle();

  if (startupError) throw new Error(startupError.message);
  if (!startup) throw new Error('Startup not found');

  // SuperAdmins can edit any startup
  if (isSuperAdmin) return startup;

  const { data: assignment, error: assignmentError } = await admin
    .from('startup_facilitator_assignments')
    .select('id')
    .eq('startup_id', startupId)
    .eq('facilitator_id', facilitatorId)
    .maybeSingle();

  if (assignmentError) throw new Error(assignmentError.message);

  if (!assignment && startup.owner_id !== facilitatorId) {
    throw new Error('Startup not found or not editable by your facilitator account');
  }

  return startup;
}

// ─── Facilitator: Create a startup ───────────────────────────

export async function createFacilitatorStartupProfile(data: {
  brand_name: string;
  registered_name?: string;
  legal_status: 'llp' | 'pvt_ltd' | 'sole_proprietorship' | 'not_registered';
  cin?: string;
  stage?: string;
  description?: string;
  startup_email?: string;
  startup_phone?: string;
  pitch_deck_url?: string;
  city?: string;
  state?: string;
  country?: string;
  address_line1?: string;
  address_line2?: string;
  website?: string;
  founded_date?: string;
  business_model?: string;
  key_strengths?: string;
  target_audience?: string;
  elevator_pitch?: string;
  revenue_amount?: string;
  revenue_currency?: string;
  revenue_growth?: string;
  traction_metrics?: string;
  total_raised?: string;
  investor_count?: number;
  logo_url?: string;
  banner_url?: string;
  raise_target?: string;
  equity_offered?: string;
  min_ticket_size?: string;
  funding_stage?: 'pre_seed' | 'seed' | 'series_a' | 'series_b' | 'series_c' | 'bridge';
  team_size?: string;
  sector?: string;
  pitch_video_url?: string;
  is_actively_raising?: boolean;
  categories?: string[];
  keywords?: string[];
  visibility?: 'public' | 'investors_only' | 'private';
  founders?: Array<{
    name: string;
    role?: string;
    email?: string;
    ments_username?: string;
    avatar_url?: string;
    status?: 'pending' | 'accepted' | 'declined';
    display_order?: number;
  }>;
}): Promise<{ id: string }> {
  const session = await requireAdminOrFacilitator();
  const admin = createAdminClient();

  const brandName = data.brand_name?.trim();
  if (!brandName) throw new Error('Brand name is required');
  if (!data.legal_status) throw new Error('Legal status is required');

  // Create startup with facilitator/superadmin as temporary owner
  const { data: sp, error: insertError } = await admin
    .from('startup_profiles')
    .insert({
      owner_id: session.authId,
      brand_name: brandName,
      registered_name: data.registered_name?.trim() || null,
      legal_status: data.legal_status,
      cin: data.cin?.trim() || null,
      stage: data.stage || 'ideation',
      description: data.description?.trim() || null,
      startup_email: data.startup_email?.trim() || null,
      startup_phone: data.startup_phone?.trim() || null,
      pitch_deck_url: data.pitch_deck_url?.trim() || null,
      city: data.city?.trim() || null,
      state: data.state?.trim() || null,
      country: data.country?.trim() || null,
      address_line1: data.address_line1?.trim() || null,
      address_line2: data.address_line2?.trim() || null,
      website: data.website?.trim() || null,
      founded_date: data.founded_date?.trim() || null,
      business_model: data.business_model?.trim() || null,
      key_strengths: data.key_strengths?.trim() || null,
      target_audience: data.target_audience?.trim() || null,
      elevator_pitch: data.elevator_pitch?.trim() || null,
      revenue_amount: data.revenue_amount?.trim() || null,
      revenue_currency: data.revenue_currency?.trim() || null,
      revenue_growth: data.revenue_growth?.trim() || null,
      traction_metrics: data.traction_metrics?.trim() || null,
      total_raised: data.total_raised?.trim() || null,
      investor_count: typeof data.investor_count === 'number' ? data.investor_count : null,
      logo_url: data.logo_url?.trim() || null,
      banner_url: data.banner_url?.trim() || null,
      raise_target: data.raise_target?.trim() || null,
      equity_offered: data.equity_offered?.trim() || null,
      min_ticket_size: data.min_ticket_size?.trim() || null,
      funding_stage: data.funding_stage || null,
      team_size: data.team_size?.trim() || null,
      sector: data.sector?.trim() || null,
      pitch_video_url: data.pitch_video_url?.trim() || null,
      categories: Array.isArray(data.categories) ? data.categories.filter(Boolean) : [],
      keywords: Array.isArray(data.keywords) ? data.keywords.filter(Boolean) : [],
      is_published: false,
      is_featured: false,
      is_actively_raising: data.is_actively_raising ?? false,
      visibility: data.visibility || 'public',
      entity_type: 'startup',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (insertError) throw new Error(insertError.message);

  const founders = Array.isArray(data.founders)
    ? data.founders.filter((founder) => founder.name.trim())
    : [];

  if (founders.length > 0) {
    const { error: founderInsertError } = await admin
      .from('startup_founders')
      .insert(
        founders.map((founder, index) => ({
          startup_id: sp.id,
          name: founder.name.trim(),
          role: founder.role?.trim() || null,
          email: founder.email?.trim() || null,
          ments_username: founder.ments_username?.trim() || null,
          avatar_url: founder.avatar_url?.trim() || null,
          status: founder.status ?? 'pending',
          display_order: founder.display_order ?? index,
        }))
      );

    if (founderInsertError) {
      await admin.from('startup_profiles').delete().eq('id', sp.id);
      throw new Error(founderInsertError.message);
    }
  }

  // Auto-create assignment so it shows in facilitator's "My Startups" (skip for superadmins)
  if (session.profile?.role === 'facilitator') {
    await admin.from('startup_facilitator_assignments').insert({
      startup_id: sp.id,
      facilitator_id: session.effectiveFacilitatorId,
      status: 'approved',
      assigned_by: session.authId,
      reviewed_at: new Date().toISOString(),
      notes: 'Auto-assigned: created by facilitator',
      relation_type: 'supported',
    });
  }

  revalidatePath('/facilitator/startups');
  return { id: sp.id };
}

// ─── Facilitator: Get startups created by me ─────────────────

export async function getFacilitatorCreatedStartups() {
  const session = await requireAdminOrFacilitator();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('startup_profiles')
    .select('id, brand_name, logo_url, stage, city, country, is_published, owner_id, created_at')
    .eq('owner_id', session.effectiveFacilitatorId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ─── Facilitator: Transfer startup ownership ─────────────────

export async function searchUserForTransfer(email: string) {
  await requireAdminOrFacilitator();
  const admin = createAdminClient();

  const trimmed = email.toLowerCase().trim();
  if (!trimmed) return null;

  const { data } = await admin
    .from('users')
    .select('id, username, full_name, avatar_url, email')
    .eq('email', trimmed)
    .single();

  return data ?? null;
}

export async function transferStartupOwnership(startupId: string, newOwnerEmail: string) {
  const session = await requireAdminOrFacilitator();
  const admin = createAdminClient();
  const isSuperAdmin = session.profile?.role === 'superadmin';

  if (!isSuperAdmin) {
    // Verify facilitator has access to this startup via assignment
    const { data: assignment } = await admin
      .from('startup_facilitator_assignments')
      .select('id')
      .eq('startup_id', startupId)
      .eq('facilitator_id', session.effectiveFacilitatorId)
      .maybeSingle();

    if (!assignment) throw new Error('Forbidden: startup not assigned to you');
  }

  // Verify the startup is still owned by the facilitator (hasn't been transferred already)
  const { data: sp } = await admin
    .from('startup_profiles')
    .select('owner_id, brand_name')
    .eq('id', startupId)
    .single();

  if (!sp) throw new Error('Startup not found');

  // Find the new owner
  const { data: newOwner } = await admin
    .from('users')
    .select('id, email, full_name')
    .eq('email', newOwnerEmail.toLowerCase().trim())
    .single();

  if (!newOwner) throw new Error('User not found with this email');

  if (newOwner.id === sp.owner_id) throw new Error('This user already owns this startup');

  // Check if the new owner already has a startup
  const { data: existingStartup } = await admin
    .from('startup_profiles')
    .select('id')
    .eq('owner_id', newOwner.id)
    .maybeSingle();

  if (existingStartup) throw new Error('This user already owns another startup profile');

  // Transfer ownership
  const { error: updateError } = await admin
    .from('startup_profiles')
    .update({
      owner_id: newOwner.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', startupId);

  if (updateError) throw new Error(updateError.message);

  // Ensure the new owner has an admin_profiles record with startup role
  const { data: existingAdmin } = await admin
    .from('admin_profiles')
    .select('id')
    .eq('id', newOwner.id)
    .maybeSingle();

  if (!existingAdmin) {
    await admin.from('admin_profiles').insert({
      id: newOwner.id,
      role: 'startup',
      verification_status: 'approved',
      display_name: newOwner.full_name,
      email: newOwner.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  revalidatePath('/facilitator/startups');
  revalidatePath(`/facilitator/startups/${startupId}`);
}

export async function getFacilitatorOwnedStartupProfile(startupId: string) {
  const session = await requireAdminOrFacilitator();
  const admin = createAdminClient();
  const isSuperAdmin = session.profile?.role === 'superadmin';

  await getEditableFacilitatorStartup(admin, session.effectiveFacilitatorId, startupId, isSuperAdmin);

  const { data: profile, error } = await admin
    .from('startup_profiles')
    .select('*')
    .eq('id', startupId)
    .single();

  if (error) throw new Error(error.message);

  const { data: founders, error: founderError } = await admin
    .from('startup_founders')
    .select('*')
    .eq('startup_id', startupId)
    .order('display_order', { ascending: true });

  if (founderError) throw new Error(founderError.message);

  return {
    ...profile,
    keywords: profile.keywords ?? [],
    categories: profile.categories ?? [],
    founders: founders ?? [],
  };
}

export async function updateFacilitatorOwnedStartupProfile(startupId: string, updates: Record<string, unknown>) {
  const session = await requireAdminOrFacilitator();
  const admin = createAdminClient();
  const isSuperAdmin = session.profile?.role === 'superadmin';

  await getEditableFacilitatorStartup(admin, session.effectiveFacilitatorId, startupId, isSuperAdmin);

  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const { error } = await admin
    .from('startup_profiles')
    .update(payload)
    .eq('id', startupId);

  if (error) throw new Error(error.message);

  revalidatePath('/facilitator/startups');
  revalidatePath(`/facilitator/startups/${startupId}`);
  revalidatePath(`/facilitator/startups/${startupId}/edit`);
}

export async function updateFacilitatorOwnedStartupFounders(
  startupId: string,
  founders: Array<{ name: string; role?: string; email?: string; ments_username?: string; display_order?: number }>
) {
  const session = await requireAdminOrFacilitator();
  const admin = createAdminClient();
  const isSuperAdmin = session.profile?.role === 'superadmin';

  await getEditableFacilitatorStartup(admin, session.effectiveFacilitatorId, startupId, isSuperAdmin);

  await admin.from('startup_founders').delete().eq('startup_id', startupId);
  if (founders.length === 0) {
    revalidatePath(`/facilitator/startups/${startupId}`);
    revalidatePath(`/facilitator/startups/${startupId}/edit`);
    return;
  }

  const { error } = await admin.from('startup_founders').insert(
    founders.map((founder, index) => ({
      startup_id: startupId,
      name: founder.name.trim(),
      role: founder.role?.trim() || null,
      email: founder.email?.trim() || null,
      ments_username: founder.ments_username?.trim() || null,
      status: 'pending' as const,
      display_order: founder.display_order ?? index,
    }))
  );

  if (error) throw new Error(error.message);

  revalidatePath(`/facilitator/startups/${startupId}`);
  revalidatePath(`/facilitator/startups/${startupId}/edit`);
}
