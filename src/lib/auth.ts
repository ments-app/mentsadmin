import { createAdminClient, createAuthClient } from './supabase-server';

export type AdminRole = 'superadmin' | 'facilitator' | 'startup';
export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface AdminProfile {
  id: string;
  role: AdminRole;
  verification_status: VerificationStatus;
  display_name: string | null;
  email: string;
  created_at: string;
  updated_at: string;
  parent_facilitator_id: string | null;
}

export interface FacilitatorProfile {
  id: string;
  organisation_name: string;
  organisation_address: string;
  organisation_type: 'ecell' | 'incubator' | 'accelerator' | 'college_cell' | 'other';
  official_email: string;
  poc_name: string;
  contact_number: string;
  website: string | null;
  document_url: string | null;
  slug: string | null;
  short_bio: string | null;
  public_description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  university_name: string | null;
  sectors: string[] | null;
  stage_focus: string[] | null;
  support_types: string[] | null;
  is_published: boolean | null;
  public_updated_at: string | null;
  verification_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionUser {
  authId: string;
  email: string;
  profile: AdminProfile | null;
  facilitatorProfile: FacilitatorProfile | null;
  /** For co-admins: the parent facilitator's ID. For primary facilitators: their own ID. */
  effectiveFacilitatorId: string;
}

/**
 * Get the currently authenticated user with their admin_profiles record.
 * Uses the auth client (respects user session). Safe to call in Server Components.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('admin_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  let facilitatorProfile: FacilitatorProfile | null = null;

  if (profile?.role === 'facilitator') {
    // Co-admins load the parent facilitator's profile
    const facilitatorId = profile.parent_facilitator_id ?? user.id;
    const { data: fp } = await admin
      .from('facilitator_profiles')
      .select('*')
      .eq('id', facilitatorId)
      .single();
    facilitatorProfile = fp ?? null;
  }

  return {
    authId: user.id,
    email: user.email ?? '',
    profile: profile ?? null,
    facilitatorProfile,
    effectiveFacilitatorId: profile?.parent_facilitator_id ?? user.id,
  };
}

/**
 * Require a specific role. Throws if the user doesn't match.
 * Use in Server Actions to enforce backend role checks.
 */
export async function requireRole(
  allowedRoles: AdminRole[],
  requireApproved = true
): Promise<SessionUser> {
  const session = await getSessionUser();

  if (!session || !session.profile) {
    throw new Error('Unauthorized: not authenticated');
  }

  if (!allowedRoles.includes(session.profile.role)) {
    throw new Error(`Unauthorized: requires role ${allowedRoles.join(' or ')}`);
  }

  if (requireApproved && session.profile.role !== 'superadmin') {
    if (session.profile.verification_status !== 'approved') {
      throw new Error('Unauthorized: account not yet approved');
    }
  }

  return session;
}

/**
 * Require SuperAdmin specifically.
 */
export async function requireSuperAdmin(): Promise<SessionUser> {
  return requireRole(['superadmin']);
}

/**
 * Require a verified Facilitator.
 */
export async function requireFacilitator(): Promise<SessionUser> {
  return requireRole(['facilitator']);
}

/**
 * Require a verified Startup.
 */
export async function requireStartup(): Promise<SessionUser> {
  return requireRole(['startup'], false);
}

/**
 * Require SuperAdmin OR Facilitator (for shared operations).
 */
export async function requireAdminOrFacilitator(): Promise<SessionUser> {
  return requireRole(['superadmin', 'facilitator']);
}
