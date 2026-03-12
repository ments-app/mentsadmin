'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import type { Event } from '@/lib/types';

export async function getEvents() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({ ...row, tags: row.tags ?? [] })) as Event[];
}

export async function getEvent(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return { ...data, tags: data.tags ?? [] } as Event;
}

export async function createEvent(formData: {
  title: string;
  description: string;
  event_date: string;
  location: string;
  event_url: string;
  banner_image_url: string;
  event_type: string;
  is_active: boolean;
  created_by: string;
  // Extended fields
  tags: string[];
  is_featured: boolean;
  organizer_name: string;
  category: string;
  // Arena fields
  entry_type?: string | null;
  arena_enabled?: boolean;
  virtual_fund_amount?: number;
  max_investment_per_startup?: number;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('events').insert({
    title: formData.title,
    description: formData.description || null,
    event_date: formData.event_date || null,
    location: formData.location || null,
    event_url: formData.event_url || null,
    banner_image_url: formData.banner_image_url || null,
    event_type: formData.event_type,
    is_active: formData.is_active,
    created_by: formData.created_by,
    tags: formData.tags,
    is_featured: formData.is_featured,
    organizer_name: formData.organizer_name || null,
    category: formData.category || 'event',
    entry_type: formData.entry_type || null,
    arena_enabled: formData.arena_enabled ?? false,
    virtual_fund_amount: formData.virtual_fund_amount ?? 1000000,
    max_investment_per_startup: formData.max_investment_per_startup ?? 100000,
    arena_round: formData.arena_enabled ? 'registration' : null,
  });

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/events');
  revalidatePath('/dashboard');
}

export async function updateEvent(
  id: string,
  formData: {
    title: string;
    description: string;
    event_date: string;
    location: string;
    event_url: string;
    banner_image_url: string;
    event_type: string;
    is_active: boolean;
    // Extended fields
    tags: string[];
    is_featured: boolean;
    organizer_name: string;
    category: string;
    visibility?: string;
    target_facilitator_ids?: string[] | null;
    // Arena fields
    entry_type?: string | null;
    arena_enabled?: boolean;
    virtual_fund_amount?: number;
    max_investment_per_startup?: number;
    arena_round?: string | null;
  }
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('events')
    .update({
      title: formData.title,
      description: formData.description || null,
      event_date: formData.event_date || null,
      location: formData.location || null,
      event_url: formData.event_url || null,
      banner_image_url: formData.banner_image_url || null,
      event_type: formData.event_type,
      is_active: formData.is_active,
      tags: formData.tags,
      is_featured: formData.is_featured,
      organizer_name: formData.organizer_name || null,
      category: formData.category || 'event',
      ...(formData.visibility !== undefined ? { visibility: formData.visibility } : {}),
      target_facilitator_ids: formData.target_facilitator_ids ?? null,
      entry_type: formData.entry_type || null,
      arena_enabled: formData.arena_enabled ?? false,
      virtual_fund_amount: formData.virtual_fund_amount ?? 1000000,
      max_investment_per_startup: formData.max_investment_per_startup ?? 100000,
      arena_round: formData.arena_round || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/events');
  revalidatePath('/dashboard');
}

export async function getEventStalls(eventId: string) {
  const supabase = createAdminClient();
  const { data: stalls, error } = await supabase
    .from('event_stalls')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  if (!stalls || stalls.length === 0) return [];

  // Fetch user info separately
  const userIds = [...new Set(stalls.map(s => s.user_id))];
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, username, avatar_url')
    .in('id', userIds);

  // Fetch linked startups
  const startupIds = stalls.map(s => s.startup_id).filter(Boolean);
  let startups: { id: string; brand_name: string; logo_url: string | null; stage: string }[] = [];
  if (startupIds.length > 0) {
    const { data } = await supabase
      .from('startup_profiles')
      .select('id, brand_name, logo_url, stage')
      .in('id', startupIds);
    startups = data ?? [];
  }

  const userMap = Object.fromEntries((users ?? []).map(u => [u.id, u]));
  const startupMap = Object.fromEntries(startups.map(s => [s.id, s]));

  return stalls.map(s => ({
    ...s,
    user: userMap[s.user_id] ?? null,
    startup: s.startup_id ? startupMap[s.startup_id] ?? null : null,
  }));
}

export async function getEventAudience(eventId: string) {
  const supabase = createAdminClient();
  const { data: audience, error } = await supabase
    .from('event_audience')
    .select('*')
    .eq('event_id', eventId)
    .order('joined_at', { ascending: true });

  if (error) throw new Error(error.message);
  if (!audience || audience.length === 0) return [];

  // Fetch user info separately
  const userIds = [...new Set(audience.map(a => a.user_id))];
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, username, avatar_url')
    .in('id', userIds);

  const userMap = Object.fromEntries((users ?? []).map(u => [u.id, u]));

  return audience.map(a => ({
    ...a,
    user: userMap[a.user_id] ?? null,
  }));
}

export async function getEventLeaderboard(eventId: string) {
  const supabase = createAdminClient();

  // Get stalls with their total funding
  const { data: stalls, error: stallError } = await supabase
    .from('event_stalls')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  if (stallError) throw new Error(stallError.message);

  // Get investments grouped by stall
  const { data: investments, error: invError } = await supabase
    .from('event_investments')
    .select('stall_id, amount')
    .eq('event_id', eventId);

  if (invError) throw new Error(invError.message);

  // Aggregate funding per stall
  const fundingMap: Record<string, { total: number; count: number }> = {};
  for (const inv of investments ?? []) {
    if (!fundingMap[inv.stall_id]) fundingMap[inv.stall_id] = { total: 0, count: 0 };
    fundingMap[inv.stall_id].total += inv.amount;
    fundingMap[inv.stall_id].count += 1;
  }

  const leaderboard = (stalls ?? []).map((s) => ({
    ...s,
    total_funding: fundingMap[s.id]?.total ?? 0,
    investor_count: fundingMap[s.id]?.count ?? 0,
  }));

  leaderboard.sort((a, b) => b.total_funding - a.total_funding);
  return leaderboard;
}

export async function updateArenaRound(eventId: string, round: 'registration' | 'investment' | 'completed') {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('events')
    .update({ arena_round: round, updated_at: new Date().toISOString() })
    .eq('id', eventId);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/events');
}

export async function deleteEvent(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('events').delete().eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/events');
  revalidatePath('/dashboard');
}

export async function addEventStall(eventId: string, stallData: {
  user_id: string;
  stall_name: string;
  tagline?: string;
  description?: string;
  category?: string;
  startup_id?: string;
  logo_url?: string;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('event_stalls').insert({
    event_id: eventId,
    user_id: stallData.user_id,
    stall_name: stallData.stall_name,
    tagline: stallData.tagline || null,
    description: stallData.description || null,
    category: stallData.category || null,
    startup_id: stallData.startup_id || null,
    logo_url: stallData.logo_url || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/events/${eventId}`);
}
