'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireFacilitator } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// ─── Facilitator: Create a startup ───────────────────────────

export async function createFacilitatorStartupProfile(data: {
  brand_name: string;
  stage?: string;
  description?: string;
  startup_email?: string;
  startup_phone?: string;
  city?: string;
  country?: string;
  website?: string;
  business_model?: string;
  categories?: string[];
  keywords?: string[];
}): Promise<{ id: string }> {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  const brandName = data.brand_name?.trim();
  if (!brandName) throw new Error('Brand name is required');

  // Create startup with facilitator as temporary owner
  const { data: sp, error: insertError } = await admin
    .from('startup_profiles')
    .insert({
      owner_id: session.effectiveFacilitatorId,
      brand_name: brandName,
      stage: data.stage || 'ideation',
      description: data.description?.trim() || null,
      startup_email: data.startup_email?.trim() || null,
      startup_phone: data.startup_phone?.trim() || null,
      city: data.city?.trim() || null,
      country: data.country?.trim() || null,
      website: data.website?.trim() || null,
      business_model: data.business_model?.trim() || null,
      categories: Array.isArray(data.categories) ? data.categories.filter(Boolean) : [],
      keywords: Array.isArray(data.keywords) ? data.keywords.filter(Boolean) : [],
      is_published: false,
      is_featured: false,
      is_actively_raising: false,
      visibility: 'public',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (insertError) throw new Error(insertError.message);

  // Auto-create assignment so it shows in facilitator's "My Startups"
  await admin.from('startup_facilitator_assignments').insert({
    startup_id: sp.id,
    facilitator_id: session.effectiveFacilitatorId,
    status: 'approved',
    assigned_by: session.authId,
    reviewed_at: new Date().toISOString(),
    notes: 'Auto-assigned: created by facilitator',
  });

  revalidatePath('/facilitator/startups');
  return { id: sp.id };
}

// ─── Facilitator: Get startups created by me ─────────────────

export async function getFacilitatorCreatedStartups() {
  const session = await requireFacilitator();
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
  await requireFacilitator();
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
  const session = await requireFacilitator();
  const admin = createAdminClient();

  // Verify facilitator has access to this startup via assignment
  const { data: assignment } = await admin
    .from('startup_facilitator_assignments')
    .select('id')
    .eq('startup_id', startupId)
    .eq('facilitator_id', session.effectiveFacilitatorId)
    .maybeSingle();

  if (!assignment) throw new Error('Forbidden: startup not assigned to you');

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
