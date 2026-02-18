'use server';

import { createAdminClient } from '@/lib/supabase-server';
import type { Application } from '@/lib/types';

export async function getJobApplications(jobId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('job_id', jobId)
    .order('overall_score', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Application[];
}

export async function getGigApplications(gigId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('gig_id', gigId)
    .order('overall_score', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Application[];
}

export async function getApplication(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data as Application;
}

export async function updateApplicationStatus(
  id: string,
  status: string,
  admin_notes?: string
) {
  const supabase = createAdminClient();
  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === 'reviewed' || status === 'shortlisted' || status === 'rejected') {
    updates.reviewed_at = new Date().toISOString();
  }
  if (admin_notes !== undefined) {
    updates.admin_notes = admin_notes;
  }

  const { error } = await supabase
    .from('applications')
    .update(updates)
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function getApplicationStats(jobId?: string, gigId?: string) {
  const supabase = createAdminClient();
  let query = supabase.from('applications').select('*');

  if (jobId) query = query.eq('job_id', jobId);
  if (gigId) query = query.eq('gig_id', gigId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const apps = (data || []) as Application[];
  const submitted = apps.filter((a) => a.status !== 'in_progress');
  const total = submitted.length;

  const avgScore = total > 0
    ? Math.round(submitted.reduce((s, a) => s + a.overall_score, 0) / total)
    : 0;

  const scoreDistribution = {
    '0-25': submitted.filter((a) => a.overall_score <= 25).length,
    '26-50': submitted.filter((a) => a.overall_score > 25 && a.overall_score <= 50).length,
    '51-75': submitted.filter((a) => a.overall_score > 50 && a.overall_score <= 75).length,
    '76-100': submitted.filter((a) => a.overall_score > 75).length,
  };

  const recommendations = {
    strongly_recommend: submitted.filter((a) => a.ai_recommendation === 'strongly_recommend').length,
    recommend: submitted.filter((a) => a.ai_recommendation === 'recommend').length,
    maybe: submitted.filter((a) => a.ai_recommendation === 'maybe').length,
    not_recommend: submitted.filter((a) => a.ai_recommendation === 'not_recommend').length,
  };

  const statusCounts = {
    submitted: submitted.filter((a) => a.status === 'submitted').length,
    reviewed: submitted.filter((a) => a.status === 'reviewed').length,
    shortlisted: submitted.filter((a) => a.status === 'shortlisted').length,
    rejected: submitted.filter((a) => a.status === 'rejected').length,
  };

  return { total, avgScore, scoreDistribution, recommendations, statusCounts };
}

export async function getApplicationCount(jobId?: string, gigId?: string) {
  const supabase = createAdminClient();
  let query = supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'in_progress');

  if (jobId) query = query.eq('job_id', jobId);
  if (gigId) query = query.eq('gig_id', gigId);

  const { count, error } = await query;
  if (error) return 0;
  return count || 0;
}

export async function getAllApplications() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .neq('status', 'in_progress')
    .order('submitted_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Application[];
}

export async function getRecentApplications(limit = 5) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .neq('status', 'in_progress')
    .order('submitted_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data as Application[];
}

export async function getPositionTitles(jobIds: string[], gigIds: string[]) {
  const supabase = createAdminClient();

  const [jobsRes, gigsRes] = await Promise.all([
    jobIds.length > 0
      ? supabase.from('jobs').select('id, title').in('id', jobIds)
      : { data: [] },
    gigIds.length > 0
      ? supabase.from('gigs').select('id, title').in('id', gigIds)
      : { data: [] },
  ]);

  const jobs: Record<string, string> = {};
  (jobsRes.data || []).forEach((j: { id: string; title: string }) => { jobs[j.id] = j.title; });

  const gigs: Record<string, string> = {};
  (gigsRes.data || []).forEach((g: { id: string; title: string }) => { gigs[g.id] = g.title; });

  return { jobs, gigs };
}

export async function getTotalApplicationCount() {
  const supabase = createAdminClient();

  const { count, error } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'in_progress');

  if (error) return 0;
  return count || 0;
}
