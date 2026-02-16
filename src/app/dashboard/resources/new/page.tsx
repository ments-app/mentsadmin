'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormField from '@/components/FormField';
import DateTimePicker from '@/components/DateTimePicker';
import { createResource } from '@/actions/resources';
import { supabase } from '@/lib/supabase';

const categoryOptions = [
  { value: 'govt_scheme', label: 'Govt Scheme / Grant' },
  { value: 'accelerator_incubator', label: 'Accelerator / Incubator' },
  { value: 'company_offer', label: 'Company Offer' },
  { value: 'tool', label: 'Tool' },
  { value: 'bank_offer', label: 'Bank Offer' },
];

export default function NewResourcePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    url: '',
    icon: '',
    category: 'tool',
    provider: '',
    eligibility: '',
    deadline: '',
    tags: '',
    is_active: true,
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

      await createResource({
        ...form,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        created_by: user.id,
      });
      router.push('/dashboard/resources');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">New Resource</h1>
      <p className="mt-1 text-muted">Add a new resource for users</p>

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
          placeholder="Resource title"
        />
        <FormField
          type="select"
          label="Category"
          name="category"
          value={form.category}
          onChange={(v) => update('category', v)}
          options={categoryOptions}
          required
        />
        <FormField
          type="textarea"
          label="Description"
          name="description"
          value={form.description}
          onChange={(v) => update('description', v)}
          placeholder="Describe the resource..."
        />
        <FormField
          type="url"
          label="URL"
          name="url"
          value={form.url}
          onChange={(v) => update('url', v)}
          placeholder="https://example.com"
        />
        <FormField
          type="text"
          label="Icon (emoji)"
          name="icon"
          value={form.icon}
          onChange={(v) => update('icon', v)}
          placeholder="e.g. 🏛️ or 🚀"
        />
        <FormField
          type="text"
          label="Provider"
          name="provider"
          value={form.provider}
          onChange={(v) => update('provider', v)}
          placeholder="e.g. Govt of India, Y Combinator, SBI"
        />
        <FormField
          type="textarea"
          label="Eligibility"
          name="eligibility"
          value={form.eligibility}
          onChange={(v) => update('eligibility', v)}
          placeholder="Who is eligible for this resource?"
        />
        <DateTimePicker
          label="Deadline"
          name="deadline"
          value={form.deadline}
          onChange={(v) => update('deadline', v)}
        />
        <FormField
          type="text"
          label="Tags (comma-separated)"
          name="tags"
          value={form.tags}
          onChange={(v) => update('tags', v)}
          placeholder="e.g. startup, funding, design"
        />
        <FormField
          type="checkbox"
          label="Active"
          name="is_active"
          checked={form.is_active}
          onChange={(v) => update('is_active', v)}
        />

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Resource'}
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
