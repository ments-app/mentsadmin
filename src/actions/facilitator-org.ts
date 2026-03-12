'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireFacilitator, requireSuperAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export interface Organization {
  id: string;
  slug: string;
  name: string;
  org_type: string;
  short_bio: string | null;
  description: string | null;
  website: string | null;
  contact_email: string | null;
  logo_url: string | null;
  banner_url: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  university_name: string | null;
  sectors: string[];
  stage_focus: string[];
  support_types: string[];
  is_verified: boolean;
  is_published: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OrgStartupRelation {
  id: string;
  organization_id: string;
  startup_id: string;
  relation_type: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  startup_profiles?: {
    id: string;
    brand_name: string;
    logo_url: string | null;
    stage: string | null;
    city: string | null;
    country: string | null;
  } | null;
}

export type OrganizationType =
  | 'incubator'
  | 'accelerator'
  | 'ecell'
  | 'college_incubator'
  | 'facilitator'
  | 'venture_studio'
  | 'grant_body'
  | 'community'
  | 'other';

const VALID_ORG_TYPES = new Set<string>([
  'incubator', 'accelerator', 'ecell', 'college_incubator',
  'facilitator', 'venture_studio', 'grant_body', 'community', 'other',
]);

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

async function getUniqueSlug(admin: ReturnType<typeof createAdminClient>, name: string): Promise<string> {
  const base = slugify(name);
  if (!base) return `org-${Date.now().toString().slice(-6)}`;

  // Check if base slug is available
  const { data } = await admin
    .from('organizations')
    .select('slug')
    .eq('slug', base)
    .maybeSingle();

  if (!data) return base;

  // Try with numeric suffix
  for (let i = 2; i <= 50; i++) {
    const candidate = `${base}-${i}`;
    const { data: existing } = await admin
      .from('organizations')
      .select('slug')
      .eq('slug', candidate)
      .maybeSingle();
    if (!existing) return candidate;
  }

  return `${base}-${Date.now().toString().slice(-6)}`;
}

// ─── Facilitator: Get my organization ─────────────────────────

export async function getMyOrganization(): Promise<{
  org: Organization | null;
  startupRelations: OrgStartupRelation[];
}> {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  // Find org membership for this user (co-admins use the parent facilitator's ID)
  const { data: membership } = await admin
    .from('organization_members')
    .select('organization_id, role, status')
    .eq('user_id', session.effectiveFacilitatorId)
    .maybeSingle();

  if (!membership) {
    return { org: null, startupRelations: [] };
  }

  // Fetch the organization
  const { data: org, error } = await admin
    .from('organizations')
    .select('*')
    .eq('id', membership.organization_id)
    .single();

  if (error || !org) {
    return { org: null, startupRelations: [] };
  }

  // Fetch startup relations
  const { data: relations } = await admin
    .from('organization_startup_relations')
    .select('id, organization_id, startup_id, relation_type, status, start_date, end_date')
    .eq('organization_id', org.id);

  let enrichedRelations: OrgStartupRelation[] = [];
  if (relations && relations.length > 0) {
    const startupIds = relations.map((r: any) => r.startup_id);
    const { data: startups } = await admin
      .from('startup_profiles')
      .select('id, brand_name, logo_url, stage, city, country')
      .in('id', startupIds);

    const spMap = new Map((startups ?? []).map((s: any) => [s.id, s]));
    enrichedRelations = relations.map((r: any) => ({
      ...r,
      startup_profiles: spMap.get(r.startup_id) ?? null,
    }));
  }

  return {
    org: {
      ...org,
      sectors: org.sectors ?? [],
      stage_focus: org.stage_focus ?? [],
      support_types: org.support_types ?? [],
    } as Organization,
    startupRelations: enrichedRelations,
  };
}

// ─── Facilitator: Update my organization ──────────────────────

export async function updateMyOrganization(data: {
  name?: string;
  short_bio?: string;
  description?: string;
  website?: string;
  contact_email?: string;
  city?: string;
  state?: string;
  country?: string;
  university_name?: string;
  sectors?: string[];
  stage_focus?: string[];
  support_types?: string[];
  is_published?: boolean;
}) {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  // Find the org this user belongs to (co-admins use the parent facilitator's ID)
  const { data: membership } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', session.effectiveFacilitatorId)
    .maybeSingle();

  if (!membership) throw new Error('No organization found for this user');

  const { error } = await admin
    .from('organizations')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', membership.organization_id);

  if (error) throw new Error(error.message);

  revalidatePath('/facilitator/profile');
}

// ─── Facilitator: Create my organization ──────────────────────

