'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FormField from '@/components/FormField';
import DateTimePicker from '@/components/DateTimePicker';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { getResource, updateResource, deleteResource } from '@/actions/resources';

const categoryOptions = [
  { value: 'govt_scheme', label: 'Govt Scheme / Grant' },
  { value: 'accelerator_incubator', label: 'Accelerator / Incubator' },
  { value: 'company_offer', label: 'Company Offer' },
  { value: 'tool', label: 'Tool' },
  { value: 'bank_offer', label: 'Bank Offer' },
  { value: 'scheme', label: 'Scheme' },
];

export default function EditResourcePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
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

  useEffect(() => {
    getResource(id).then((data) => {
      const meta = (data.metadata as Record<string, string>) || {};
      setForm({
        title: data.title,
        description: data.description ?? '',
        url: data.url ?? '',
        icon: data.icon ?? '',
        logo_url: data.logo_url ?? '',
        category: data.category,
        provider: data.provider ?? '',
        eligibility: data.eligibility ?? '',
        deadline: data.deadline ? data.deadline.slice(0, 16) : '',
        tags: (data.tags ?? []).join(', '),
        is_active: data.is_active,
        location: meta.location ?? '',
        recent_investments: meta.recent_investments ?? '',
        sectors: meta.sectors ?? '',
        avg_startup_age: meta.avg_startup_age ?? '',
        avg_num_founders: meta.avg_num_founders ?? '',
        avg_founder_age: meta.avg_founder_age ?? '',
        companies_invested: meta.companies_invested ?? '',
      });
      setLoading(false);
    });
  }, [id]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const metadata = form.category === 'scheme' || form.category === 'govt_scheme' || form.category === 'accelerator_incubator' ? {
        location: form.location || undefined,
        recent_investments: form.recent_investments || undefined,
        sectors: form.sectors || undefined,
        avg_startup_age: form.avg_startup_age || undefined,
        avg_num_founders: form.avg_num_founders || undefined,
        avg_founder_age: form.avg_founder_age || undefined,
        companies_invested: form.companies_invested || undefined,
      } : {};

      await updateResource(id, {
        ...form,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        metadata,
      });
      router.push('/dashboard/resources');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteResource(id);
      router.push('/dashboard/resources');
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="h-8 w-48 animate-pulse rounded bg-card-border" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-card-border" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Resource</h1>
          <p className="mt-1 text-muted">Update resource details</p>
        </div>
        <button
          onClick={() => setShowDelete(true)}
          className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-danger-hover"
        >
          Delete
        </button>
      </div>

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
            disabled={saving}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
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

      <DeleteConfirmModal
        open={showDelete}
        title={form.title}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        loading={deleting}
      />
    </div>
  );
}
