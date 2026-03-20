'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireRole } from '@/lib/auth';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadBannerImage(formData: FormData): Promise<string> {
  const file = formData.get('file') as File | null;
  if (!file) throw new Error('No file provided');

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Allowed: JPEG, PNG, WebP, GIF');
  }

  if (file.size > MAX_SIZE) {
    throw new Error('File too large. Maximum size is 5MB');
  }

  const ext = file.name.split('.').pop() ?? 'png';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from('banners')
    .upload(filename, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('banners').getPublicUrl(filename);
  return data.publicUrl;
}

export async function uploadSlideImage(formData: FormData): Promise<string> {
  const file = formData.get('file') as File | null;
  if (!file) throw new Error('No file provided');

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Allowed: JPEG, PNG, WebP, GIF');
  }

  if (file.size > MAX_SIZE) {
    throw new Error('File too large. Maximum size is 5MB');
  }

  const ext = file.name.split('.').pop() ?? 'png';
  const filename = `slides/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from('banners')
    .upload(filename, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('banners').getPublicUrl(filename);
  return data.publicUrl;
}

// ─── Mailer Images ──────────────────────────────────────────────

export async function uploadMailerImage(formData: FormData): Promise<string> {
  await requireRole(['facilitator', 'startup']);

  const file = formData.get('file') as File | null;
  if (!file) throw new Error('No file provided');

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Allowed: JPEG, PNG, WebP, GIF');
  }

  if (file.size > MAX_SIZE) {
    throw new Error('File too large. Maximum size is 5MB');
  }

  const ext = file.name.split('.').pop() ?? 'png';
  const filename = `mailer/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from('banners')
    .upload(filename, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw new Error(error.message);

  const { data: urlData } = supabase.storage.from('banners').getPublicUrl(filename);
  return urlData.publicUrl;
}

export interface StorageImage {
  name: string;
  url: string;
  created_at: string;
}

export async function listMailerImages(): Promise<StorageImage[]> {
  await requireRole(['facilitator', 'startup']);
  const supabase = createAdminClient();

  const { data: files, error } = await supabase.storage
    .from('banners')
    .list('mailer', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

  if (error) throw new Error(error.message);
  if (!files || files.length === 0) return [];

  return files
    .filter((f) => f.name && !f.name.startsWith('.'))
    .map((f) => {
      const { data: urlData } = supabase.storage.from('banners').getPublicUrl(`mailer/${f.name}`);
      return {
        name: f.name,
        url: urlData.publicUrl,
        created_at: f.created_at ?? '',
      };
    });
}
