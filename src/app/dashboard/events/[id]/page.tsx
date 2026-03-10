'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import FormField from '@/components/FormField';
import ImageUpload from '@/components/ImageUpload';
import DateTimePicker from '@/components/DateTimePicker';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { getEvent, updateEvent, deleteEvent, getEventLeaderboard, getEventStalls, getEventAudience, updateArenaRound } from '@/actions/events';
import LocationInput from '@/components/LocationInput';
import { Users, Store } from 'lucide-react';

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

const arenaRoundOptions = [
  { value: 'registration', label: 'Round 1 — Stall Registration' },
  { value: 'investment', label: 'Round 2 — Audience Investment' },
  { value: 'completed', label: 'Completed — Results Announced' },
];

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
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
    arena_round: '' as string,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stallsList, setStallsList] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [audienceList, setAudienceList] = useState<any[]>([]);
  const [roundSwitching, setRoundSwitching] = useState(false);

  useEffect(() => {
    getEvent(id).then((data) => {
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
        entry_type: data.entry_type ?? '',
        arena_enabled: data.arena_enabled ?? false,
        virtual_fund_amount: data.virtual_fund_amount ?? 1000000,
        arena_round: data.arena_round ?? '',
      });
      setLoading(false);

      // Load arena data if enabled
      if (data.arena_enabled) {
        getEventLeaderboard(id).then(setLeaderboard).catch(console.error);
        getEventStalls(id).then(setStallsList).catch(console.error);
        getEventAudience(id).then(setAudienceList).catch(console.error);
      }
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
      router.push('/dashboard/events');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteEvent(id);
      router.push('/dashboard/events');
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
          {Array.from({ length: 7 }).map((_, i) => (
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
          <h1 className="text-2xl font-bold text-foreground">Edit Event</h1>
          <p className="mt-1 text-muted text-sm">Update event details</p>
        </div>
        <button onClick={() => setShowDelete(true)}
          className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-danger-hover">
          Delete
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-danger dark:bg-red-950">{error}</div>
        )}

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Basic Info</h2>
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
            <LocationInput label="Location" name="location" value={form.location} onChange={(v) => update('location', v)} placeholder="e.g. Bengaluru, Delhi, Online…" />
          </div>

          <FormField type="text" label="Organizer Name" name="organizer_name" value={form.organizer_name}
            onChange={(v) => update('organizer_name', v)} placeholder="e.g. TechSpark Community" />

          <FormField type="url" label="Event Registration URL" name="event_url" value={form.event_url}
            onChange={(v) => update('event_url', v)} placeholder="https://..." />

          <ImageUpload label="Banner Image" name="banner_image_url" value={form.banner_image_url}
            onChange={(v) => update('banner_image_url', v)} />

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

        {/* ── Investment Arena ── */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Investment Arena</h2>

          <FormField type="checkbox" label="Enable Investment Arena" name="arena_enabled"
            checked={form.arena_enabled} onChange={(v: boolean) => update('arena_enabled', v)} />

          {form.arena_enabled && (
            <div className="space-y-4 pl-1 border-l-2 border-primary/30 ml-2">
              <FormField type="select" label="Entry Type" name="entry_type" value={form.entry_type}
                onChange={(v: string) => update('entry_type', v)} options={entryTypeOptions} required />

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Virtual Fund per Participant</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted">₹</span>
                  <input
                    type="number"
                    value={form.virtual_fund_amount}
                    onChange={(e) => update('virtual_fund_amount', parseInt(e.target.value) || 1000000)}
                    min={100000}
                    step={100000}
                    className="flex-1 rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Arena Round Control */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Current Round</label>
                <div className="flex items-center gap-2">
                  <FormField type="select" label="" name="arena_round" value={form.arena_round}
                    onChange={(v: string) => update('arena_round', v)} options={arenaRoundOptions} />
                  <button
                    type="button"
                    disabled={roundSwitching || !form.arena_round}
                    onClick={async () => {
                      setRoundSwitching(true);
                      try {
                        await updateArenaRound(id, form.arena_round as 'registration' | 'investment' | 'completed');
                      } catch (err) {
                        console.error(err);
                      }
                      setRoundSwitching(false);
                    }}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                  >
                    {roundSwitching ? 'Switching...' : 'Switch Round'}
                  </button>
                </div>
                <p className="mt-1 text-xs text-muted">
                  Switch between rounds to control what participants can do.
                </p>
              </div>

              {/* Registered Stalls (Applicants) */}
              {stallsList.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <Store size={14} /> Registered Stalls ({stallsList.length})
                  </h3>
                  <div className="rounded-lg border border-card-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-card-border/30">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted">#</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted">Stall Name</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted">Registered By</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted">Linked Startup</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted">Category</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted">Tagline</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stallsList.map((stall, i) => (
                          <tr key={stall.id} className="border-t border-card-border">
                            <td className="px-3 py-2 text-muted">{i + 1}</td>
                            <td className="px-3 py-2 font-medium text-foreground">{stall.stall_name}</td>
                            <td className="px-3 py-2 text-foreground">
                              {stall.user?.full_name || stall.user?.username || '—'}
                            </td>
                            <td className="px-3 py-2 text-foreground">
                              {stall.startup?.brand_name ? (
                                <span className="inline-flex items-center gap-1">
                                  {stall.startup.brand_name}
                                  <span className="text-xs text-muted">({stall.startup.stage})</span>
                                </span>
                              ) : '—'}
                            </td>
                            <td className="px-3 py-2 text-muted capitalize">{stall.category || '—'}</td>
                            <td className="px-3 py-2 text-muted text-xs max-w-[200px] truncate">{stall.tagline || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {stallsList.length === 0 && (
                <p className="text-xs text-muted italic">No stalls registered yet.</p>
              )}

              {/* Audience (Investors) */}
              {audienceList.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <Users size={14} /> Audience / Investors ({audienceList.length})
                  </h3>
                  <div className="rounded-lg border border-card-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-card-border/30">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted">#</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted">Name</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted">Username</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-muted">Remaining Balance</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-muted">Invested</th>
                        </tr>
                      </thead>
                      <tbody>
                        {audienceList.map((a, i) => {
                          const totalFund = form.virtual_fund_amount || 1000000;
                          const invested = totalFund - (a.virtual_balance ?? 0);
                          return (
                            <tr key={a.id} className="border-t border-card-border">
                              <td className="px-3 py-2 text-muted">{i + 1}</td>
                              <td className="px-3 py-2 font-medium text-foreground">{a.user?.full_name || '—'}</td>
                              <td className="px-3 py-2 text-muted">{a.user?.username || '—'}</td>
                              <td className="px-3 py-2 text-right text-foreground">₹{(a.virtual_balance ?? 0).toLocaleString('en-IN')}</td>
                              <td className="px-3 py-2 text-right text-emerald-600 font-semibold">
                                ₹{invested.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Leaderboard Preview */}
              {leaderboard.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Funding Leaderboard</h3>
                  <div className="rounded-lg border border-card-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-card-border/30">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted">#</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted">Stall</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-muted">Funding</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-muted">Investors</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((stall, i) => (
                          <tr key={stall.id} className="border-t border-card-border">
                            <td className="px-3 py-2 text-muted">{i + 1}</td>
                            <td className="px-3 py-2 font-medium text-foreground">{stall.stall_name}</td>
                            <td className="px-3 py-2 text-right text-emerald-600 font-semibold">
                              ₹{(stall.total_funding / 100000).toFixed(1)}L
                            </td>
                            <td className="px-3 py-2 text-right text-muted">{stall.investor_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Settings</h2>
          <div className="flex flex-wrap gap-6">
            <FormField type="checkbox" label="Active (visible on hub)" name="is_active"
              checked={form.is_active} onChange={(v) => update('is_active', v)} />
            <FormField type="checkbox" label="Featured" name="is_featured"
              checked={form.is_featured} onChange={(v) => update('is_featured', v)} />
          </div>
        </section>

        <div className="flex gap-3 pt-4 border-t border-card-border">
          <button type="submit" disabled={saving}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="rounded-lg border border-card-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card-border/30">
            Cancel
          </button>
        </div>
      </form>

      <DeleteConfirmModal open={showDelete} title={form.title}
        onConfirm={handleDelete} onCancel={() => setShowDelete(false)} loading={deleting} />
    </div>
  );
}
