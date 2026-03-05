'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireSuperAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export type InvestorStatus = 'none' | 'applied' | 'verified' | 'rejected';

export async function getInvestorApplications(filter?: InvestorStatus | 'all') {
  await requireSuperAdmin();
  const admin = createAdminClient();

  let query = admin
    .from('users')
    .select(`
      id,
      full_name,
      email,
      linkedin,
      investor_status,
      investor_verified_at,
      investor_profiles (
        firm_name,
        investor_type,
        affiliated_fund,
        check_size_min,
        check_size_max,
        preferred_stages,
        preferred_sectors,
        thesis,
        website,
        location,
        is_actively_investing,
        created_at
      )
    `)
    .not('investor_status', 'eq', 'none')
    .order('investor_profiles(created_at)', { ascending: false });

  if (filter && filter !== 'all') {
    query = query.eq('investor_status', filter);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function approveInvestor(userId: string) {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from('users')
    .update({
      investor_status: 'verified',
      investor_verified_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/investors');
}

export async function rejectInvestor(userId: string) {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from('users')
    .update({ investor_status: 'rejected' })
    .eq('id', userId);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/investors');
}

export async function revokeInvestor(userId: string) {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from('users')
    .update({ investor_status: 'none', investor_verified_at: null })
    .eq('id', userId);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/investors');
}
