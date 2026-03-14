'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireSuperAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export type StartupProfile = {
  id: string;
  owner_id: string;
  brand_name: string;
  registered_name: string | null;
  legal_status: string | null;
  cin: string | null;
  stage: string | null;
  description: string | null;
  keywords: string[];
  website: string | null;
  founded_date: string | null;
  startup_email: string | null;
  startup_phone: string | null;
  pitch_deck_url: string | null;
  is_actively_raising: boolean;
  visibility: string;
  is_published: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  business_model: string | null;
  city: string | null;
  country: string | null;
  categories: string[];
  team_size: string | null;
  logo_url: string | null;
  banner_url: string | null;
  total_raised: string | null;
  investor_count: number | null;
  elevator_pitch: string | null;
  target_audience: string | null;
  traction_metrics: string | null;
  owner?: {
    username: string;
    full_name: string;
    avatar_url: string | null;
    email: string;
  };
};

export async function getStartupProfiles(filter: 'all' | 'published' | 'unpublished' | 'featured' = 'all', page = 1, limit = 50): Promise<{ startups: StartupProfile[]; total: number }> {
  await requireSuperAdmin();
  const supabase = createAdminClient();
  const offset = (page - 1) * limit;

  let query = supabase
    .from('startup_profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filter === 'published') query = query.eq('is_published', true);
  else if (filter === 'unpublished') query = query.eq('is_published', false);
  else if (filter === 'featured') query = query.eq('is_featured', true);

  const { data: startups, count } = await query;
  if (!startups || startups.length === 0) return { startups: [], total: count || 0 };

  const ownerIds = [...new Set(startups.map((s: { owner_id: string }) => s.owner_id))];
  const ownersRes = await supabase
    .from('users')
    .select('id, username, full_name, avatar_url, email')
    .in('id', ownerIds);

  const ownersMap = new Map<string, { username: string; full_name: string; avatar_url: string | null; email: string }>();
  ownersRes.data?.forEach((u: { id: string; username: string; full_name: string; avatar_url: string | null; email: string }) => {
    ownersMap.set(u.id, { username: u.username, full_name: u.full_name, avatar_url: u.avatar_url, email: u.email });
  });

  return {
    startups: startups.map((s: StartupProfile) => ({
      ...s,
      keywords: s.keywords || [],
      categories: s.categories || [],
      owner: ownersMap.get(s.owner_id),
    })),
    total: count || 0,
  };
}

export async function getStartupProfile(id: string): Promise<StartupProfile | null> {
  await requireSuperAdmin();
  const supabase = createAdminClient();
  const { data } = await supabase.from('startup_profiles').select('*').eq('id', id).single();
  if (!data) return null;

  const ownerRes = await supabase.from('users').select('id, username, full_name, avatar_url, email').eq('id', data.owner_id).single();
  return {
    ...data,
    keywords: data.keywords || [],
    categories: data.categories || [],
    owner: ownerRes.data || undefined,
  };
}

export async function toggleStartupFeatured(id: string, featured: boolean) {
  await requireSuperAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('startup_profiles')
    .update({ is_featured: featured, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/startups');
}

export async function toggleStartupPublished(id: string, published: boolean) {
  await requireSuperAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('startup_profiles')
    .update({ is_published: published, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/startups');
}

export async function toggleStartupVisibility(id: string, visibility: 'public' | 'investors_only' | 'private') {
  await requireSuperAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('startup_profiles')
    .update({ visibility, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/startups');
}

export async function deleteStartupProfile(id: string) {
  await requireSuperAdmin();
  const supabase = createAdminClient();

  // Remove dependent startup-owned data first to satisfy foreign keys.
  await supabase.from('applications').delete().eq('startup_id', id);
  await supabase.from('startup_bookmarks').delete().eq('startup_id', id);
  await supabase.from('startup_profile_views').delete().eq('startup_id', id);
  await supabase.from('startup_upvotes').delete().eq('startup_id', id);
  await supabase.from('startup_links').delete().eq('startup_id', id);
  await supabase.from('startup_slides').delete().eq('startup_id', id);
  await supabase.from('startup_text_sections').delete().eq('startup_id', id);
  await supabase.from('startup_awards').delete().eq('startup_id', id);
  await supabase.from('startup_incubators').delete().eq('startup_id', id);
  await supabase.from('startup_funding_rounds').delete().eq('startup_id', id);
  await supabase.from('startup_founders').delete().eq('startup_id', id);
  await supabase.from('startup_facilitator_assignments').delete().eq('startup_id', id);
  await supabase.from('organization_startup_relations').delete().eq('startup_id', id);
  await supabase.from('investor_deals').delete().eq('startup_id', id);
  await supabase.from('competitions').delete().eq('startup_id', id);
  await supabase.from('events').delete().eq('startup_id', id);
  await supabase.from('gigs').delete().eq('startup_id', id);
  await supabase.from('jobs').delete().eq('startup_id', id);

  const { error } = await supabase.from('startup_profiles').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/startups');
}

// ─── Extended types for full profile ──────────────────────────

export type StartupFounder = {
  id: string;
  startup_id: string;
  name: string;
  role: string | null;
  linkedin_url: string | null;
  email: string | null;
  user_id: string | null;
  ments_username: string | null;
  avatar_url: string | null;
  status: 'pending' | 'accepted' | 'declined';
  display_order: number;
  created_at: string;
};

export type StartupFundingRound = {
  id: string;
  startup_id: string;
  investor: string | null;
  amount: string | null;
  round_type: 'pre_seed' | 'seed' | 'series_a' | 'series_b' | 'series_c' | 'other' | null;
  round_date: string | null;
  is_public: boolean;
  created_at: string;
};

export type StartupIncubator = {
  id: string;
  startup_id: string;
  program_name: string;
  year: number | null;
  created_at: string;
};

export type StartupAward = {
  id: string;
  startup_id: string;
  award_name: string;
  year: number | null;
  created_at: string;
};

export type FullStartupProfile = StartupProfile & {
  key_strengths: string | null;
  address_line1: string | null;
  address_line2: string | null;
  state: string | null;
  revenue_amount: string | null;
  revenue_currency: string | null;
  revenue_growth: string | null;
  founders: StartupFounder[];
  funding_rounds: StartupFundingRound[];
  incubators: StartupIncubator[];
  awards: StartupAward[];
};

export type SimpleUser = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
};

// ─── Extended actions ──────────────────────────────────────────

export async function getFullStartupProfile(id: string): Promise<FullStartupProfile | null> {
  await requireSuperAdmin();
  const supabase = createAdminClient();
  const { data } = await supabase.from('startup_profiles').select('*').eq('id', id).single();
  if (!data) return null;

  const [founderRes, fundingRes, incubatorRes, awardRes, ownerRes] = await Promise.all([
    supabase.from('startup_founders').select('*').eq('startup_id', id).order('display_order', { ascending: true }),
    supabase.from('startup_funding_rounds').select('*').eq('startup_id', id).order('round_date', { ascending: false }),
    supabase.from('startup_incubators').select('*').eq('startup_id', id).order('year', { ascending: false }),
    supabase.from('startup_awards').select('*').eq('startup_id', id).order('year', { ascending: false }),
    supabase.from('users').select('id, username, full_name, avatar_url, email').eq('id', data.owner_id).single(),
  ]);

  return {
    ...data,
    keywords: data.keywords || [],
    categories: data.categories || [],
    owner: ownerRes.data || undefined,
    founders: founderRes.data || [],
    funding_rounds: fundingRes.data || [],
    incubators: incubatorRes.data || [],
    awards: awardRes.data || [],
  };
}

export async function findUserByEmail(email: string): Promise<SimpleUser | null> {
  await requireSuperAdmin();
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('users')
    .select('id, username, full_name, avatar_url, email')
    .eq('email', email.toLowerCase().trim())
    .single();
  return data || null;
}

export async function getStartupByOwnerId(ownerId: string): Promise<string | null> {
  await requireSuperAdmin();
  const supabase = createAdminClient();
  const { data } = await supabase.from('startup_profiles').select('id').eq('owner_id', ownerId).single();
  return data?.id ?? null;
}

export async function updateStartupCoreProfile(id: string, updates: Record<string, unknown>) {
  await requireSuperAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('startup_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/startups/${id}`);
  revalidatePath(`/dashboard/startups/${id}/edit`);
  revalidatePath('/dashboard/startups');
}

export async function createAdminStartupProfile(
  ownerId: string,
  data: { brand_name: string; legal_status: 'llp' | 'pvt_ltd' | 'sole_proprietorship' | 'not_registered'; stage?: string; startup_email?: string; startup_phone?: string }
): Promise<{ id: string }> {
  await requireSuperAdmin();
  const supabase = createAdminClient();
  const { data: result, error } = await supabase
    .from('startup_profiles')
    .insert({
      owner_id: ownerId,
      brand_name: data.brand_name,
      legal_status: data.legal_status,
      stage: data.stage || 'ideation',
      startup_email: data.startup_email || null,
      startup_phone: data.startup_phone || null,
      keywords: [],
      categories: [],
      is_published: true,
      is_featured: false,
      is_actively_raising: false,
      visibility: 'public',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/startups');
  return { id: result.id };
}

export async function upsertStartupFounders(
  startupId: string,
  founders: Array<{ name: string; role?: string; email?: string; ments_username?: string; display_order?: number }>
) {
  await requireSuperAdmin();
  const supabase = createAdminClient();
  await supabase.from('startup_founders').delete().eq('startup_id', startupId);
  if (founders.length === 0) return;
  const { error } = await supabase.from('startup_founders').insert(
    founders.map((f, i) => ({
      startup_id: startupId,
      name: f.name,
      role: f.role || null,
      email: f.email || null,
      ments_username: f.ments_username || null,
      status: 'pending' as const,
      display_order: f.display_order ?? i,
    }))
  );
  if (error) throw new Error(error.message);
}

export async function upsertFundingRounds(
  startupId: string,
  rounds: Array<{ investor?: string; amount?: string; round_type?: string; round_date?: string; is_public?: boolean }>
) {
  await requireSuperAdmin();
  const supabase = createAdminClient();
  await supabase.from('startup_funding_rounds').delete().eq('startup_id', startupId);
  if (rounds.length === 0) return;
  const { error } = await supabase.from('startup_funding_rounds').insert(
    rounds.map((r) => ({
      startup_id: startupId,
      investor: r.investor || null,
      amount: r.amount || null,
      round_type: r.round_type || null,
      round_date: r.round_date || null,
      is_public: r.is_public ?? true,
    }))
  );
  if (error) throw new Error(error.message);
}

export async function upsertStartupIncubators(
  startupId: string,
  incubators: Array<{ program_name: string; year?: number | null }>
) {
  await requireSuperAdmin();
  const supabase = createAdminClient();
  await supabase.from('startup_incubators').delete().eq('startup_id', startupId);
  if (incubators.length === 0) return;
  const { error } = await supabase.from('startup_incubators').insert(
    incubators.map((i) => ({ startup_id: startupId, program_name: i.program_name, year: i.year || null }))
  );
  if (error) throw new Error(error.message);
}

export async function upsertStartupAwards(
  startupId: string,
  awards: Array<{ award_name: string; year?: number | null }>
) {
  await requireSuperAdmin();
  const supabase = createAdminClient();
  await supabase.from('startup_awards').delete().eq('startup_id', startupId);
  if (awards.length === 0) return;
  const { error } = await supabase.from('startup_awards').insert(
    awards.map((a) => ({ startup_id: startupId, award_name: a.award_name, year: a.year || null }))
  );
  if (error) throw new Error(error.message);
}
