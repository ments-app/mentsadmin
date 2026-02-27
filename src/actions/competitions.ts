'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import type { Competition, CompetitionRound, CompetitionFaq } from '@/lib/types';

// ─── Competitions ─────────────────────────────────────────────

export async function getCompetitions() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('competitions')
    .select('*, participant_count:competition_entries(count)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    ...row,
    participant_count: (row.participant_count as { count: number }[])[0]?.count ?? 0,
    tags: row.tags ?? [],
  })) as (Competition & { participant_count: number })[];
}

export async function getCompetition(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('competitions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return { ...data, tags: data.tags ?? [] } as Competition;
}

export async function createCompetition(formData: {
  title: string;
  description: string;
  deadline: string;
  is_external: boolean;
  external_url: string;
  has_leaderboard: boolean;
  prize_pool: string;
  banner_image_url: string;
  created_by: string;
  // Extended fields
  tags: string[];
  is_featured: boolean;
  is_active: boolean;
  domain: string;
  organizer_name: string;
  participation_type: string;
  team_size_min: number;
  team_size_max: number;
  eligibility_criteria: string;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('competitions')
    .insert({
      title: formData.title,
      description: formData.description || null,
      deadline: formData.deadline || null,
      is_external: formData.is_external,
      external_url: formData.external_url || null,
      has_leaderboard: formData.has_leaderboard,
      prize_pool: formData.prize_pool || null,
      banner_image_url: formData.banner_image_url || null,
      created_by: formData.created_by,
      tags: formData.tags,
      is_featured: formData.is_featured,
      is_active: formData.is_active,
      domain: formData.domain || null,
      organizer_name: formData.organizer_name || null,
      participation_type: formData.participation_type || 'individual',
      team_size_min: formData.team_size_min || 1,
      team_size_max: formData.team_size_max || 1,
      eligibility_criteria: formData.eligibility_criteria || null,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/competitions');
  revalidatePath('/dashboard');
  return data.id as string;
}

export async function updateCompetition(
  id: string,
  formData: {
    title: string;
    description: string;
    deadline: string;
    is_external: boolean;
    external_url: string;
    has_leaderboard: boolean;
    prize_pool: string;
    banner_image_url: string;
    // Extended fields
    tags: string[];
    is_featured: boolean;
    is_active: boolean;
    domain: string;
    organizer_name: string;
    participation_type: string;
    team_size_min: number;
    team_size_max: number;
    eligibility_criteria: string;
  }
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('competitions')
    .update({
      title: formData.title,
      description: formData.description || null,
      deadline: formData.deadline || null,
      is_external: formData.is_external,
      external_url: formData.external_url || null,
      has_leaderboard: formData.has_leaderboard,
      prize_pool: formData.prize_pool || null,
      banner_image_url: formData.banner_image_url || null,
      tags: formData.tags,
      is_featured: formData.is_featured,
      is_active: formData.is_active,
      domain: formData.domain || null,
      organizer_name: formData.organizer_name || null,
      participation_type: formData.participation_type || 'individual',
      team_size_min: formData.team_size_min || 1,
      team_size_max: formData.team_size_max || 1,
      eligibility_criteria: formData.eligibility_criteria || null,
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/competitions');
  revalidatePath('/dashboard');
}

export async function deleteCompetition(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('competitions').delete().eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/competitions');
  revalidatePath('/dashboard');
}

// ─── Competition Rounds ───────────────────────────────────────

export async function getCompetitionRounds(competitionId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('competition_rounds')
    .select('*')
    .eq('competition_id', competitionId)
    .order('round_number', { ascending: true });

  if (error) throw new Error(error.message);
  return data as CompetitionRound[];
}

export async function upsertCompetitionRounds(
  competitionId: string,
  rounds: Array<{
    id?: string;
    round_number: number;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
  }>
) {
  const supabase = createAdminClient();

  // Delete all existing rounds and re-insert (simplest upsert strategy)
  const { error: delError } = await supabase
    .from('competition_rounds')
    .delete()
    .eq('competition_id', competitionId);
  if (delError) throw new Error(delError.message);

  if (rounds.length === 0) return;

  const { error } = await supabase.from('competition_rounds').insert(
    rounds.map((r, i) => ({
      competition_id: competitionId,
      round_number: i + 1,
      title: r.title,
      description: r.description || null,
      start_date: r.start_date || null,
      end_date: r.end_date || null,
    }))
  );
  if (error) throw new Error(error.message);
}

// ─── Competition FAQs ─────────────────────────────────────────

export async function getCompetitionFaqs(competitionId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('competition_faqs')
    .select('*')
    .eq('competition_id', competitionId)
    .order('order_index', { ascending: true });

  if (error) throw new Error(error.message);
  return data as CompetitionFaq[];
}

export async function upsertCompetitionFaqs(
  competitionId: string,
  faqs: Array<{ question: string; answer: string }>
) {
  const supabase = createAdminClient();

  const { error: delError } = await supabase
    .from('competition_faqs')
    .delete()
    .eq('competition_id', competitionId);
  if (delError) throw new Error(delError.message);

  if (faqs.length === 0) return;

  const { error } = await supabase.from('competition_faqs').insert(
    faqs.map((f, i) => ({
      competition_id: competitionId,
      question: f.question,
      answer: f.answer,
      order_index: i,
    }))
  );
  if (error) throw new Error(error.message);
}

// ─── Competition Registrations ────────────────────────────────

export async function getCompetitionRegistrations(competitionId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('competition_entries')
    .select('*, users:submitted_by(id, name, email, avatar_url)')
    .eq('competition_id', competitionId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateRegistrationStatus(
  entryId: string,
  status: 'registered' | 'shortlisted' | 'winner' | 'rejected',
  adminNotes?: string
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('competition_entries')
    .update({ status, admin_notes: adminNotes ?? null })
    .eq('id', entryId);

  if (error) throw new Error(error.message);
}
