'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import type { Competition } from '@/lib/types';

export async function getCompetitions() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('competitions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Competition[];
}

export async function getCompetition(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('competitions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data as Competition;
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
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('competitions').insert({
    title: formData.title,
    description: formData.description || null,
    deadline: formData.deadline || null,
    is_external: formData.is_external,
    external_url: formData.external_url || null,
    has_leaderboard: formData.has_leaderboard,
    prize_pool: formData.prize_pool || null,
    banner_image_url: formData.banner_image_url || null,
    created_by: formData.created_by,
  });

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/competitions');
  revalidatePath('/dashboard');
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
