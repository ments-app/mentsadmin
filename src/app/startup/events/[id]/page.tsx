'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { X, Globe, Lock } from 'lucide-react';
import FormField from '@/components/FormField';
import ImageUpload from '@/components/ImageUpload';
import DateTimePicker from '@/components/DateTimePicker';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { getEvent, updateEvent } from '@/actions/events';
import { deleteStartupEvent, getMyApprovedFacilitators } from '@/actions/startup-portal';
import LocationInput from '@/components/LocationInput';

type Facilitator = { id: string; organisation_name: string | null; display_name: string; email: string };

const eventTypeOptions = [
  { value: 'online', label: 'Online' },
  { value: 'in-person', label: 'In-person' },
  { value: 'hybrid', label: 'Hybrid' },
];

const categoryOptions = [
  { value: 'event', label: 'Event' },
  { value: 'meetup', label: 'Meetup' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'conference', label: 'Conference' },
  { value: 'seminar', label: 'Seminar' },
];

export default function StartupEditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [error, setError] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [facilitators, setFacilitators] = useState<Facilitator[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    event_date: '',
    location: '',
    event_url: '',
    banner_image_url: '',
    event_type: 'online',
    is_active: true,
    tags: [] as string[],
    is_featured: false,
    organizer_name: '',
    category: 'event',
    visibility: 'public' as 'public' | 'facilitator_only',
    target_facilitator_ids: [] as string[],
  });

  useEffect(() => {
    Promise.all([
      getEvent(id),
      getMyApprovedFacilitators(),
    ]).then(([data, facs]) => {
      setFacilitators(facs);
      setForm({
        title: data.title,
        description: data.description ?? '',
        event_date: data.event_date ? data.event_date.slice(0, 16) : '',
        location: data.location ?? '',
        event_url: data.event_url ?? '',
        banner_image_url: data.banner_image_url ?? '',
        event_type: data.event_type,
        is_active: data.is_active,
        tags: data.tags ?? [],
        is_featured: data.is_featured ?? false,
        organizer_name: data.organizer_name ?? '',
        category: data.category ?? 'event',
        visibility: ((data as any).visibility ?? 'public') as 'public' | 'facilitator_only',
        target_facilitator_ids: (data as any).target_facilitator_ids ?? [],
      });
      setLoading(false);
    });
  }, [id]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
      if (tag && !form.tags.includes(tag)) update('tags', [...form.tags, tag]);
      setTagInput('');
    }
  }

  function removeTag(tag: string) { update('tags', form.tags.filter((t) => t !== tag)); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await updateEvent(id, form);
      router.push('/startup/events');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteStartupEvent(id);
      router.push('/startup/events');
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl animate-fade-in">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-card-border/50" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-card-border/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in mx-auto max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Edit Event</h1>
          <p className="mt-1 text-sm text-muted">Update event details</p>
        </div>
        <button onClick={() => setShowDelete(true)} className="btn-danger">
          Delete
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-danger dark:bg-red-950 dark:border-red-900">{error}</div>
        )}

        {/* Posting Visibility */}
        <div className="card-elevated rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Where to Post</h2>
          <p className="text-sm text-muted">Choose who can see this event.</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => update('visibility', 'public')}
              className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
                form.visibility === 'public'
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-card-border hover:border-primary/40 hover:bg-card-border/20'
              }`}
            >
              <Globe size={20} className={form.visibility === 'public' ? 'text-primary' : 'text-muted'} />
              <div>
                <p className="text-sm font-semibold text-foreground">Open Platform</p>
                <p className="text-xs text-muted mt-0.5">Visible to everyone on the platform</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => update('visibility', 'facilitator_only')}
              className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
                form.visibility === 'facilitator_only'
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-card-border hover:border-primary/40 hover:bg-card-border/20'
              }`}
            >
              <Lock size={20} className={form.visibility === 'facilitator_only' ? 'text-primary' : 'text-muted'} />
              <div>
                <p className="text-sm font-semibold text-foreground">My Facilitators Only</p>
                <p className="text-xs text-muted mt-0.5">Shared only with your approved facilitators</p>
              </div>
            </button>
          </div>

          {form.visibility === 'facilitator_only' && (
            <div className="mt-1 space-y-2 border-t border-card-border pt-4">
              <div>
                <p className="text-sm font-medium text-foreground">Select Facilitators</p>
                <p className="text-xs text-muted mt-0.5">Leave all unchecked to share with all your approved facilitators.</p>
              </div>
              {facilitators.length === 0 ? (
                <p className="text-sm text-amber-600 dark:text-amber-400">No approved facilitators found.</p>
              ) : (
                <div className="space-y-1.5 rounded-xl border border-card-border bg-background p-3">
                  {facilitators.map((f) => (
                    <label key={f.id} className="flex items-center gap-3 cursor-pointer hover:bg-card-border/20 rounded-lg px-2 py-1.5 transition-colors">
                      <input
                        type="checkbox"
                        checked={form.target_facilitator_ids.includes(f.id)}
                        onChange={(e) => {
                          update('target_facilitator_ids', e.target.checked
                            ? [...form.target_facilitator_ids, f.id]
                            : form.target_facilitator_ids.filter((fid) => fid !== f.id));
                        }}
                        className="h-4 w-4 rounded border-card-border accent-primary"
                      />
                      <div>
                        <span className="text-sm font-medium text-foreground">{f.organisation_name ?? f.display_name}</span>
                        <span className="ml-2 text-xs text-muted">{f.email}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Basic Info */}
        <div className="card-elevated rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Basic Info</h2>
          <FormField type="text" label="Title" name="title" value={form.title} onChange={(v) => update('title', v)} required placeholder="Event title" />
          <FormField type="textarea" label="Description" name="description" value={form.description} onChange={(v) => update('description', v)} placeholder="Describe the event..." rows={4} />

          <div className="grid grid-cols-2 gap-4">
            <FormField type="select" label="Category" name="category" value={form.category} onChange={(v) => update('category', v)} options={categoryOptions} required />
            <FormField type="select" label="Mode" name="event_type" value={form.event_type} onChange={(v) => update('event_type', v)} options={eventTypeOptions} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DateTimePicker label="Event Date" name="event_date" value={form.event_date} onChange={(v) => update('event_date', v)} />
            <LocationInput label="Location" name="location" value={form.location} onChange={(v) => update('location', v)} placeholder="e.g. Bengaluru, Delhi, Online..." />
          </div>

          <FormField type="text" label="Organizer Name" name="organizer_name" value={form.organizer_name} onChange={(v) => update('organizer_name', v)} placeholder="e.g. Your Startup Name" />
          <FormField type="url" label="Event Registration URL" name="event_url" value={form.event_url} onChange={(v) => update('event_url', v)} placeholder="https://..." />
          <ImageUpload label="Banner Image" name="banner_image_url" value={form.banner_image_url} onChange={(v) => update('banner_image_url', v)} />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Tags</label>
            <div className="flex flex-wrap gap-2 rounded-xl border border-card-border bg-background p-2.5 min-h-[42px]">
              {form.tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-primary/70 transition-colors"><X size={10} /></button>
                </span>
              ))}
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag}
                placeholder="Add tag, press Enter"
                className="flex-1 min-w-[120px] bg-transparent text-sm outline-none text-foreground placeholder:text-muted" />
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="card-elevated rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Settings</h2>
          <div className="flex flex-wrap gap-6">
            <FormField type="checkbox" label="Active (visible on hub)" name="is_active" checked={form.is_active} onChange={(v) => update('is_active', v)} />
            <FormField type="checkbox" label="Featured" name="is_featured" checked={form.is_featured} onChange={(v) => update('is_featured', v)} />
          </div>
        </div>

        <div className="flex gap-3 pt-2 border-t border-card-border">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>

      <DeleteConfirmModal open={showDelete} title={form.title} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} loading={deleting} />
    </div>
  );
}
