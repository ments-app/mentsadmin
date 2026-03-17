'use server';

import { createAdminClient, createAuthClient } from '@/lib/supabase-server';
import { requireStartup } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// ─── Get own startup summary (for dashboard header) ───────────

export async function getMyStartupSummary() {
  const session = await requireStartup();
  const admin = createAdminClient();

  const { data } = await admin
    .from('startup_profiles')
    .select('id, brand_name, logo_url, banner_url, stage, city, country, is_actively_raising, traction_metrics')
    .eq('owner_id', session.authId)
    .maybeSingle();

  return data ?? null;
}

// ─── Get full startup profile ─────────────────────────────────

export async function getMyFullStartupProfile() {
  const session = await requireStartup();
  const admin = createAdminClient();

  const { data } = await admin
    .from('startup_profiles')
    .select('*')
    .eq('owner_id', session.authId)
    .maybeSingle();

  if (!data) return null;

  const [founderRes, fundingRes, incubatorRes, awardRes, textSectionRes, linkRes, slideRes] = await Promise.all([
    admin.from('startup_founders').select('*').eq('startup_id', data.id).order('display_order', { ascending: true }),
    admin.from('startup_funding_rounds').select('*').eq('startup_id', data.id).order('round_date', { ascending: false }),
    admin.from('startup_incubators').select('*').eq('startup_id', data.id).order('year', { ascending: false }),
    admin.from('startup_awards').select('*').eq('startup_id', data.id).order('year', { ascending: false }),
    admin.from('startup_text_sections').select('*').eq('startup_id', data.id).order('display_order', { ascending: true }),
    admin.from('startup_links').select('*').eq('startup_id', data.id).order('display_order', { ascending: true }),
    admin.from('startup_slides').select('*').eq('startup_id', data.id).order('slide_number', { ascending: true }),
  ]);

  return {
    ...data,
    keywords: data.keywords || [],
    categories: data.categories || [],
    founders: founderRes.data || [],
    funding_rounds: fundingRes.data || [],
    incubators: incubatorRes.data || [],
    awards: awardRes.data || [],
    text_sections: textSectionRes.data || [],
    links: linkRes.data || [],
    slides: slideRes.data || [],
  };
}

// ─── Update startup profile sections ─────────────────────────

export async function updateMyStartupProfile(updates: Record<string, unknown>) {
  const session = await requireStartup();
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('startup_profiles')
    .select('id')
    .eq('owner_id', session.authId)
    .maybeSingle();

  if (!existing) throw new Error('No startup profile found');

  const { tagline: _tagline, ...safeUpdates } = updates as Record<string, unknown> & { tagline?: unknown };
  const payload = {
    ...safeUpdates,
    founded_date: safeUpdates.founded_date === '' ? null : safeUpdates.founded_date,
    updated_at: new Date().toISOString(),
  };

  const { error } = await admin
    .from('startup_profiles')
    .update(payload)
    .eq('id', existing.id);

  if (error) throw new Error(error.message);
  revalidatePath('/startup/profile');
  revalidatePath('/startup/dashboard');
}

// ─── Upsert founders ──────────────────────────────────────────

