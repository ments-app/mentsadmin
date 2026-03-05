'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Globe, Lock } from 'lucide-react';
import FormField from '@/components/FormField';
import ImageUpload from '@/components/ImageUpload';
import DateTimePicker from '@/components/DateTimePicker';
import { createStartupEvent, getMyApprovedFacilitators } from '@/actions/startup-portal';
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

export default function StartupNewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [facilitators, setFacilitators] = useState<Facilitator[]>([]);
  const [loadingFacilitators, setLoadingFacilitators] = useState(false);
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
    setLoadingFacilitators(true);
    getMyApprovedFacilitators().then((data) => {
      setFacilitators(data);
      setLoadingFacilitators(false);
    });
  }, []);

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
    setLoading(true);
    try {
      await createStartupEvent(form);
      router.push('/startup/events');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">New Event</h1>
      <p className="mt-1 text-muted">Create an event for your startup</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-danger dark:bg-red-950">{error}</div>
        )}

        {/* Posting Visibility */}
        <div className="rounded-lg border border-card-border p-4 space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Where to Post</h2>
          <p className="text-sm text-muted">Choose who can see this event.</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => update('visibility', 'public')}
              className={`flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors ${
                form.visibility === 'public'
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
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
              className={`flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors ${
                form.visibility === 'facilitator_only'
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
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
            <div className="mt-1 space-y-2 border-t border-card-border pt-3">
              <div>
                <p className="text-sm font-medium text-foreground">Select Facilitators</p>
                <p className="text-xs text-muted mt-0.5">Leave all unchecked to share with all your approved facilitators.</p>
              </div>
              {loadingFacilitators ? (
                <p className="text-sm text-muted animate-pulse">Loading facilitators...</p>
              ) : facilitators.length === 0 ? (
                <p className="text-sm text-amber-600 dark:text-amber-400">No approved facilitators found.</p>
              ) : (
                <div className="space-y-1.5 rounded-lg border border-card-border bg-background p-3">
                  {facilitators.map((f) => (
                    <label key={f.id} className="flex items-center gap-3 cursor-pointer hover:bg-card-border/20 rounded px-1 py-1">
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

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Basic Info</h2>
          <FormField type="text" label="Title" name="title" value={form.title} onChange={(v) => update('title', v)} required placeholder="Event title" />
          <FormField type="textarea" label="Description" name="description" value={form.description} onChange={(v) => update('description', v)} placeholder="Describe the event..." rows={4} />

          <div className="grid grid-cols-2 gap-4">
            <FormField type="select" label="Category" name="category" value={form.category} onChange={(v) => update('category', v)} options={categoryOptions} required />
            <FormField type="select" label="Mode" name="event_type" value={form.event_type} onChange={(v) => update('event_type', v)} options={eventTypeOptions} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DateTimePicker label="Event Date" name="event_date" value={form.event_date} onChange={(v) => update('event_date', v)} />
            <LocationInput label="Location" name="location" value={form.location} onChange={(v) => update('location', v)} placeholder="e.g. Bengaluru, Delhi, Online…" />
          </div>

          <FormField type="text" label="Organizer Name" name="organizer_name" value={form.organizer_name} onChange={(v) => update('organizer_name', v)} placeholder="e.g. Your Startup Name" />
          <FormField type="url" label="Event Registration URL" name="event_url" value={form.event_url} onChange={(v) => update('event_url', v)} placeholder="https://..." />
          <ImageUpload label="Banner Image" name="banner_image_url" value={form.banner_image_url} onChange={(v) => update('banner_image_url', v)} />

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Tags</label>
            <div className="flex flex-wrap gap-2 rounded-lg border border-card-border bg-background p-2 min-h-[42px]">
              {form.tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)}><X size={10} /></button>
                </span>
              ))}
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag}
                placeholder="Add tag, press Enter"
                className="flex-1 min-w-[120px] bg-transparent text-sm outline-none text-foreground placeholder:text-muted" />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Settings</h2>
          <div className="flex flex-wrap gap-6">
            <FormField type="checkbox" label="Active (visible on hub)" name="is_active" checked={form.is_active} onChange={(v) => update('is_active', v)} />
            <FormField type="checkbox" label="Featured" name="is_featured" checked={form.is_featured} onChange={(v) => update('is_featured', v)} />
          </div>
        </section>

        <div className="flex gap-3 pt-4 border-t border-card-border">
          <button type="submit" disabled={loading} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Event'}
          </button>
          <button type="button" onClick={() => router.back()} className="rounded-lg border border-card-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card-border/30">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
