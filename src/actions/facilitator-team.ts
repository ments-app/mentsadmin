'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireFacilitator } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export interface TeamMember {
  id: string;
  facilitator_id: string;
  email: string;
  display_name: string | null;
  invited_by: string | null;
  invited_at: string;
  user_id: string | null;
  accepted_at: string | null;
  status: 'pending' | 'active' | 'removed';
}

export async function getMyTeamMembers(): Promise<TeamMember[]> {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('facilitator_team_members')
    .select('*')
    .eq('facilitator_id', session.effectiveFacilitatorId)
    .neq('status', 'removed')
    .order('invited_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function inviteTeamMember(email: string, displayName?: string): Promise<void> {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  const trimmed = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    throw new Error('Invalid email address');
  }

  if (trimmed === session.email.toLowerCase()) {
    throw new Error('You cannot add yourself as a team member');
  }

  const { error } = await admin.from('facilitator_team_members').insert({
    facilitator_id: session.effectiveFacilitatorId,
    email: trimmed,
    display_name: displayName?.trim() || null,
    invited_by: session.authId,
    status: 'pending',
  });

  if (error) {
    if (error.code === '23505') throw new Error('This email is already in your team');
    throw new Error(error.message);
  }

  revalidatePath('/facilitator/team');
}

export async function removeTeamMember(memberId: string): Promise<void> {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  const { data: member } = await admin
    .from('facilitator_team_members')
    .select('id, user_id')
    .eq('id', memberId)
    .eq('facilitator_id', session.effectiveFacilitatorId)
    .maybeSingle();

  if (!member) throw new Error('Team member not found');

  await admin
    .from('facilitator_team_members')
    .update({ status: 'removed' })
    .eq('id', memberId);

  // Suspend the co-admin's dashboard access
  if (member.user_id) {
    await admin
      .from('admin_profiles')
      .update({ verification_status: 'suspended' })
      .eq('id', member.user_id)
      .eq('parent_facilitator_id', session.effectiveFacilitatorId);
  }

  revalidatePath('/facilitator/team');
}
