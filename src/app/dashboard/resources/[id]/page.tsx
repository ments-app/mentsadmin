'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FormField from '@/components/FormField';
import DateTimePicker from '@/components/DateTimePicker';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import CategoryMetadataFields from '@/components/CategoryMetadataFields';
import AiAutoFillButton from '@/components/AiAutoFillButton';
import { getResource, updateResource, deleteResource } from '@/actions/resources';
import AiFieldButton from '@/components/AiFieldButton';

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
  });
  const [metadataFields, setMetadataFields] = useState<Record<string, string>>({});

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
      });
      // Populate all metadata fields from the stored object
      const metaRecord: Record<string, string> = {};
      for (const [k, v] of Object.entries(meta)) {
        if (v) metaRecord[k] = v;
      }
      setMetadataFields(metaRecord);
      setLoading(false);
    });
  }, [id]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateMetadata(key: string, value: string) {
    setMetadataFields((prev) => ({ ...prev, [key]: value }));
  }

  function handleCategoryChange(value: string) {
    update('category', value);
    setMetadataFields({});
  }

  function handleAutoFilled(data: Record<string, unknown>) {
    if (data.title && !form.title) update('title', data.title as string);
    if (data.description) update('description', data.description as string);
    if (data.category) handleCategoryChange(data.category as string);
    if (data.provider && !form.provider) update('provider', data.provider as string);
    if (data.eligibility) update('eligibility', data.eligibility as string);
    if (data.tags) update('tags', Array.isArray(data.tags) ? (data.tags as string[]).join(', ') : data.tags as string);
    if (data.metadata && typeof data.metadata === 'object') {
      const meta = data.metadata as Record<string, string>;
      setMetadataFields((prev) => ({ ...prev, ...meta }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Build metadata from metadataFields, stripping empty values
      const metadata: Record<string, string> = {};
      for (const [k, v] of Object.entries(metadataFields)) {
        if (v) metadata[k] = v;
      }

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
          onChange={handleCategoryChange}
          options={categoryOptions}
          required
        />
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Description</label>
            <AiFieldButton
              field="description"
              type="resource"
              context={{ title: form.title, category: form.category, provider: form.provider, url: form.url, tags: form.tags }}
              onGenerated={(text) => update('description', text)}
              disabled={!form.title}
            />
          </div>
          <FormField
            type="textarea"
            label=""
            name="description"
            value={form.description}
            onChange={(v) => update('description', v)}
            placeholder="Describe the resource..."
            rows={4}
          />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">URL</label>
            <AiAutoFillButton
              url={form.url}
              category={form.category}
              onAutoFilled={handleAutoFilled}
            />
          </div>
          <FormField
            type="url"
            label=""
            name="url"
            value={form.url}
            onChange={(v) => update('url', v)}
            placeholder="https://example.com"
          />
        </div>
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
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Eligibility</label>
            <AiFieldButton
              field="eligibility"
              type="resource"
              context={{ title: form.title, category: form.category, provider: form.provider, url: form.url, description: form.description, tags: form.tags }}
              onGenerated={(text) => update('eligibility', text)}
              disabled={!form.title}
            />
          </div>
          <FormField
            type="textarea"
            label=""
            name="eligibility"
            value={form.eligibility}
            onChange={(v) => update('eligibility', v)}
            placeholder="Who is eligible for this resource?"
            rows={4}
          />
        </div>
        <DateTimePicker
          label="Deadline"
          name="deadline"
          value={form.deadline}
          onChange={(v) => update('deadline', v)}
        />
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Tags (comma-separated)</label>
            <AiFieldButton
              field="tags"
              type="resource"
              context={{ title: form.title, category: form.category, provider: form.provider, description: form.description, eligibility: form.eligibility }}
              onGenerated={(text) => update('tags', text)}
              disabled={!form.title}
            />
          </div>
          <FormField
            type="text"
            label=""
            name="tags"
            value={form.tags}
            onChange={(v) => update('tags', v)}
            placeholder="e.g. startup, funding, design"
          />
        </div>

        {/* Category-specific metadata fields */}
        <CategoryMetadataFields
          category={form.category}
          values={metadataFields}
          onChange={updateMetadata}
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
