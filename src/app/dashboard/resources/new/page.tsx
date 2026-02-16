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
  { value: 'scheme', label: 'Scheme' },
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
    logo_url: '',
    category: 'tool',
    provider: '',
    eligibility: '',
    deadline: '',
    tags: '',
    is_active: true,
    // Scheme-specific fields
    location: '',
    recent_investments: '',
    sectors: '',
    avg_startup_age: '',
    avg_num_founders: '',
    avg_founder_age: '',
    companies_invested: '',
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

      const metadata = form.category === 'scheme' || form.category === 'govt_scheme' || form.category === 'accelerator_incubator' ? {
        location: form.location || undefined,
        recent_investments: form.recent_investments || undefined,
        sectors: form.sectors || undefined,
        avg_startup_age: form.avg_startup_age || undefined,
        avg_num_founders: form.avg_num_founders || undefined,
        avg_founder_age: form.avg_founder_age || undefined,
        companies_invested: form.companies_invested || undefined,
      } : {};

      await createResource({
        ...form,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        metadata,
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
          type="url"
          label="Logo URL"
          name="logo_url"
          value={form.logo_url}
          onChange={(v) => update('logo_url', v)}
          placeholder="https://example.com/logo.png"
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

        {/* Scheme-specific fields */}
        {form.category === 'scheme' || form.category === 'govt_scheme' || form.category === 'accelerator_incubator' && (
          <div className="space-y-4 rounded-lg border border-card-border p-4">
            <h3 className="text-sm font-semibold text-foreground">Scheme Details</h3>
            <FormField
              type="text"
              label="Location"
              name="location"
              value={form.location}
              onChange={(v) => update('location', v)}
              placeholder="e.g. India, USA, Global"
            />
            <FormField
              type="textarea"
              label="Recent Investments"
              name="recent_investments"
              value={form.recent_investments}
              onChange={(v) => update('recent_investments', v)}
              placeholder="List of recent investments..."
            />
            <FormField
              type="text"
              label="Sectors"
              name="sectors"
              value={form.sectors}
              onChange={(v) => update('sectors', v)}
              placeholder="e.g. Fintech, SaaS, Healthcare"
            />
            <FormField
              type="text"
              label="Avg Startup Age at Investment"
              name="avg_startup_age"
              value={form.avg_startup_age}
              onChange={(v) => update('avg_startup_age', v)}
              placeholder="e.g. 2 years"
            />
            <FormField
              type="text"
              label="Avg No. of Founders"
              name="avg_num_founders"
              value={form.avg_num_founders}
              onChange={(v) => update('avg_num_founders', v)}
              placeholder="e.g. 2"
            />
            <FormField
              type="text"
              label="Avg Founder Age"
              name="avg_founder_age"
              value={form.avg_founder_age}
              onChange={(v) => update('avg_founder_age', v)}
              placeholder="e.g. 28"
            />
            <FormField
              type="textarea"
              label="Companies Invested"
              name="companies_invested"
              value={form.companies_invested}
              onChange={(v) => update('companies_invested', v)}
              placeholder="List of companies invested in..."
            />
          </div>
        )}

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
