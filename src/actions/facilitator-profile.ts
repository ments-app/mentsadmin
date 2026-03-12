'use server';

import { revalidatePath } from 'next/cache';
import { requireFacilitator } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';

type FacilitatorPublicProfileUpdates = {
  organisation_name?: string;
  organisation_address?: string;
  organisation_type?: 'ecell' | 'incubator' | 'accelerator' | 'college_cell' | 'other';
  official_email?: string;
  poc_name?: string;
  contact_number?: string;
  website?: string | null;
  slug?: string | null;
  short_bio?: string | null;
  public_description?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  university_name?: string | null;
  sectors?: string[];
  stage_focus?: string[];
  support_types?: string[];
  is_published?: boolean;
};

function normalizeSlug(value: string | null | undefined) {
  if (!value) return null;

  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return slug || null;
}

export async function getMyFacilitatorPublicProfile() {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  const { data: profile, error: profileError } = await admin
    .from('admin_profiles')
    .select('id, role, verification_status, display_name, email')
    .eq('id', session.authId)
    .single();

  if (profileError) throw new Error(profileError.message);

  const { data: facilitatorProfile, error } = await admin
    .from('facilitator_profiles')
    .select('*')
    .eq('id', session.effectiveFacilitatorId)
    .single();

  if (error) throw new Error(error.message);

  return {
    profile,
    facilitatorProfile: {
      ...facilitatorProfile,
      sectors: facilitatorProfile.sectors ?? [],
      stage_focus: facilitatorProfile.stage_focus ?? [],
      support_types: facilitatorProfile.support_types ?? [],
    },
  };
}

export async function updateMyFacilitatorPublicProfile(updates: FacilitatorPublicProfileUpdates) {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  const payload = {
    ...(updates.organisation_name !== undefined ? { organisation_name: updates.organisation_name.trim() } : {}),
    ...(updates.organisation_address !== undefined ? { organisation_address: updates.organisation_address.trim() } : {}),
    ...(updates.organisation_type !== undefined ? { organisation_type: updates.organisation_type } : {}),
    ...(updates.official_email !== undefined ? { official_email: updates.official_email.trim() } : {}),
    ...(updates.poc_name !== undefined ? { poc_name: updates.poc_name.trim() } : {}),
    ...(updates.contact_number !== undefined ? { contact_number: updates.contact_number.trim() } : {}),
    ...(updates.website !== undefined ? { website: updates.website?.trim() || null } : {}),
    ...(updates.slug !== undefined ? { slug: normalizeSlug(updates.slug) } : {}),
    ...(updates.short_bio !== undefined ? { short_bio: updates.short_bio?.trim() || null } : {}),
    ...(updates.public_description !== undefined ? { public_description: updates.public_description?.trim() || null } : {}),
    ...(updates.logo_url !== undefined ? { logo_url: updates.logo_url?.trim() || null } : {}),
    ...(updates.banner_url !== undefined ? { banner_url: updates.banner_url?.trim() || null } : {}),
    ...(updates.city !== undefined ? { city: updates.city?.trim() || null } : {}),
    ...(updates.state !== undefined ? { state: updates.state?.trim() || null } : {}),
    ...(updates.country !== undefined ? { country: updates.country?.trim() || null } : {}),
    ...(updates.university_name !== undefined ? { university_name: updates.university_name?.trim() || null } : {}),
    ...(updates.sectors !== undefined ? { sectors: updates.sectors.filter(Boolean) } : {}),
    ...(updates.stage_focus !== undefined ? { stage_focus: updates.stage_focus.filter(Boolean) } : {}),
    ...(updates.support_types !== undefined ? { support_types: updates.support_types.filter(Boolean) } : {}),
    ...(updates.is_published !== undefined ? { is_published: updates.is_published } : {}),
    public_updated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await admin
    .from('facilitator_profiles')
    .update(payload)
    .eq('id', session.effectiveFacilitatorId);

  if (error) throw new Error(error.message);

  revalidatePath('/facilitator/profile');
  revalidatePath('/facilitator/dashboard');
}
