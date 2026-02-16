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
