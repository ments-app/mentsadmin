'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import type { Resource, ResourceMetadata } from '@/lib/types';

export async function getResources() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Resource[];
}

export async function getResource(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data as Resource;
}

export async function createResource(formData: {
  title: string;
  description: string;
  url: string;
  icon: string;
  logo_url: string;
  category: string;
  provider: string;
  eligibility: string;
  deadline: string;
  tags: string[];
  metadata: ResourceMetadata;
  is_active: boolean;
  created_by: string;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('resources').insert({
    title: formData.title,
    description: formData.description || null,
    url: formData.url || null,
    icon: formData.icon || null,
    logo_url: formData.logo_url || null,
    category: formData.category,
    provider: formData.provider || null,
    eligibility: formData.eligibility || null,
    deadline: formData.deadline || null,
    tags: formData.tags,
    metadata: formData.metadata || {},
    is_active: formData.is_active,
    created_by: formData.created_by,
  });

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/resources');
  revalidatePath('/dashboard');
}

export async function updateResource(
  id: string,
  formData: {
    title: string;
    description: string;
    url: string;
    icon: string;
    logo_url: string;
    category: string;
    provider: string;
    eligibility: string;
    deadline: string;
    tags: string[];
    metadata: ResourceMetadata;
    is_active: boolean;
  }
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('resources')
    .update({
      title: formData.title,
      description: formData.description || null,
      url: formData.url || null,
      icon: formData.icon || null,
      logo_url: formData.logo_url || null,
      category: formData.category,
      provider: formData.provider || null,
      eligibility: formData.eligibility || null,
      deadline: formData.deadline || null,
      tags: formData.tags,
      metadata: formData.metadata || {},
      is_active: formData.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/resources');
  revalidatePath('/dashboard');
}

export async function deleteResource(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('resources').delete().eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/resources');
  revalidatePath('/dashboard');
}

export async function bulkCreateResources(
  rows: {
    title: string;
    description?: string;
    url?: string;
    logo_url?: string;
    category: string;
    provider?: string;
    eligibility?: string;
    deadline?: string;
    tags?: string[];
    metadata?: ResourceMetadata;
  }[],
  created_by: string
) {
  const supabase = createAdminClient();

  const records = rows.map((row) => ({
    title: row.title,
    description: row.description || null,
    url: row.url || null,
    logo_url: row.logo_url || null,
    category: row.category || 'scheme',
    provider: row.provider || null,
    eligibility: row.eligibility || null,
    deadline: row.deadline || null,
    tags: row.tags || [],
    metadata: row.metadata || {},
    is_active: true,
    created_by,
  }));

  const { error } = await supabase.from('resources').insert(records);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/resources');
  revalidatePath('/dashboard');
}
