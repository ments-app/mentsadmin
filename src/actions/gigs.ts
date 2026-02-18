'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import type { Gig } from '@/lib/types';

export async function getGigs() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('gigs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Gig[];
}

export async function getGig(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('gigs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data as Gig;
}

export async function createGig(formData: {
  title: string;
  description: string;
  budget: string;
  duration: string;
  skills_required: string[];
  deadline: string;
  is_active: boolean;
  created_by: string;
  // New fields
  company: string;
  company_logo_url: string;
  company_website: string;
  category: string;
  experience_level: string;
  payment_type: string;
  deliverables: string;
  responsibilities: string;

  contact_email: string;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('gigs').insert({
    title: formData.title,
    description: formData.description || null,
    budget: formData.budget || null,
    duration: formData.duration || null,
    skills_required: formData.skills_required,
    deadline: formData.deadline || null,
    is_active: formData.is_active,
    created_by: formData.created_by,
    // New fields
    company: formData.company || null,
    company_logo_url: formData.company_logo_url || null,
    company_website: formData.company_website || null,
    category: formData.category || 'other',
    experience_level: formData.experience_level || 'any',
    payment_type: formData.payment_type || 'fixed',
    deliverables: formData.deliverables || null,
    responsibilities: formData.responsibilities || null,

    contact_email: formData.contact_email || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/gigs');
  revalidatePath('/dashboard');
}

export async function updateGig(
  id: string,
  formData: {
    title: string;
    description: string;
    budget: string;
    duration: string;
    skills_required: string[];
    deadline: string;
    is_active: boolean;
    // New fields
    company: string;
    company_logo_url: string;
    company_website: string;
    category: string;
    experience_level: string;
    payment_type: string;
    deliverables: string;
    responsibilities: string;
    contact_email: string;
  }
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('gigs')
    .update({
      title: formData.title,
      description: formData.description || null,
      budget: formData.budget || null,
      duration: formData.duration || null,
      skills_required: formData.skills_required,
      deadline: formData.deadline || null,
      is_active: formData.is_active,
      updated_at: new Date().toISOString(),
      // New fields
      company: formData.company || null,
      company_logo_url: formData.company_logo_url || null,
      company_website: formData.company_website || null,
      category: formData.category || 'other',
      experience_level: formData.experience_level || 'any',
      payment_type: formData.payment_type || 'fixed',
      deliverables: formData.deliverables || null,
      responsibilities: formData.responsibilities || null,
      contact_email: formData.contact_email || null,
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/gigs');
  revalidatePath('/dashboard');
}

export async function deleteGig(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('gigs').delete().eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/gigs');
  revalidatePath('/dashboard');
}
