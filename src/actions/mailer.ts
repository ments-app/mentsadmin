'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireRole } from '@/lib/auth';
import { sendBulkEmail } from '@/lib/email';
import type { MailBox, MailBoxEmail, MailCampaign } from '@/lib/types';

// ─── Mail Boxes ──────────────────────────────────────────────

export async function getMailBoxes(): Promise<(MailBox & { email_count: number })[]> {
  const session = await requireRole(['facilitator', 'startup']);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('mail_boxes')
    .select('*, email_count:mail_box_emails(count)')
    .eq('owner_id', session.authId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    ...row,
    email_count: (row.email_count as { count: number }[])[0]?.count ?? 0,
  })) as (MailBox & { email_count: number })[];
}

export async function getMailBox(id: string): Promise<{ box: MailBox; emails: MailBoxEmail[] }> {
  const session = await requireRole(['facilitator', 'startup']);
  const supabase = createAdminClient();

  const { data: box, error: boxErr } = await supabase
    .from('mail_boxes')
    .select('*')
    .eq('id', id)
    .eq('owner_id', session.authId)
    .single();

  if (boxErr || !box) throw new Error('Mail box not found');

  const { data: emails, error: emailErr } = await supabase
    .from('mail_box_emails')
    .select('*')
    .eq('box_id', id)
    .order('created_at', { ascending: true });

  if (emailErr) throw new Error(emailErr.message);

  return { box: box as MailBox, emails: (emails ?? []) as MailBoxEmail[] };
}

