'use server';

import { createAdminClient } from '@/lib/supabase-server';
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
  team_size: number | null;
  tagline: string | null;
  logo_url: string | null;
  banner_url: string | null;
  problem_statement: string | null;
  solution_statement: string | null;
  total_raised: number | null;
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
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('startup_profiles')
    .update({ is_featured: featured, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/startups');
}

export async function toggleStartupPublished(id: string, published: boolean) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('startup_profiles')
    .update({ is_published: published, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/startups');
}

export async function toggleStartupVisibility(id: string, visibility: 'public' | 'private') {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('startup_profiles')
    .update({ visibility, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/startups');
}

export async function deleteStartupProfile(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('startup_profiles').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/startups');
}
