'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireFacilitator } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { sendInviteEmail } from '@/lib/email';

export interface StudentEmailEntry {
  email: string;
  added_at: string;
  user: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export async function getMyStudentEmails(): Promise<StudentEmailEntry[]> {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('facilitator_student_emails')
    .select('email, added_at')
    .eq('facilitator_id', session.authId)
    .order('added_at', { ascending: false });

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return [];

  // Look up platform users by email to get display info
  const emails = data.map((r: { email: string }) => r.email);
  const { data: users } = await admin
    .from('users')
    .select('email, full_name, avatar_url')
    .in('email', emails);

  const userMap = new Map(
    (users ?? []).map((u: { email: string; full_name: string | null; avatar_url: string | null }) => [
      u.email,
      { display_name: u.full_name, avatar_url: u.avatar_url },
    ])
  );

  return data.map((r: { email: string; added_at: string }) => ({
    email: r.email,
    added_at: r.added_at,
    user: userMap.get(r.email) ?? null,
  }));
}

export async function addStudentEmail(email: string): Promise<{ invited: boolean }> {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  const trimmed = email.trim().toLowerCase();

  // Basic email format validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    throw new Error('Invalid email address');
  }

  const { error } = await admin.from('facilitator_student_emails').insert({
    facilitator_id: session.authId,
    email: trimmed,
  });

  if (error) {
    if (error.code === '23505') throw new Error('This email is already in your access list');
    throw new Error(error.message);
  }

  revalidatePath('/facilitator/students');

  // Check if user exists on platform; if not, send invite email
  const { data: existingUser } = await admin
    .from('users')
    .select('id')
    .eq('email', trimmed)
    .maybeSingle();

  if (!existingUser) {
    // Get facilitator org name for the invite
    const { data: fp } = await admin
      .from('facilitator_profiles')
      .select('organisation_name')
      .eq('id', session.authId)
      .maybeSingle();

    const facilitatorName = fp?.organisation_name ?? 'A facilitator';

    try {
      await sendInviteEmail(trimmed, facilitatorName);
    } catch {
      // Invite email failure is non-fatal — student was still added
    }

    return { invited: true };
  }

  return { invited: false };
}

export async function removeStudentEmail(email: string): Promise<void> {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  const { error } = await admin
    .from('facilitator_student_emails')
    .delete()
    .eq('facilitator_id', session.authId)
    .eq('email', email.trim().toLowerCase());

  if (error) throw new Error(error.message);
  revalidatePath('/facilitator/students');
}

export interface BulkAddResult {
  added: number;
  skipped: number;
  invalid: number;
  invited: number;
}

export async function bulkAddStudentEmails(emails: string[]): Promise<BulkAddResult> {
  const session = await requireFacilitator();
  const admin = createAdminClient();

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Validate + deduplicate
  const seen = new Set<string>();
  const valid: string[] = [];
  let invalid = 0;

  for (const raw of emails) {
    const trimmed = raw.trim().toLowerCase();
    if (!trimmed) continue;
    if (!EMAIL_RE.test(trimmed)) { invalid++; continue; }
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    valid.push(trimmed);
  }

  if (valid.length === 0) return { added: 0, skipped: 0, invalid, invited: 0 };

  // Find which are already in the list
  const { data: existing } = await admin
    .from('facilitator_student_emails')
    .select('email')
    .eq('facilitator_id', session.authId)
    .in('email', valid);

  const existingSet = new Set((existing ?? []).map((r: { email: string }) => r.email));
  const newEmails = valid.filter((e) => !existingSet.has(e));
  const skipped = valid.length - newEmails.length;

  if (newEmails.length === 0) return { added: 0, skipped, invalid, invited: 0 };

  // Bulk insert
  const { error } = await admin
    .from('facilitator_student_emails')
    .insert(newEmails.map((email) => ({ facilitator_id: session.authId, email })));

  if (error) throw new Error(error.message);

  revalidatePath('/facilitator/students');

  // Send invites to non-platform emails
  const { data: platformUsers } = await admin
    .from('users')
    .select('email')
    .in('email', newEmails);

  const platformSet = new Set((platformUsers ?? []).map((u: { email: string }) => u.email));
  const toInvite = newEmails.filter((e) => !platformSet.has(e));

  let invited = 0;
  if (toInvite.length > 0) {
    const { data: fp } = await admin
      .from('facilitator_profiles')
      .select('organisation_name')
      .eq('id', session.authId)
      .maybeSingle();

    const facilitatorName = fp?.organisation_name ?? 'A facilitator';

    await Promise.allSettled(
      toInvite.map((email) => sendInviteEmail(email, facilitatorName))
    );
    invited = toInvite.length;
  }

  return { added: newEmails.length, skipped, invalid, invited };
}

export async function searchPlatformUsers(query: string): Promise<
  { id: string; email: string; full_name: string | null; avatar_url: string | null }[]
> {
  await requireFacilitator();
  const admin = createAdminClient();

  if (!query || query.trim().length < 2) return [];

  const q = query.trim();

  const { data, error } = await admin
    .from('users')
    .select('id, email, full_name, avatar_url')
    .or(`email.ilike.%${q}%,full_name.ilike.%${q}%`)
    .limit(8);

  if (error) throw new Error(error.message);
  return data ?? [];
}
