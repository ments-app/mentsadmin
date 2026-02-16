'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormField from '@/components/FormField';
import ImageUpload from '@/components/ImageUpload';
import DateTimePicker from '@/components/DateTimePicker';
import { createCompetition } from '@/actions/competitions';
import { supabase } from '@/lib/supabase';

export default function NewCompetitionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    deadline: '',
    is_external: false,
    external_url: '',
    has_leaderboard: false,
    prize_pool: '',
    banner_image_url: '',
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await createCompetition({ ...form, created_by: user.id });
      router.push('/dashboard/competitions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">New Competition</h1>
      <p className="mt-1 text-muted">Create a new hub competition</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-danger dark:bg-red-950">
            {error}
          </div>
        )}

        <FormField
          type="text"
          label="Title"
          name="title"
          value={form.title}
          onChange={(v) => update('title', v)}
          required
          placeholder="Competition title"
        />
        <FormField
          type="textarea"
          label="Description"
          name="description"
          value={form.description}
          onChange={(v) => update('description', v)}
          placeholder="Describe the competition..."
        />
        <DateTimePicker
          label="Deadline"
          name="deadline"
          value={form.deadline}
          onChange={(v) => update('deadline', v)}
        />
        <FormField
          type="text"
          label="Prize Pool"
          name="prize_pool"
          value={form.prize_pool}
          onChange={(v) => update('prize_pool', v)}
          placeholder="e.g. $1,000"
        />
        <ImageUpload
          label="Banner Image"
          name="banner_image_url"
          value={form.banner_image_url}
          onChange={(v) => update('banner_image_url', v)}
        />
        <FormField
          type="checkbox"
          label="External Competition"
          name="is_external"
          checked={form.is_external}
          onChange={(v) => update('is_external', v)}
        />
        {form.is_external && (
          <FormField
            type="url"
            label="External URL"
            name="external_url"
            value={form.external_url}
            onChange={(v) => update('external_url', v)}
            placeholder="https://..."
          />
        )}
        <FormField
          type="checkbox"
          label="Has Leaderboard"
          name="has_leaderboard"
          checked={form.has_leaderboard}
          onChange={(v) => update('has_leaderboard', v)}
        />

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Competition'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-card-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card-border/30"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
