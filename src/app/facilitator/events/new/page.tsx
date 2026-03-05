'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, Globe, Users } from 'lucide-react';
import FormField from '@/components/FormField';
import ImageUpload from '@/components/ImageUpload';
import DateTimePicker from '@/components/DateTimePicker';
import { createFacilitatorEvent } from '@/actions/facilitators';
import LocationInput from '@/components/LocationInput';
import { cn } from '@/lib/cn';

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

export default function FacilitatorNewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tagInput, setTagInput] = useState('');
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
    visibility: 'public' as 'public' | 'email_restricted',
  });

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
      await createFacilitatorEvent(form);
      router.push('/facilitator/events');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">New Event</h1>
      <p className="mt-1 text-muted">Create an event for your hub</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-danger dark:bg-red-950">{error}</div>
        )}

        {/* Visibility */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Who can see this?</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => update('visibility', 'public')}
              className={cn(
                'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors',
                form.visibility === 'public'
                  ? 'border-primary bg-primary/5'
                  : 'border-card-border hover:border-primary/50'
              )}
            >
              <div className="flex items-center gap-2">
                <Globe size={15} className={form.visibility === 'public' ? 'text-primary' : 'text-muted'} />
                <span className="text-sm font-medium text-foreground">Public</span>
              </div>
              <p className="text-xs text-muted">Visible to everyone on the platform</p>
            </button>
            <button
              type="button"
              onClick={() => update('visibility', 'email_restricted')}
              className={cn(
                'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors',
                form.visibility === 'email_restricted'
                  ? 'border-primary bg-primary/5'
                  : 'border-card-border hover:border-primary/50'
              )}
            >
              <div className="flex items-center gap-2">
                <Users size={15} className={form.visibility === 'email_restricted' ? 'text-primary' : 'text-muted'} />
                <span className="text-sm font-medium text-foreground">Students Only</span>
              </div>
              <p className="text-xs text-muted">Only students in your Access List</p>
            </button>
          </div>
          {form.visibility === 'email_restricted' && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
              Only students in your Access List will see this.{' '}
              <Link href="/facilitator/students" className="font-medium underline">
                Manage Access List →
              </Link>
            </div>
          )}
        </section>

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

          <FormField type="text" label="Organizer Name" name="organizer_name" value={form.organizer_name} onChange={(v) => update('organizer_name', v)} placeholder="e.g. Your Hub Name" />
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
