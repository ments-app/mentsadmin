'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import type { Event } from '@/lib/types';

export async function getEvents() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({ ...row, tags: row.tags ?? [] })) as Event[];
}

export async function getEvent(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return { ...data, tags: data.tags ?? [] } as Event;
}

export async function createEvent(formData: {
  title: string;
  description: string;
  event_date: string;
  location: string;
  event_url: string;
  banner_image_url: string;
  event_type: string;
  is_active: boolean;
  created_by: string;
  // Extended fields
  tags: string[];
  is_featured: boolean;
  organizer_name: string;
  category: string;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('events').insert({
    title: formData.title,
    description: formData.description || null,
    event_date: formData.event_date || null,
    location: formData.location || null,
    event_url: formData.event_url || null,
    banner_image_url: formData.banner_image_url || null,
    event_type: formData.event_type,
    is_active: formData.is_active,
    created_by: formData.created_by,
    tags: formData.tags,
    is_featured: formData.is_featured,
    organizer_name: formData.organizer_name || null,
    category: formData.category || 'event',
  });

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/events');
  revalidatePath('/dashboard');
}

export async function updateEvent(
  id: string,
  formData: {
    title: string;
    description: string;
    event_date: string;
    location: string;
    event_url: string;
    banner_image_url: string;
    event_type: string;
    is_active: boolean;
    // Extended fields
    tags: string[];
    is_featured: boolean;
    organizer_name: string;
    category: string;
    visibility?: string;
    target_facilitator_ids?: string[] | null;
  }
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('events')
    .update({
      title: formData.title,
      description: formData.description || null,
      event_date: formData.event_date || null,
      location: formData.location || null,
      event_url: formData.event_url || null,
      banner_image_url: formData.banner_image_url || null,
      event_type: formData.event_type,
      is_active: formData.is_active,
      tags: formData.tags,
      is_featured: formData.is_featured,
      organizer_name: formData.organizer_name || null,
      category: formData.category || 'event',
      ...(formData.visibility !== undefined ? { visibility: formData.visibility } : {}),
      target_facilitator_ids: formData.target_facilitator_ids ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/events');
  revalidatePath('/dashboard');
}

export async function deleteEvent(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('events').delete().eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/events');
  revalidatePath('/dashboard');
}
