'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { X, Plus, Users, Store, Trash2, Check } from 'lucide-react';
import FormField from '@/components/FormField';
import ImageUpload from '@/components/ImageUpload';
import DateTimePicker from '@/components/DateTimePicker';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { getEvent, updateEvent, deleteEvent, getEventLeaderboard, getEventStalls, getEventAudience, updateArenaRound, addEventStallsBatch, removeEventStall } from '@/actions/events';
import { getStartupProfiles } from '@/actions/startups';
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

const arenaRoundOptions = [
  { value: 'registration', label: 'Round 1 -- Stall Registration' },
  { value: 'investment', label: 'Round 2 -- Audience Investment' },
  { value: 'completed', label: 'Completed -- Results Announced' },
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
    event_type: 'online' as 'online' | 'in-person' | 'hybrid',
    is_active: true,
    tags: [] as string[],
    is_featured: false,
    organizer_name: '',
    category: 'event' as 'event' | 'meetup' | 'workshop' | 'conference' | 'seminar',
    // Arena fields
    entry_type: '' as string,
    arena_enabled: false,
    virtual_fund_amount: 1000000,
    max_investment_per_startup: 100000,
    arena_round: '' as string,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stallsList, setStallsList] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [audienceList, setAudienceList] = useState<any[]>([]);
  const [roundSwitching, setRoundSwitching] = useState(false);

  // Add Stall Modal State
  const [showAddStall, setShowAddStall] = useState(false);
  const [allStartups, setAllStartups] = useState<any[]>([]);
  const [startupSearch, setStartupSearch] = useState('');
  const [selectedStartupIds, setSelectedStartupIds] = useState<string[]>([]);
  const [addingStall, setAddingStall] = useState(false);

  const registeredStartupIds = new Set(stallsList.map(s => s.startup_id).filter(Boolean));

  const filteredStartups = (allStartups || [])
    .filter(s => !registeredStartupIds.has(s.id))
    .filter(s => 
      s.brand_name?.toLowerCase().includes(startupSearch.toLowerCase()) ||
      s.owner?.full_name?.toLowerCase().includes(startupSearch.toLowerCase()) ||
      s.owner?.username?.toLowerCase().includes(startupSearch.toLowerCase())
    );

  const refreshArenaData = useCallback(() => {
    if (!id) return;
    getEventLeaderboard(id).then(setLeaderboard).catch(console.error);
    getEventStalls(id).then(setStallsList).catch(console.error);
    getEventAudience(id).then(setAudienceList).catch(console.error);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    
    getEvent(id).then((data) => {
      if (!data) {
        setError('Event not found');
        setLoading(false);
        return;
      }

      setForm({
        title: data.title || '',
        description: data.description ?? '',
        event_date: data.event_date ? data.event_date.slice(0, 16) : '',
        location: data.location ?? '',
        event_url: data.event_url ?? '',
        banner_image_url: data.banner_image_url ?? '',
        event_type: (data.event_type as 'online' | 'in-person' | 'hybrid') || 'online',
        is_active: data.is_active ?? true,
        tags: data.tags ?? [],
        is_featured: data.is_featured ?? false,
        organizer_name: data.organizer_name ?? '',
        category: (data.category as 'event' | 'meetup' | 'workshop' | 'conference' | 'seminar') ?? 'event',
        entry_type: data.entry_type ?? '',
        arena_enabled: data.arena_enabled ?? false,
        virtual_fund_amount: data.virtual_fund_amount ?? 1000000,
        max_investment_per_startup: data.max_investment_per_startup ?? 100000,
        arena_round: data.arena_round ?? '',
      });
      setLoading(false);

      // Load arena data if enabled
      if (data.arena_enabled) {
        refreshArenaData();
        getStartupProfiles('published', 1, 200).then(res => {
          if (res && res.startups) setAllStartups(res.startups);
        }).catch(err => {
          console.error('Failed to load startups:', err);
        });
      }
    }).catch(err => {
      console.error('Failed to load event:', err);
      setError(err instanceof Error ? err.message : 'Failed to load event');
      setLoading(false);
    });
  }, [id, refreshArenaData]);

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

  async function handleAddStallsBatch(e: React.FormEvent) {
    e.preventDefault();
    if (selectedStartupIds.length === 0) return;
    
    setAddingStall(true);
    try {
      const selectedStalls = allStartups
        .filter(s => selectedStartupIds.includes(s.id))
        .map(s => ({
          user_id: s.owner_id,
          stall_name: s.brand_name,
          tagline: s.tagline || '',
          category: s.categories?.[0] || '',
          startup_id: s.id,
          logo_url: s.logo_url,
        }));

      await addEventStallsBatch(id, selectedStalls);
      
      setShowAddStall(false);
      setSelectedStartupIds([]);
      setStartupSearch('');
      refreshArenaData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add stalls');
    } finally {
      setAddingStall(false);
    }
  }

  function toggleStartupSelection(startupId: string) {
    setSelectedStartupIds(prev => 
      prev.includes(startupId) 
        ? prev.filter(id => id !== startupId) 
        : [...prev, startupId]
    );
  }

  async function handleRemoveStall(stallId: string, stallName: string) {
    if (!confirm(`Are you sure you want to remove the stall "${stallName}"? This will also delete all associated investments.`)) return;
    
    try {
      await removeEventStall(id, stallId);
      refreshArenaData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove stall');
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl animate-fade-in">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-card-border/50" />
        <div className="mt-8 space-y-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-card-border/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <div className="flex items-center justify-between mb-8">
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
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-danger dark:border-red-800 dark:bg-red-950">{error}</div>
        )}

        <div className="card-elevated rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Basic Info</h2>
          <FormField type="text" label="Title" name="title" value={form.title}
            onChange={(v) => update('title', v)} required placeholder="Event title" />
          <FormField type="textarea" label="Description" name="description" value={form.description}
            onChange={(v) => update('description', v)} placeholder="Describe the event..." rows={4} />

          <div className="grid grid-cols-2 gap-4">
            <FormField type="select" label="Category" name="category" value={form.category}
              onChange={(v) => update('category', v as 'event' | 'meetup' | 'workshop' | 'conference' | 'seminar')} options={categoryOptions} required />
            <FormField type="select" label="Mode" name="event_type" value={form.event_type}
              onChange={(v) => update('event_type', v as 'online' | 'in-person' | 'hybrid')} options={eventTypeOptions} required />
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

          <FormField type="checkbox" label="Enable Investment Arena" name="arena_enabled"
            checked={form.arena_enabled} onChange={(v: boolean) => update('arena_enabled', v)} />

          {form.arena_enabled && (
            <div className="space-y-5 pl-4 border-l-2 border-primary/30 ml-1">
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

              {/* Arena Round Control */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Current Round</label>
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
                    className="btn-primary whitespace-nowrap"
                  >
                    {roundSwitching ? 'Switching...' : 'Switch Round'}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-muted">
                  Switch between rounds to control what participants can do.
                </p>
              </div>

              {/* Registered Stalls (Applicants) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Store size={14} /> Registered Stalls ({stallsList.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddStall(true)}
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <Plus size={12} /> Add Multiple Stalls
                  </button>
                </div>
                
                {stallsList.length > 0 ? (
                  <div className="rounded-xl border border-card-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-card-border/10">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">#</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Stall Name</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Registered By</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Linked Startup</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Category</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Tagline</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-card-border">
                        {stallsList.map((stall, i) => (
                          <tr key={stall.id} className="hover:bg-card-border/5 transition-colors">
                            <td className="px-4 py-3 text-muted">{i + 1}</td>
                            <td className="px-4 py-3 font-medium text-foreground">{stall.stall_name}</td>
                            <td className="px-4 py-3 text-foreground">
                              {stall.user?.full_name || stall.user?.username || '—'}
                            </td>
                            <td className="px-4 py-3 text-foreground">
                              {stall.startup?.brand_name ? (
                                <span className="inline-flex items-center gap-1">
                                  {stall.startup.brand_name}
                                  <span className="text-xs text-muted">({stall.startup.stage})</span>
                                </span>
                              ) : '—'}
                            </td>
                            <td className="px-4 py-3 text-muted capitalize">{stall.category || '—'}</td>
                            <td className="px-4 py-3 text-muted text-xs max-w-[200px] truncate">{stall.tagline || '—'}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveStall(stall.id, stall.stall_name)}
                                className="text-muted hover:text-red-500 transition-colors"
                                title="Remove Stall"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-muted italic py-2">No stalls registered yet.</p>
                )}
              </div>

              {/* Audience (Investors) */}
              {audienceList.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                    <Users size={14} /> Audience / Investors ({audienceList.length})
                  </h3>
                  <div className="rounded-xl border border-card-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-card-border/10">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">#</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Username</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Remaining Balance</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Invested</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-card-border">
                        {audienceList.map((a, i) => {
                          const totalFund = form.virtual_fund_amount || 1000000;
                          const invested = totalFund - (a.virtual_balance ?? 0);
                          return (
                            <tr key={a.id} className="hover:bg-card-border/5 transition-colors">
                              <td className="px-4 py-3 text-muted">{i + 1}</td>
                              <td className="px-4 py-3 font-medium text-foreground">{a.user?.full_name || '—'}</td>
                              <td className="px-4 py-3 text-muted">{a.user?.username || '—'}</td>
                              <td className="px-4 py-3 text-right text-foreground">&#x20B9;{(a.virtual_balance ?? 0).toLocaleString('en-IN')}</td>
                              <td className="px-4 py-3 text-right text-emerald-600 font-semibold">
                                &#x20B9;{invested.toLocaleString('en-IN')}
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
                  <h3 className="text-sm font-semibold text-foreground mb-3">Funding Leaderboard</h3>
                  <div className="rounded-xl border border-card-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-card-border/10">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">#</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Stall</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Funding</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Investors</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-card-border">
                        {leaderboard.map((stall, i) => (
                          <tr key={stall.id} className="hover:bg-card-border/5 transition-colors">
                            <td className="px-4 py-3 text-muted">{i + 1}</td>
                            <td className="px-4 py-3 font-medium text-foreground">{stall.stall_name}</td>
                            <td className="px-4 py-3 text-right text-emerald-600 font-semibold">
                              &#x20B9;{(stall.total_funding / 100000).toFixed(1)}L
                            </td>
                            <td className="px-4 py-3 text-right text-muted">{stall.investor_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

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
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>

      {/* Add Stall Modal (Batch Selection) */}
      {showAddStall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Add Multiple Stalls</h2>
                <p className="text-xs text-muted">Select startups to register for this event</p>
              </div>
              <button onClick={() => setShowAddStall(false)} className="text-muted hover:text-foreground"><X size={20} /></button>
            </div>
            
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search startup name or owner..."
                  value={startupSearch}
                  onChange={(e) => setStartupSearch(e.target.value)}
                  className="w-full rounded-xl border border-card-border bg-background px-4 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="max-h-[300px] overflow-y-auto rounded-xl border border-card-border divide-y divide-card-border">
              {filteredStartups.length > 0 ? (
                filteredStartups.map(s => {
                  const isSelected = selectedStartupIds.includes(s.id);
                  return (
                    <div 
                      key={s.id} 
                      onClick={() => toggleStartupSelection(s.id)}
                      className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-card-border/5'}`}
                    >
                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${isSelected ? 'border-primary bg-primary' : 'border-card-border bg-background'}`}>
                        {isSelected && <Check size={12} className="text-white" />}
                      </div>
                      <div className="h-8 w-8 shrink-0 overflow-hidden rounded bg-card-border/20">
                        {s.logo_url ? <img src={s.logo_url} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-muted">{s.brand_name?.charAt(0)}</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{s.brand_name}</p>
                        <p className="text-[10px] text-muted truncate">{s.owner?.full_name || s.owner?.username} · {s.stage}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted">No available startups found.</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button 
                onClick={handleAddStallsBatch} 
                disabled={addingStall || selectedStartupIds.length === 0} 
                className="btn-primary flex-1 py-2.5"
              >
                {addingStall ? 'Registering...' : `Register ${selectedStartupIds.length} Startup${selectedStartupIds.length === 1 ? '' : 's'}`}
              </button>
              <button 
                type="button" 
                onClick={() => setShowAddStall(false)} 
                className="btn-secondary flex-1 py-2.5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal open={showDelete} title={form.title}
        onConfirm={handleDelete} onCancel={() => setShowDelete(false)} loading={deleting} />
    </div>
  );
}