export async function createMailBox(data: { name: string; description?: string }): Promise<string> {
  const session = await requireRole(['facilitator', 'startup']);
  const supabase = createAdminClient();

  const { data: row, error } = await supabase
    .from('mail_boxes')
    .insert({
      owner_id: session.authId,
      owner_role: session.profile!.role,
      name: data.name,
      description: data.description || null,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return row.id as string;
}

export async function updateMailBox(id: string, data: { name: string; description?: string }) {
  const session = await requireRole(['facilitator', 'startup']);
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('mail_boxes')
    .update({
      name: data.name,
      description: data.description || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('owner_id', session.authId);

  if (error) throw new Error(error.message);
}

export async function deleteMailBox(id: string) {
  const session = await requireRole(['facilitator', 'startup']);
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('mail_boxes')
    .delete()
    .eq('id', id)
    .eq('owner_id', session.authId);

  if (error) throw new Error(error.message);
}

// ─── Mail Box Emails ─────────────────────────────────────────

export async function addEmailsToBox(boxId: string, emails: string[]): Promise<number> {
  const session = await requireRole(['facilitator', 'startup']);
  const supabase = createAdminClient();

  // Verify ownership
  const { data: box } = await supabase
    .from('mail_boxes')
    .select('id')
    .eq('id', boxId)
    .eq('owner_id', session.authId)
    .single();

  if (!box) throw new Error('Mail box not found');

  // Deduplicate and clean
  const unique = [...new Set(
    emails
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
  )];

  if (unique.length === 0) return 0;

  const { error } = await supabase
    .from('mail_box_emails')
    .upsert(
      unique.map((email) => ({ box_id: boxId, email })),
      { onConflict: 'box_id,email' }
    );

  if (error) throw new Error(error.message);
  return unique.length;
}

export async function removeEmailFromBox(boxId: string, emailId: string) {
  const session = await requireRole(['facilitator', 'startup']);
  const supabase = createAdminClient();

  // Verify ownership via join
  const { data: box } = await supabase
    .from('mail_boxes')
    .select('id')
    .eq('id', boxId)
    .eq('owner_id', session.authId)
    .single();

  if (!box) throw new Error('Mail box not found');

  const { error } = await supabase
    .from('mail_box_emails')
    .delete()
    .eq('id', emailId)
    .eq('box_id', boxId);

  if (error) throw new Error(error.message);
}

// ─── Campaigns ───────────────────────────────────────────────

export async function getMailCampaigns(): Promise<MailCampaign[]> {
  const session = await requireRole(['facilitator', 'startup']);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('mail_campaigns')
    .select('*')
    .eq('sender_id', session.authId)
    .order('sent_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as MailCampaign[];
}

// ─── Helper: inject Google Fonts into HTML ──────────────────

function injectGoogleFonts(html: string): string {
  const googleFontNames = [
    'Roboto','Open Sans','Lato','Montserrat','Poppins','Inter','Nunito','Nunito Sans',
    'Raleway','Ubuntu','Rubik','Work Sans','Quicksand','Josefin Sans','DM Sans',
    'Source Sans 3','Outfit','Manrope','Space Grotesk','Plus Jakarta Sans',
    'Playfair Display','Merriweather','Lora','PT Serif','Libre Baskerville',
    'Crimson Text','Fira Code','JetBrains Mono','Source Code Pro',
    'Pacifico','Dancing Script','Caveat','Satisfy','Permanent Marker',
    'Abril Fatface','Bebas Neue','Righteous','Comfortaa','Lexend',
  ];
  const usedGFonts = googleFontNames.filter((name) => html.includes(name));
  if (usedGFonts.length === 0) return html;
  const families = usedGFonts.map((f) => `family=${f.replace(/\s+/g, '+')}:wght@400;600;700`).join('&');
  const fontLink = `<link href="https://fonts.googleapis.com/css2?${families}&display=swap" rel="stylesheet" />`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8" />${fontLink}</head><body style="margin:0;padding:0;">${html}</body></html>`;
}

// ─── Submit campaign (saves as pending for non-superadmin) ───

export async function sendCampaign(data: {
  subject: string;
  htmlBody: string;
  boxIds: string[];
  ccEmails?: string[];
}): Promise<{ sent: number; failed: number; campaignId: string; pendingApproval: boolean }> {
  const session = await requireRole(['facilitator', 'startup', 'superadmin']);
  const supabase = createAdminClient();
  const isSuperAdmin = session.profile?.role === 'superadmin';

  if (!data.subject.trim()) throw new Error('Subject is required');
  if (!data.htmlBody.trim()) throw new Error('Email body is required');
  if (data.boxIds.length === 0) throw new Error('Select at least one mail box');

  // Verify all boxes belong to user
  const { data: boxes, error: boxErr } = await supabase
    .from('mail_boxes')
    .select('id')
    .in('id', data.boxIds)
    .eq('owner_id', session.authId);

  if (boxErr) throw new Error(boxErr.message);
  if (!boxes || boxes.length !== data.boxIds.length) {
    throw new Error('One or more mail boxes not found');
  }

  // Fetch all unique emails from selected boxes
  const { data: emailRows, error: emailErr } = await supabase
    .from('mail_box_emails')
    .select('email')
    .in('box_id', data.boxIds);

  if (emailErr) throw new Error(emailErr.message);

  const recipients = [...new Set((emailRows ?? []).map((r) => r.email))];

  if (recipients.length === 0) {
    throw new Error('No email addresses found in the selected boxes');
  }

  // Validate CC emails
  const ccList = (data.ccEmails ?? [])
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

  // ── Superadmin: send immediately ──
  if (isSuperAdmin) {
    const finalHtml = injectGoogleFonts(data.htmlBody);
    const result = await sendBulkEmail(recipients, data.subject, finalHtml, ccList.length > 0 ? ccList : undefined);
    const status = result.failed === 0 ? 'sent' : result.sent === 0 ? 'failed' : 'partial';

    const { data: campaign, error: campErr } = await supabase
      .from('mail_campaigns')
      .insert({
        sender_id: session.authId,
        sender_role: session.profile!.role,
        subject: data.subject,
        html_body: data.htmlBody,
        box_ids: data.boxIds,
        recipient_count: result.sent,
        status,
        approval_status: 'approved',
        cc_emails: ccList.length > 0 ? ccList : null,
      })
      .select('id')
      .single();

    if (campErr) throw new Error(campErr.message);
    return { ...result, campaignId: campaign.id, pendingApproval: false };
  }

  // ── Non-superadmin: save as pending approval ──
  const { data: campaign, error: campErr } = await supabase
    .from('mail_campaigns')
    .insert({
      sender_id: session.authId,
      sender_role: session.profile!.role,
      subject: data.subject,
      html_body: data.htmlBody,
      box_ids: data.boxIds,
      recipient_count: recipients.length,
      status: 'pending_approval',
      approval_status: 'pending',
      cc_emails: ccList.length > 0 ? ccList : null,
    })
    .select('id')
    .single();

  if (campErr) throw new Error(campErr.message);
  return { sent: 0, failed: 0, campaignId: campaign.id, pendingApproval: true };
}

// ─── Superadmin: get all pending campaigns ──────────────────

export async function getPendingCampaigns(): Promise<(MailCampaign & { sender_email?: string; sender_name?: string })[]> {
  const { requireSuperAdmin } = await import('@/lib/auth');
  await requireSuperAdmin();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('mail_campaigns')
    .select('*')
    .eq('approval_status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return [];

  // Get sender info
  const senderIds = [...new Set(data.map((c: { sender_id: string }) => c.sender_id))];
  const { data: users } = await supabase
    .from('admin_profiles')
    .select('id, display_name, email')
    .in('id', senderIds);

  const userMap = new Map((users ?? []).map((u: { id: string; display_name: string | null; email: string }) => [u.id, u]));

  return data.map((c: any) => {
    const sender = userMap.get(c.sender_id);
    return { ...c, sender_email: sender?.email ?? '', sender_name: sender?.display_name ?? '' };
  });
}

// ─── Superadmin: approve a campaign (sends the emails) ──────

export async function approveCampaign(campaignId: string): Promise<{ sent: number; failed: number }> {
  const { requireSuperAdmin } = await import('@/lib/auth');
  await requireSuperAdmin();
  const supabase = createAdminClient();

  const { data: campaign, error: campErr } = await supabase
    .from('mail_campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('approval_status', 'pending')
    .single();

  if (campErr || !campaign) throw new Error('Campaign not found or already processed');

  // Fetch recipients from boxes
  const { data: emailRows, error: emailErr } = await supabase
    .from('mail_box_emails')
    .select('email')
    .in('box_id', campaign.box_ids);

  if (emailErr) throw new Error(emailErr.message);

  const recipients = [...new Set((emailRows ?? []).map((r: { email: string }) => r.email))];
  if (recipients.length === 0) throw new Error('No recipients found');

  const ccList: string[] = campaign.cc_emails ?? [];
  const finalHtml = injectGoogleFonts(campaign.html_body);

  const result = await sendBulkEmail(recipients, campaign.subject, finalHtml, ccList.length > 0 ? ccList : undefined);
  const status = result.failed === 0 ? 'sent' : result.sent === 0 ? 'failed' : 'partial';

  await supabase
    .from('mail_campaigns')
    .update({
      status,
      approval_status: 'approved',
      recipient_count: result.sent,
      sent_at: new Date().toISOString(),
    })
    .eq('id', campaignId);

  return result;
}

// ─── Superadmin: reject a campaign ──────────────────────────

export async function rejectCampaign(campaignId: string, reason?: string): Promise<void> {
  const { requireSuperAdmin } = await import('@/lib/auth');
  await requireSuperAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('mail_campaigns')
    .update({
      status: 'rejected',
      approval_status: 'rejected',
      rejection_reason: reason?.trim() || null,
    })
    .eq('id', campaignId)
    .eq('approval_status', 'pending');

  if (error) throw new Error(error.message);
}
