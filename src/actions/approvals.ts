'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireSuperAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

type ContentType = 'job' | 'gig' | 'event' | 'competition';
type ApprovalStatus = 'approved' | 'rejected';

const TABLE_MAP: Record<ContentType, string> = {
  job: 'jobs',
  gig: 'gigs',
  event: 'events',
  competition: 'competitions',
};

export async function getPendingContent() {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const [jobs, gigs, events, competitions] = await Promise.all([
    admin
      .from('jobs')
      .select('id, title, company, job_type, created_at, startup_id, startup_profiles(brand_name, logo_url)')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false }),
    admin
      .from('gigs')
      .select('id, title, budget, category, created_at, startup_id, startup_profiles(brand_name, logo_url)')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false }),
    admin
      .from('events')
      .select('id, title, event_type, event_date, created_at, startup_id, startup_profiles(brand_name, logo_url)')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false }),
    admin
      .from('competitions')
      .select('id, title, domain, deadline, created_at, startup_id, startup_profiles(brand_name, logo_url)')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false }),
  ]);

  return {
    jobs:         (jobs.data         ?? []).map(r => ({ ...r, _type: 'job'         as ContentType })),
    gigs:         (gigs.data         ?? []).map(r => ({ ...r, _type: 'gig'         as ContentType })),
    events:       (events.data       ?? []).map(r => ({ ...r, _type: 'event'       as ContentType })),
    competitions: (competitions.data ?? []).map(r => ({ ...r, _type: 'competition' as ContentType })),
  };
}

export async function reviewContent(
  type: ContentType,
  id: string,
  status: ApprovalStatus,
  rejectionReason?: string,
) {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const table = TABLE_MAP[type];

  const { error } = await admin
    .from(table)
    .update({
      approval_status: status,
      is_active: status === 'approved',
      ...(rejectionReason ? { rejection_reason: rejectionReason } : {}),
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/approvals');
}