export async function updateMyFounders(
  founders: Array<{ name: string; role?: string; email?: string; ments_username?: string; display_order?: number }>
) {
  const session = await requireStartup();
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('startup_profiles')
    .select('id')
    .eq('owner_id', session.authId)
    .maybeSingle();

  if (!existing) throw new Error('No startup profile found');

  await admin.from('startup_founders').delete().eq('startup_id', existing.id);
  if (founders.length === 0) return;

  const { error } = await admin.from('startup_founders').insert(
    founders.map((f, i) => ({
      startup_id: existing.id,
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

// ─── Upsert funding rounds ────────────────────────────────────

export async function updateMyFundingRounds(
  rounds: Array<{ investor?: string; amount?: string; round_type?: string; round_date?: string; is_public?: boolean }>
) {
  const session = await requireStartup();
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('startup_profiles')
    .select('id')
    .eq('owner_id', session.authId)
    .maybeSingle();

  if (!existing) throw new Error('No startup profile found');

  await admin.from('startup_funding_rounds').delete().eq('startup_id', existing.id);
  if (rounds.length === 0) return;

  const { error } = await admin.from('startup_funding_rounds').insert(
    rounds.map((r) => ({
      startup_id: existing.id,
      investor: r.investor || null,
      amount: r.amount || null,
      round_type: r.round_type || null,
      round_date: r.round_date || null,
      is_public: r.is_public ?? true,
    }))
  );
  if (error) throw new Error(error.message);
}

// ─── Upsert incubators ────────────────────────────────────────

export async function updateMyIncubators(
  items: Array<{ program_name: string; year?: number | null }>
) {
  const session = await requireStartup();
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('startup_profiles')
    .select('id')
    .eq('owner_id', session.authId)
    .maybeSingle();

  if (!existing) throw new Error('No startup profile found');

  await admin.from('startup_incubators').delete().eq('startup_id', existing.id);
  if (items.length === 0) return;

  const { error } = await admin.from('startup_incubators').insert(
    items.map((i) => ({ startup_id: existing.id, program_name: i.program_name, year: i.year || null }))
  );
  if (error) throw new Error(error.message);
}

// ─── Upsert awards ────────────────────────────────────────────

export async function updateMyAwards(
  items: Array<{ award_name: string; year?: number | null }>
) {
  const session = await requireStartup();
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('startup_profiles')
    .select('id')
    .eq('owner_id', session.authId)
    .maybeSingle();

  if (!existing) throw new Error('No startup profile found');

  await admin.from('startup_awards').delete().eq('startup_id', existing.id);
  if (items.length === 0) return;

  const { error } = await admin.from('startup_awards').insert(
    items.map((a) => ({ startup_id: existing.id, award_name: a.award_name, year: a.year || null }))
  );
  if (error) throw new Error(error.message);
}

export async function upsertMyTextSections(
  sections: Array<{ heading: string; content: string; display_order?: number }>
) {
  const session = await requireStartup();
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('startup_profiles')
    .select('id')
    .eq('owner_id', session.authId)
    .maybeSingle();

  if (!existing) throw new Error('No startup profile found');

  await admin.from('startup_text_sections').delete().eq('startup_id', existing.id);
  if (sections.length === 0) return;

  const { error } = await admin.from('startup_text_sections').insert(
    sections.map((section, index) => ({
      startup_id: existing.id,
      heading: section.heading.trim(),
      content: section.content.trim(),
      display_order: section.display_order ?? index,
    }))
  );

  if (error) throw new Error(error.message);
}

export async function upsertMyStartupLinks(
  links: Array<{ title: string; url: string; display_order?: number }>
) {
  const session = await requireStartup();
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('startup_profiles')
    .select('id')
    .eq('owner_id', session.authId)
    .maybeSingle();

  if (!existing) throw new Error('No startup profile found');

  await admin.from('startup_links').delete().eq('startup_id', existing.id);
  if (links.length === 0) return;

  const { error } = await admin.from('startup_links').insert(
    links.map((link, index) => ({
      startup_id: existing.id,
      title: link.title.trim(),
      url: link.url.trim(),
      display_order: link.display_order ?? index,
    }))
  );

  if (error) throw new Error(error.message);
}

export async function upsertMyStartupSlides(
  slides: Array<{ slide_url: string; caption?: string; slide_number?: number }>
) {
  const session = await requireStartup();
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('startup_profiles')
    .select('id')
    .eq('owner_id', session.authId)
    .maybeSingle();

  if (!existing) throw new Error('No startup profile found');

  await admin.from('startup_slides').delete().eq('startup_id', existing.id);
  if (slides.length === 0) return;

  const { error } = await admin.from('startup_slides').insert(
    slides.map((slide, index) => ({
      startup_id: existing.id,
      slide_url: slide.slide_url.trim(),
      caption: slide.caption?.trim() || null,
      slide_number: slide.slide_number ?? index,
    }))
  );

  if (error) throw new Error(error.message);
}

// ─── Profile completeness ────────────────────────────────────

export async function getStartupProfileCompleteness(): Promise<{ percentage: number; filled: number; total: number }> {
  const session = await requireStartup();
  const admin = createAdminClient();

  const { data } = await admin
    .from('startup_profiles')
    .select('brand_name, stage, description, logo_url, banner_url, city, country, startup_email, startup_phone, website, categories, keywords, problem_statement, solution_statement, business_model, team_size, legal_status, founded_date, elevator_pitch, target_audience')
    .eq('owner_id', session.authId)
    .maybeSingle();

  if (!data) return { percentage: 0, filled: 0, total: 20 };

  const checks = [
    !!data.brand_name,
    !!data.stage,
    !!data.description,
    !!data.logo_url,
    !!data.banner_url,
    !!data.city,
    !!data.country,
    !!data.startup_email,
    !!data.startup_phone,
    !!data.website,
    Array.isArray(data.categories) && data.categories.length > 0,
    Array.isArray(data.keywords) && data.keywords.length > 0,
    !!data.problem_statement,
    !!data.solution_statement,
    !!data.business_model,
    !!data.team_size,
    !!data.legal_status && data.legal_status !== 'not_registered',
    !!data.founded_date,
    !!data.elevator_pitch,
    !!data.target_audience,
  ];

  const filled = checks.filter(Boolean).length;
  const total = checks.length;
  return { percentage: Math.round((filled / total) * 100), filled, total };
}

// ─── Browse facilitators (for startup portal) ─────────────────

export async function getApprovedFacilitators() {
  const session = await requireStartup();
  const admin = createAdminClient();

  // Get this startup's profile id
  const { data: sp } = await admin
    .from('startup_profiles')
    .select('id')
    .eq('owner_id', session.authId)
    .maybeSingle();

  // Get all approved facilitators (no embedded join — fetch separately to avoid PostgREST issues)
  const { data: facilitators, error } = await admin
    .from('admin_profiles')
    .select('*')
    .eq('role', 'facilitator')
    .eq('verification_status', 'approved')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  if (!facilitators || facilitators.length === 0) return [];

  // Fetch facilitator_profiles separately
  const facilitatorIds = facilitators.map((f: any) => f.id);
  const { data: fpData } = await admin
    .from('facilitator_profiles')
    .select('*')
    .in('id', facilitatorIds);
  const fpMap = new Map((fpData ?? []).map((fp: any) => [fp.id, fp]));

  // Get existing applications for this startup
  if (sp) {
    const { data: applications } = await admin
      .from('startup_facilitator_assignments')
      .select('facilitator_id, status')
      .eq('startup_id', sp.id);

    const appMap = new Map(applications?.map((a: { facilitator_id: string; status: string }) => [a.facilitator_id, a.status]) ?? []);

    return facilitators.map((f: any) => ({
      ...f,
      facilitator_profiles: fpMap.get(f.id) ?? null,
      applicationStatus: appMap.get(f.id) ?? null,
    }));
  }

  return facilitators.map((f: any) => ({
    ...f,
    facilitator_profiles: fpMap.get(f.id) ?? null,
    applicationStatus: null,
  }));
}

export async function applyToFacilitator(facilitatorId: string) {
  const session = await requireStartup();
  const admin = createAdminClient();

  const { data: sp } = await admin
    .from('startup_profiles')
    .select('id')
    .eq('owner_id', session.authId)
    .maybeSingle();

  if (!sp) throw new Error('No startup profile found. Please set up your profile first.');

  // Check if already applied
  const { data: existing } = await admin
    .from('startup_facilitator_assignments')
    .select('id, status')
    .eq('startup_id', sp.id)
    .eq('facilitator_id', facilitatorId)
    .maybeSingle();

  if (existing) throw new Error('You have already applied to this facilitator.');

  const { error } = await admin.from('startup_facilitator_assignments').insert({
    startup_id: sp.id,
    facilitator_id: facilitatorId,
    status: 'pending',
    assigned_by: session.authId,
  });

  if (error) throw new Error(error.message);
  revalidatePath('/startup/facilitators');
}

export async function getMyFacilitatorApplications() {
  const session = await requireStartup();
  const admin = createAdminClient();

  const { data: sp } = await admin
    .from('startup_profiles')
    .select('id')
    .eq('owner_id', session.authId)
    .maybeSingle();

  if (!sp) return [];

  const { data, error } = await admin
    .from('startup_facilitator_assignments')
    .select(`
      id, status, created_at, reviewed_at, notes,
      admin_profiles: facilitator_id (id, display_name, email, facilitator_profiles (*))
    `)
    .eq('startup_id', sp.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ─── Create startup profile (if doesn't exist yet) ───────────

export async function createMyStartupProfile(data: {
  brand_name: string;
  stage?: string;
  startup_email?: string;
  startup_phone?: string;
}) {
  const session = await requireStartup();
  const admin = createAdminClient();

  const { data: created, error } = await admin.from('startup_profiles').insert({
    owner_id: session.authId,
    brand_name: data.brand_name,
    legal_status: 'not_registered',
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
  }).select('id').single();

  if (error) throw new Error(error.message);
  revalidatePath('/startup/profile');
  revalidatePath('/startup/dashboard');
  return created;
}
