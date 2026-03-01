'use server';

import { createAdminClient, createAuthClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import type { AdminRole, AdminProfile, FacilitatorProfile } from '@/lib/auth';

// ─── Current User ─────────────────────────────────────────────

export async function getMyProfile(): Promise<AdminProfile | null> {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from('admin_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return data ?? null;
}

// ─── Facilitator Registration ─────────────────────────────────

export async function registerAsFacilitator(formData: {
  displayName: string;
  organisationName: string;
  organisationAddress: string;
  organisationType: string;
  officialEmail: string;
  pocName: string;
  contactNumber: string;
  website?: string;
  documentUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Not authenticated' };

  const admin = createAdminClient();

  // Check if already registered
  const { data: existing } = await admin
    .from('admin_profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (existing) {
    return { success: false, error: 'Account already registered as ' + existing.role };
  }

  // Insert admin_profiles row
  const { error: profileError } = await admin.from('admin_profiles').insert({
    id: user.id,
    role: 'facilitator',
    verification_status: 'pending',
    display_name: formData.displayName,
    email: user.email,
  });

  if (profileError) return { success: false, error: profileError.message };

  // Insert facilitator_profiles row
  const { error: fpError } = await admin.from('facilitator_profiles').insert({
    id: user.id,
    organisation_name: formData.organisationName,
    organisation_address: formData.organisationAddress,
    organisation_type: formData.organisationType,
    official_email: formData.officialEmail,
    poc_name: formData.pocName,
    contact_number: formData.contactNumber,
    website: formData.website || null,
    document_url: formData.documentUrl || null,
  });

  if (fpError) {
    // Rollback admin_profiles insert
    await admin.from('admin_profiles').delete().eq('id', user.id);
    return { success: false, error: fpError.message };
  }

  return { success: true };
}

// ─── Startup Registration ─────────────────────────────────────

export async function registerAsStartup(formData: {
  displayName: string;
  startupName: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Not authenticated' };

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('admin_profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (existing) {
    return { success: false, error: 'Account already registered as ' + existing.role };
  }

  const { error } = await admin.from('admin_profiles').insert({
    id: user.id,
    role: 'startup',
    verification_status: 'approved',
    display_name: formData.displayName || formData.startupName,
    email: user.email,
  });

  if (error) return { success: false, error: error.message };

  return { success: true };
}

// ─── New Startup Registration (no existing Ments account) ─────

export async function registerNewStartup(formData: {
  username: string;
  fullName: string;
  brandName: string;
  stage: string;
  startupEmail: string;
  startupPhone?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const admin = createAdminClient();

  // Already registered?
  const { data: existingAdmin } = await admin
    .from('admin_profiles').select('id').eq('id', user.id).maybeSingle();
  if (existingAdmin) return { success: false, error: 'Account already registered' };

  // Username taken?
  const username = formData.username.toLowerCase().trim();
  const { data: existingUsername } = await admin
    .from('users').select('id').eq('username', username).maybeSingle();
  if (existingUsername) return { success: false, error: 'Username already taken. Please choose another.' };

  // 1. Create users record (Ments platform profile)
  const { error: usersErr } = await admin.from('users').insert({
    id: user.id,
    email: user.email,
    username,
    full_name: formData.fullName.trim(),
    avatar_url: user.user_metadata?.avatar_url || null,
    is_verified: false,
    is_suspended: false,
    created_at: new Date().toISOString(),
  });
  if (usersErr) return { success: false, error: usersErr.message };

  // 2. Create admin_profiles (auto-approved — no facilitator verification needed)
  const { error: adminErr } = await admin.from('admin_profiles').insert({
    id: user.id,
    role: 'startup',
    verification_status: 'approved',
    display_name: formData.fullName.trim(),
    email: user.email,
  });
  if (adminErr) {
    await admin.from('users').delete().eq('id', user.id);
    return { success: false, error: adminErr.message };
  }

  // 3. Create startup_profiles (live immediately)
  await admin.from('startup_profiles').insert({
    owner_id: user.id,
    brand_name: formData.brandName.trim(),
    stage: formData.stage || 'ideation',
    startup_email: formData.startupEmail.trim(),
    startup_phone: formData.startupPhone?.trim() || null,
    keywords: [],
    categories: [],
    is_published: true,
    is_featured: false,
    is_actively_raising: false,
    visibility: 'public',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return { success: true };
}

// ─── Auto-register existing Ments user as Startup ─────────────
// Called from /onboarding/startup — checks if this Google account has a
// Ments platform profile; if so, registers them as a startup automatically.

export async function autoRegisterMentsStartup(): Promise<{ found: boolean; error?: string }> {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { found: false, error: 'Not authenticated' };

  const admin = createAdminClient();

  // Already registered in admin panel?
  const { data: existingAdmin } = await admin
    .from('admin_profiles').select('id').eq('id', user.id).maybeSingle();
  if (existingAdmin) return { found: true };

  // Check for Ments platform account
  const { data: mentsUser } = await admin
    .from('users').select('id, full_name, role').eq('id', user.id).maybeSingle();

  if (!mentsUser) return { found: false };

  // Register as startup (auto-approved)
  const { error } = await admin.from('admin_profiles').insert({
    id: user.id,
    role: 'startup',
    verification_status: 'approved',
    display_name: mentsUser.full_name || user.email,
    email: user.email,
  });
  if (error) return { found: false, error: error.message };

  return { found: true };
}

// ─── Get Facilitator Profile ──────────────────────────────────

export async function getMyFacilitatorProfile(): Promise<FacilitatorProfile | null> {
  const profile = await getMyProfile();
  if (!profile || profile.role !== 'facilitator') return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from('facilitator_profiles')
    .select('*')
    .eq('id', profile.id)
    .single();

  return data ?? null;
}

// ─── Upload Document ──────────────────────────────────────────

export async function uploadVerificationDocument(
  file: FormData
): Promise<{ url: string | null; error?: string }> {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { url: null, error: 'Not authenticated' };

  const fileObj = file.get('file') as File;
  if (!fileObj) return { url: null, error: 'No file provided' };

  const admin = createAdminClient();
  const ext = fileObj.name.split('.').pop();
  const path = `verification-docs/${user.id}-${Date.now()}.${ext}`;

  const { error } = await admin.storage
    .from('admin-documents')
    .upload(path, fileObj, { upsert: false });

  if (error) return { url: null, error: error.message };

  const { data: urlData } = admin.storage
    .from('admin-documents')
    .getPublicUrl(path);

  return { url: urlData.publicUrl };
}

// ─── Audit Log Helper ─────────────────────────────────────────

export async function writeAuditLog(params: {
  actionType: string;
  actorId: string;
  actorRole: AdminRole;
  targetType: string;
  targetId: string;
  details?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  await admin.from('audit_logs').insert({
    action_type: params.actionType,
    actor_id: params.actorId,
    actor_role: params.actorRole,
    target_type: params.targetType,
    target_id: params.targetId,
    details: params.details ?? {},
  });
}
