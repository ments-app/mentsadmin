'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, Globe, Users } from 'lucide-react';
import FormField from '@/components/FormField';
import ImageUpload from '@/components/ImageUpload';
import DateTimePicker from '@/components/DateTimePicker';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { getEvent, updateEvent, deleteEvent } from '@/actions/events';
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

export default function FacilitatorEditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [error, setError] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', event_date: '', location: '',
    event_url: '', banner_image_url: '', event_type: 'online',
    is_active: true, tags: [] as string[], is_featured: false,
    organizer_name: '', category: 'event',
    visibility: 'public' as 'public' | 'email_restricted',
  });

  useEffect(() => {
    getEvent(id).then((data) => {
      setForm({
        title: data.title, description: data.description ?? '',
        event_date: data.event_date ? data.event_date.slice(0, 16) : '',
        location: data.location ?? '', event_url: data.event_url ?? '',
        banner_image_url: data.banner_image_url ?? '', event_type: data.event_type,
        is_active: data.is_active, tags: data.tags ?? [],
        is_featured: data.is_featured ?? false, organizer_name: data.organizer_name ?? '',
        category: data.category ?? 'event',
        visibility: ((data as any).visibility ?? 'public') as 'public' | 'email_restricted',
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
    e.preventDefault(); setError(''); setSaving(true);
    try { await updateEvent(id, form); router.push('/facilitator/events'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong'); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    setDeleting(true);
    try { await deleteEvent(id); router.push('/facilitator/events'); }
    catch (err) { console.error(err); }
    finally { setDeleting(false); }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl animate-fade-in">
        <div className="h-8 w-48 skeleton-shimmer rounded-lg" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 7 }).map((_, i) => (<div key={i} className="h-12 skeleton-shimmer rounded-xl" />))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Edit Event</h1>
          <p className="mt-1 text-sm text-muted">Update event details</p>
        </div>
        <button onClick={() => setShowDelete(true)} className="btn-danger">Delete</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (<div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-danger dark:bg-red-950">{error}</div>)}

        {/* Visibility */}
        <div className="card-elevated p-5 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Who can see this?</h2>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => update('visibility', 'public')}
              className={cn('flex flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition-all duration-150', form.visibility === 'public' ? 'border-primary bg-primary/5 shadow-sm' : 'border-card-border hover:border-primary/50')}>
              <div className="flex items-center gap-2"><Globe size={15} className={form.visibility === 'public' ? 'text-primary' : 'text-muted'} /><span className="text-sm font-medium text-foreground">Public</span></div>
              <p className="text-xs text-muted">Visible to everyone on the platform</p>
            </button>
            <button type="button" onClick={() => update('visibility', 'email_restricted')}
              className={cn('flex flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition-all duration-150', form.visibility === 'email_restricted' ? 'border-primary bg-primary/5 shadow-sm' : 'border-card-border hover:border-primary/50')}>
              <div className="flex items-center gap-2"><Users size={15} className={form.visibility === 'email_restricted' ? 'text-primary' : 'text-muted'} /><span className="text-sm font-medium text-foreground">Students Only</span></div>
              <p className="text-xs text-muted">Only students in your Access List</p>
            </button>
          </div>
          {form.visibility === 'email_restricted' && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
              Only students in your Access List will see this.{' '}<Link href="/facilitator/students" className="font-medium underline">Manage Access List →</Link>
            </div>
          )}
        </div>

        {/* Basic Info */}
        <div className="card-elevated p-5 space-y-4">
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
          <FormField type="text" label="Organizer Name" name="organizer_name" value={form.organizer_name} onChange={(v) => update('organizer_name', v)} placeholder="e.g. Your Hub Name" />
          <FormField type="url" label="Event Registration URL" name="event_url" value={form.event_url} onChange={(v) => update('event_url', v)} placeholder="https://..." />
          <ImageUpload label="Banner Image" name="banner_image_url" value={form.banner_image_url} onChange={(v) => update('banner_image_url', v)} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Tags</label>
            <div className="flex flex-wrap gap-2 rounded-xl border border-card-border bg-background p-2.5 min-h-[42px]">
              {form.tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {tag}<button type="button" onClick={() => removeTag(tag)}><X size={10} /></button>
                </span>
              ))}
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag}
                placeholder="Add tag, press Enter" className="flex-1 min-w-[120px] bg-transparent text-sm outline-none text-foreground placeholder:text-muted" />
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="card-elevated p-5 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Settings</h2>
          <div className="flex flex-wrap gap-6">
            <FormField type="checkbox" label="Active (visible on hub)" name="is_active" checked={form.is_active} onChange={(v) => update('is_active', v)} />
            <FormField type="checkbox" label="Featured" name="is_featured" checked={form.is_featured} onChange={(v) => update('is_featured', v)} />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary py-2.5 px-6">{saving ? 'Saving...' : 'Save Changes'}</button>
          <button type="button" onClick={() => router.back()} className="btn-secondary py-2.5 px-6">Cancel</button>
        </div>
      </form>

      <DeleteConfirmModal open={showDelete} title={form.title} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} loading={deleting} />
    </div>
  );
}
