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
    verification_status: 'pending',
    display_name: formData.displayName || formData.startupName,
    email: user.email,
  });

  if (error) return { success: false, error: error.message };

  return { success: true };
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