export async function createMyOrganization(data: {
  name: string;
  org_type: OrganizationType;
  short_bio?: string;
  description?: string;
  website?: string;
  contact_email?: string;
  logo_url?: string;
  banner_url?: string;
  city?: string;
  state?: string;
  country?: string;
  university_name?: string;
  sectors?: string[];
  stage_focus?: string[];
  support_types?: string[];
  is_published?: boolean;
}): Promise<Organization> {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  // Co-admins cannot create orgs — only the primary facilitator can
  if (session.authId !== session.effectiveFacilitatorId) {
    throw new Error('Only the primary facilitator account can create an organization');
  }

  // Check if user already has an org
  const { data: existing } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', session.authId)
    .maybeSingle();

  if (existing) throw new Error('You already have an organization');

  const name = data.name?.trim();
  if (!name) throw new Error('Organization name is required');
  if (!VALID_ORG_TYPES.has(data.org_type)) throw new Error('Invalid organization type');

  const slug = await getUniqueSlug(admin, name);

  const payload = {
    slug,
    name,
    org_type: data.org_type,
    short_bio: data.short_bio?.trim() || null,
    description: data.description?.trim() || null,
    website: data.website?.trim() || null,
    contact_email: data.contact_email?.trim() || null,
    logo_url: data.logo_url?.trim() || null,
    banner_url: data.banner_url?.trim() || null,
    city: data.city?.trim() || null,
    state: data.state?.trim() || null,
    country: data.country?.trim() || null,
    university_name: data.university_name?.trim() || null,
    sectors: Array.isArray(data.sectors) ? data.sectors.filter(Boolean) : [],
    stage_focus: Array.isArray(data.stage_focus) ? data.stage_focus.filter(Boolean) : [],
    support_types: Array.isArray(data.support_types) ? data.support_types.filter(Boolean) : [],
    is_published: Boolean(data.is_published),
    created_by: session.authId,
  };

  const { data: org, error: insertError } = await admin
    .from('organizations')
    .insert(payload)
    .select('*')
    .single();

  if (insertError) throw new Error(insertError.message);

  // Create membership as owner
  const { error: memberError } = await admin
    .from('organization_members')
    .insert({
      organization_id: org.id,
      user_id: session.authId,
      role: 'owner',
      status: 'active',
    });

  if (memberError) throw new Error(memberError.message);

  revalidatePath('/facilitator/profile');

  return {
    ...org,
    sectors: org.sectors ?? [],
    stage_focus: org.stage_focus ?? [],
    support_types: org.support_types ?? [],
  } as Organization;
}

// ─── SuperAdmin: Get organization by user ID ──────────────────

export async function getOrganizationByUserId(userId: string): Promise<{
  org: Organization | null;
  startupRelations: OrgStartupRelation[];
}> {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { data: membership } = await admin
    .from('organization_members')
    .select('organization_id, role, status')
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { org: null, startupRelations: [] };
  }

  const { data: org, error } = await admin
    .from('organizations')
    .select('*')
    .eq('id', membership.organization_id)
    .single();

  if (error || !org) {
    return { org: null, startupRelations: [] };
  }

  const { data: relations } = await admin
    .from('organization_startup_relations')
    .select('id, organization_id, startup_id, relation_type, status, start_date, end_date')
    .eq('organization_id', org.id);

  let enrichedRelations: OrgStartupRelation[] = [];
  if (relations && relations.length > 0) {
    const startupIds = relations.map((r: any) => r.startup_id);
    const { data: startups } = await admin
      .from('startup_profiles')
      .select('id, brand_name, logo_url, stage, city, country')
      .in('id', startupIds);

    const spMap = new Map((startups ?? []).map((s: any) => [s.id, s]));
    enrichedRelations = relations.map((r: any) => ({
      ...r,
      startup_profiles: spMap.get(r.startup_id) ?? null,
    }));
  }

  return {
    org: {
      ...org,
      sectors: org.sectors ?? [],
      stage_focus: org.stage_focus ?? [],
      support_types: org.support_types ?? [],
    } as Organization,
    startupRelations: enrichedRelations,
  };
}

// ─── SuperAdmin: Get org summary for facilitator list ─────────

export async function getFacilitatorOrgsForList(
  userIds: string[]
): Promise<Record<string, { logo_url: string | null; city: string | null; country: string | null }>> {
  await requireSuperAdmin();
  const admin = createAdminClient();

  if (userIds.length === 0) return {};

  const { data: memberships } = await admin
    .from('organization_members')
    .select('user_id, organization_id')
    .in('user_id', userIds);

  if (!memberships || memberships.length === 0) return {};

  const orgIds = memberships.map((m: any) => m.organization_id);
  const { data: orgs } = await admin
    .from('organizations')
    .select('id, logo_url, city, country')
    .in('id', orgIds);

  if (!orgs) return {};

  const orgMap = new Map((orgs as any[]).map((o) => [o.id, o]));
  const result: Record<string, { logo_url: string | null; city: string | null; country: string | null }> = {};

  for (const m of memberships as any[]) {
    const o = orgMap.get(m.organization_id);
    if (o) {
      result[m.user_id] = { logo_url: o.logo_url, city: o.city, country: o.country };
    }
  }

  return result;
}
