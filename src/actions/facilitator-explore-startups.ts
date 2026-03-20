'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireSuperAdmin, requireAdminOrFacilitator } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// ─── Types ──────────────────────────────────────────────────────

export interface ExploreStartupEntry {
  id: string;
  startup_name: string;
  email: string | null;
  mobile: string | null;
  website: string | null;
  contact_person: string | null;
  address: string | null;
  sector: string | null;
  created_at: string;
  uploaded_to_superadmin: boolean;
}

export interface BulkStartupResult {
  added: number;
  skipped: number;
  invalid: number;
}

// ─── Check if current user is superadmin ────────────────────────

export async function checkIsSuperAdmin(): Promise<boolean> {
  const session = await requireAdminOrFacilitator();
  return session.profile?.role === 'superadmin';
}

// ─── Get all explore startups (facilitator: own, superadmin: all) ─

export async function getExploreStartups(): Promise<ExploreStartupEntry[]> {
  const session = await requireAdminOrFacilitator();
  const admin = createAdminClient();

  // Both facilitators and superadmins see all explore startups
  const { data, error } = await admin
    .from('facilitator_explore_startups')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ─── Add a single startup (superadmin only) ─────────────────────

export async function addExploreStartup(entry: {
  startup_name: string;
  email?: string;
  mobile?: string;
  website?: string;
  contact_person?: string;
  address?: string;
  sector?: string;
}): Promise<void> {
  const session = await requireSuperAdmin();
  const admin = createAdminClient();

  const name = entry.startup_name?.trim();
  if (!name) throw new Error('Startup Name is required');

  const { error } = await admin.from('facilitator_explore_startups').insert({
    facilitator_id: session.authId,
    startup_name: name,
    email: entry.email?.trim() || null,
    mobile: entry.mobile?.trim() || null,
    website: entry.website?.trim() || null,
    contact_person: entry.contact_person?.trim() || null,
    address: entry.address?.trim() || null,
    sector: entry.sector?.trim() || null,
    uploaded_to_superadmin: true,
  });

  if (error) throw new Error(error.message);
  revalidatePath('/facilitator/explore-startups');
  revalidatePath('/dashboard');
}

// ─── Bulk add startups from CSV (superadmin only) ────────────────

export async function bulkAddExploreStartups(
  rows: Array<{
    startup_name: string;
    email?: string;
    mobile?: string;
    website?: string;
    contact_person?: string;
    address?: string;
    sector?: string;
  }>
): Promise<BulkStartupResult> {
  const session = await requireSuperAdmin();
  const admin = createAdminClient();

  const valid: typeof rows = [];
  let invalid = 0;

  for (const row of rows) {
    const name = row.startup_name?.trim();
    if (!name) { invalid++; continue; }
    valid.push({ ...row, startup_name: name });
  }

  if (valid.length === 0) return { added: 0, skipped: 0, invalid };

  // Deduplicate by startup_name (case-insensitive)
  const seen = new Set<string>();
  const deduped: typeof valid = [];
  for (const row of valid) {
    const key = row.startup_name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }
  const skipped = valid.length - deduped.length;

  const { error } = await admin.from('facilitator_explore_startups').insert(
    deduped.map((row) => ({
      facilitator_id: session.authId,
      startup_name: row.startup_name.trim(),
      email: row.email?.trim() || null,
      mobile: row.mobile?.trim() || null,
      website: row.website?.trim() || null,
      contact_person: row.contact_person?.trim() || null,
      address: row.address?.trim() || null,
      sector: row.sector?.trim() || null,
      uploaded_to_superadmin: true,
    }))
  );

  if (error) throw new Error(error.message);
  revalidatePath('/facilitator/explore-startups');
  revalidatePath('/dashboard');
  return { added: deduped.length, skipped, invalid };
}

// ─── Delete an explore startup (superadmin only) ─────────────────

export async function deleteExploreStartup(id: string): Promise<void> {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from('facilitator_explore_startups')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/facilitator/explore-startups');
}
