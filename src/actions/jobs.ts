'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import type { Job } from '@/lib/types';

export async function getJobs() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Job[];
}

export async function getJob(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data as Job;
}

export async function createJob(formData: {
  title: string;
  company: string;
  description: string;
  location: string;
  salary_range: string;
  job_type: string;
  requirements: string;
  deadline: string;
  is_active: boolean;
  created_by: string;
  // New fields
  company_logo_url: string;
  company_website: string;
  experience_level: string;
  skills_required: string[];
  benefits: string;
  responsibilities: string;
  category: string;
  work_mode: string;

  contact_email: string;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('jobs').insert({
    title: formData.title,
    company: formData.company,
    description: formData.description || null,
    location: formData.location || null,
    salary_range: formData.salary_range || null,
    job_type: formData.job_type,
    requirements: formData.requirements || null,
    deadline: formData.deadline || null,
    is_active: formData.is_active,
    created_by: formData.created_by,
    // New fields
    company_logo_url: formData.company_logo_url || null,
    company_website: formData.company_website || null,
    experience_level: formData.experience_level || 'any',
    skills_required: formData.skills_required,
    benefits: formData.benefits || null,
    responsibilities: formData.responsibilities || null,
    category: formData.category || 'other',
    work_mode: formData.work_mode || 'onsite',

    contact_email: formData.contact_email || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/jobs');
  revalidatePath('/dashboard');
}

export async function updateJob(
  id: string,
  formData: {
    title: string;
    company: string;
    description: string;
    location: string;
    salary_range: string;
    job_type: string;
    requirements: string;
    deadline: string;
    is_active: boolean;
    // New fields
    company_logo_url: string;
    company_website: string;
    experience_level: string;
    skills_required: string[];
    benefits: string;
    responsibilities: string;
    category: string;
    work_mode: string;
    apply_url: string;
    apply_email: string;
    contact_email: string;
  }
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('jobs')
    .update({
      title: formData.title,
      company: formData.company,
      description: formData.description || null,
      location: formData.location || null,
      salary_range: formData.salary_range || null,
      job_type: formData.job_type,
      requirements: formData.requirements || null,
      deadline: formData.deadline || null,
      is_active: formData.is_active,
      updated_at: new Date().toISOString(),
      // New fields
      company_logo_url: formData.company_logo_url || null,
      company_website: formData.company_website || null,
      experience_level: formData.experience_level || 'any',
      skills_required: formData.skills_required,
      benefits: formData.benefits || null,
      responsibilities: formData.responsibilities || null,
      category: formData.category || 'other',
      work_mode: formData.work_mode || 'onsite',
      apply_url: formData.apply_url || null,
      apply_email: formData.apply_email || null,
      contact_email: formData.contact_email || null,
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/jobs');
  revalidatePath('/dashboard');
}

export async function deleteJob(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('jobs').delete().eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/jobs');
  revalidatePath('/dashboard');
}
