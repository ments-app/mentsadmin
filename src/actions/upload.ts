'use server';

import { createAdminClient } from '@/lib/supabase-server';

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
