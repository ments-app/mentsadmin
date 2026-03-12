'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import FormField from '@/components/FormField';
import ImageUpload from '@/components/ImageUpload';
import DateTimePicker from '@/components/DateTimePicker';
import { createEvent } from '@/actions/events';
import { supabase } from '@/lib/supabase';
import LocationInput from '@/components/LocationInput';

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

const entryTypeOptions = [
  { value: '', label: 'None (Normal Event)' },
  { value: 'startup', label: 'Startup Entries' },
  { value: 'project', label: 'Personal Project Entries' },
];

export default function NewEventPage() {
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
    // Arena fields
    entry_type: '' as string,
    arena_enabled: false,
    virtual_fund_amount: 1000000,
    max_investment_per_startup: 100000,
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

  function removeTag(tag: string) {
    update('tags', form.tags.filter((t) => t !== tag));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await createEvent({ ...form, created_by: user.id });
      router.push('/dashboard/events');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">New Event</h1>
        <p className="mt-1 text-sm text-muted">Create a new hub event</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-danger dark:border-red-800 dark:bg-red-950">{error}</div>
        )}

        {/* -- Basic Info -- */}
        <div className="card-elevated rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Basic Info</h2>
          <FormField type="text" label="Title" name="title" value={form.title}
            onChange={(v) => update('title', v)} required placeholder="Event title" />
          <FormField type="textarea" label="Description" name="description" value={form.description}
            onChange={(v) => update('description', v)} placeholder="Describe the event..." rows={4} />

          <div className="grid grid-cols-2 gap-4">
            <FormField type="select" label="Category" name="category" value={form.category}
              onChange={(v) => update('category', v)} options={categoryOptions} required />
            <FormField type="select" label="Mode" name="event_type" value={form.event_type}
              onChange={(v) => update('event_type', v)} options={eventTypeOptions} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DateTimePicker label="Event Date" name="event_date" value={form.event_date}
              onChange={(v) => update('event_date', v)} />
            <LocationInput label="Location" name="location" value={form.location} onChange={(v) => update('location', v)} placeholder="e.g. Bengaluru, Delhi, Online..." />
          </div>

          <FormField type="text" label="Organizer Name" name="organizer_name" value={form.organizer_name}
            onChange={(v) => update('organizer_name', v)} placeholder="e.g. TechSpark Community" />

          <FormField type="url" label="Event Registration URL" name="event_url" value={form.event_url}
            onChange={(v) => update('event_url', v)} placeholder="https://..." />

          <ImageUpload label="Banner Image" name="banner_image_url" value={form.banner_image_url}
            onChange={(v) => update('banner_image_url', v)} />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Tags</label>
            <div className="flex flex-wrap gap-2 rounded-xl border border-card-border bg-background p-2.5 min-h-[44px] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-shadow">
              {form.tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-300">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors"><X size={10} /></button>
                </span>
              ))}
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag}
                placeholder="Add tag, press Enter"
                className="flex-1 min-w-[120px] bg-transparent text-sm outline-none text-foreground placeholder:text-muted" />
            </div>
          </div>
        </div>

        {/* -- Investment Arena -- */}
        <div className="card-elevated rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Investment Arena</h2>
          <p className="text-xs text-muted">Enable this to run a Startup Investment Arena where participants invest virtual money in stalls.</p>

          <FormField type="checkbox" label="Enable Investment Arena" name="arena_enabled"
            checked={form.arena_enabled} onChange={(v: boolean) => update('arena_enabled', v)} />

          {form.arena_enabled && (
            <div className="space-y-4 pl-4 border-l-2 border-primary/30 ml-1">
              <FormField type="select" label="Entry Type" name="entry_type" value={form.entry_type}
                onChange={(v: string) => update('entry_type', v)} options={entryTypeOptions} required />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Virtual Fund per Participant</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted font-medium">&#x20B9;</span>
                  <input
                    type="number"
                    value={form.virtual_fund_amount}
                    onChange={(e) => update('virtual_fund_amount', parseInt(e.target.value) || 1000000)}
                    min={100000}
                    step={100000}
                    className="flex-1 rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-shadow"
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted">
                  Default: &#x20B9;10,00,000 -- Each audience member gets this amount to invest across stalls.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Max Investment per Startup</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted font-medium">&#x20B9;</span>
                  <input
                    type="number"
                    value={form.max_investment_per_startup}
                    onChange={(e) => update('max_investment_per_startup', parseInt(e.target.value) || 100000)}
                    min={1000}
                    step={1000}
                    className="flex-1 rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-shadow"
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted">
                  Limit the amount a single user can invest in one startup/stall.
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 p-4 text-xs text-blue-700 dark:text-blue-300">
                <strong>How it works:</strong>
                <ul className="mt-1.5 list-disc pl-4 space-y-1">
                  <li><strong>Round 1 (Registration):</strong> {form.entry_type === 'startup' ? 'Startups' : form.entry_type === 'project' ? 'Project creators' : 'Participants'} register their stalls</li>
                  <li><strong>Round 2 (Investment):</strong> Audience members (non-stall owners) join, receive virtual funds, and invest in stalls</li>
                  <li>A live leaderboard shows which stalls received the most funding</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* -- Settings -- */}
        <div className="card-elevated rounded-xl p-6 space-y-3">
          <h2 className="text-base font-semibold text-foreground">Settings</h2>
          <div className="flex flex-wrap gap-6">
            <FormField type="checkbox" label="Active (visible on hub)" name="is_active"
              checked={form.is_active} onChange={(v) => update('is_active', v)} />
            <FormField type="checkbox" label="Featured" name="is_featured"
              checked={form.is_featured} onChange={(v) => update('is_featured', v)} />
          </div>
        </div>

        <div className="flex gap-3 pt-2 pb-8">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating...' : 'Create Event'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
