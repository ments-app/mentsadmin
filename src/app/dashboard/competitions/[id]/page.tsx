'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FormField from '@/components/FormField';
import ImageUpload from '@/components/ImageUpload';
import DateTimePicker from '@/components/DateTimePicker';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { getCompetition, updateCompetition, deleteCompetition } from '@/actions/competitions';

export default function EditCompetitionPage() {
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
    deadline: '',
    is_external: false,
    external_url: '',
    has_leaderboard: false,
    prize_pool: '',
    banner_image_url: '',
  });

  useEffect(() => {
    getCompetition(id).then((data) => {
      setForm({
        title: data.title,
        description: data.description ?? '',
        deadline: data.deadline ? data.deadline.slice(0, 16) : '',
        is_external: data.is_external,
        external_url: data.external_url ?? '',
        has_leaderboard: data.has_leaderboard,
        prize_pool: data.prize_pool ?? '',
        banner_image_url: data.banner_image_url ?? '',
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
      await updateCompetition(id, form);
      router.push('/dashboard/competitions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteCompetition(id);
      router.push('/dashboard/competitions');
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
          <h1 className="text-2xl font-bold text-foreground">Edit Competition</h1>
          <p className="mt-1 text-muted">Update competition details</p>
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
