'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, X, Globe, Lock } from 'lucide-react';
import FormField from '@/components/FormField';
import ImageUpload from '@/components/ImageUpload';
import DateTimePicker from '@/components/DateTimePicker';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import {
  getCompetition, updateCompetition,
  getCompetitionRounds, upsertCompetitionRounds,
  getCompetitionFaqs, upsertCompetitionFaqs,
} from '@/actions/competitions';
import { deleteStartupCompetition, getMyApprovedFacilitators } from '@/actions/startup-portal';

type Facilitator = { id: string; organisation_name: string | null; display_name: string; email: string };

const domainOptions = [
  { value: '', label: 'Select domain...' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'case_study', label: 'Case Study' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'design', label: 'Design Challenge' },
  { value: 'coding', label: 'Coding' },
  { value: 'business_plan', label: 'Business Plan' },
  { value: 'research', label: 'Research' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other', label: 'Other' },
];

type Round = { id?: string; round_number: number; title: string; description: string; start_date: string; end_date: string };
type Faq = { question: string; answer: string };

const inputBase = 'w-full rounded-lg border border-card-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm';

export default function StartupEditCompetitionPage() {
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
    deadline: '',
    is_external: false,
    external_url: '',
    has_leaderboard: false,
    prize_pool: '',
    banner_image_url: '',
    tags: [] as string[],
    is_featured: false,
    is_active: true,
    domain: '',
    organizer_name: '',
    participation_type: 'individual',
    team_size_min: 1,
    team_size_max: 4,
    eligibility_criteria: '',
    visibility: 'public' as 'public' | 'facilitator_only',
    target_facilitator_ids: [] as string[],
  });

  const [rounds, setRounds] = useState<Round[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);

  useEffect(() => {
    Promise.all([
      getCompetition(id),
      getCompetitionRounds(id),
      getCompetitionFaqs(id),
      getMyApprovedFacilitators(),
    ]).then(([comp, roundData, faqData, facs]) => {
      setFacilitators(facs);
      setForm({
        title: comp.title,
        description: comp.description ?? '',
        deadline: comp.deadline ? comp.deadline.slice(0, 16) : '',
        is_external: comp.is_external,
        external_url: comp.external_url ?? '',
        has_leaderboard: comp.has_leaderboard,
        prize_pool: comp.prize_pool ?? '',
        banner_image_url: comp.banner_image_url ?? '',
        tags: comp.tags ?? [],
        is_featured: comp.is_featured ?? false,
        is_active: comp.is_active ?? true,
        domain: comp.domain ?? '',
        organizer_name: comp.organizer_name ?? '',
        participation_type: comp.participation_type ?? 'individual',
        team_size_min: comp.team_size_min ?? 1,
        team_size_max: comp.team_size_max ?? 4,
        eligibility_criteria: comp.eligibility_criteria ?? '',
        visibility: ((comp as any).visibility ?? 'public') as 'public' | 'facilitator_only',
        target_facilitator_ids: (comp as any).target_facilitator_ids ?? [],
      });
      setRounds(roundData.map((r, idx) => ({
        id: r.id,
        round_number: r.round_number ?? idx + 1,
        title: r.title,
        description: r.description ?? '',
        start_date: r.start_date ? r.start_date.slice(0, 16) : '',
        end_date: r.end_date ? r.end_date.slice(0, 16) : '',
      })));
      setFaqs(faqData.map((f) => ({ question: f.question, answer: f.answer })));
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

  function addRound() { setRounds((p) => [...p, { round_number: p.length + 1, title: '', description: '', start_date: '', end_date: '' }]); }
  function updateRound(i: number, key: keyof Round, value: string) {
    setRounds((p) => p.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  }
  function removeRound(i: number) { setRounds((p) => p.filter((_, idx) => idx !== i)); }

  function addFaq() { setFaqs((p) => [...p, { question: '', answer: '' }]); }
  function updateFaq(i: number, key: keyof Faq, value: string) {
    setFaqs((p) => p.map((f, idx) => (idx === i ? { ...f, [key]: value } : f)));
  }
  function removeFaq(i: number) { setFaqs((p) => p.filter((_, idx) => idx !== i)); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await updateCompetition(id, form);
      await Promise.all([
        upsertCompetitionRounds(id, rounds.filter((r) => r.title.trim())),
        upsertCompetitionFaqs(id, faqs.filter((f) => f.question.trim() && f.answer.trim())),
      ]);
      router.push('/startup/competitions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteStartupCompetition(id);
      router.push('/startup/competitions');
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
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
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Competition</h1>
          <p className="mt-1 text-muted text-sm">Update competition details, rounds, and FAQs</p>
        </div>
        <button onClick={() => setShowDelete(true)} className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-danger-hover">
          Delete
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-danger dark:bg-red-950">{error}</div>
        )}

        {/* Posting Visibility */}
        <div className="rounded-lg border border-card-border p-4 space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Where to Post</h2>
          <p className="text-sm text-muted">Choose who can see this competition.</p>
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
              {facilitators.length === 0 ? (
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

        {/* Basic Info */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Basic Info</h2>
          <FormField type="text" label="Title" name="title" value={form.title} onChange={(v) => update('title', v)} required placeholder="Competition title" />
          <FormField type="textarea" label="Description" name="description" value={form.description} onChange={(v) => update('description', v)} placeholder="Describe the competition..." rows={5} />
          <div className="grid grid-cols-2 gap-4">
            <FormField type="select" label="Domain / Category" name="domain" value={form.domain} onChange={(v) => update('domain', v)} options={domainOptions} />
            <FormField type="text" label="Organizer Name" name="organizer_name" value={form.organizer_name} onChange={(v) => update('organizer_name', v)} placeholder="e.g. Your Startup" />
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <DateTimePicker label="Deadline" name="deadline" value={form.deadline} onChange={(v) => update('deadline', v)} />
            <FormField type="text" label="Prize Pool" name="prize_pool" value={form.prize_pool} onChange={(v) => update('prize_pool', v)} placeholder="e.g. ₹1,00,000" />
          </div>
          <ImageUpload label="Banner Image" name="banner_image_url" value={form.banner_image_url} onChange={(v) => update('banner_image_url', v)} />
        </section>

        {/* Participation */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Participation</h2>
          <FormField type="select" label="Participation Type" name="participation_type"
            value={form.participation_type} onChange={(v) => update('participation_type', v)}
            options={[{ value: 'individual', label: 'Individual' }, { value: 'team', label: 'Team' }]} />
          {form.participation_type === 'team' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Min Team Size</label>
                <input type="number" min={1} max={20} value={form.team_size_min}
                  onChange={(e) => update('team_size_min', Number(e.target.value))} className={inputBase} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Max Team Size</label>
                <input type="number" min={1} max={20} value={form.team_size_max}
                  onChange={(e) => update('team_size_max', Number(e.target.value))} className={inputBase} />
              </div>
            </div>
          )}
          <FormField type="textarea" label="Eligibility Criteria" name="eligibility_criteria"
            value={form.eligibility_criteria} onChange={(v) => update('eligibility_criteria', v)}
            placeholder="Who can participate?" rows={3} />
        </section>

        {/* Settings */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Settings</h2>
          <div className="flex flex-wrap gap-6">
            <FormField type="checkbox" label="Active (visible on hub)" name="is_active" checked={form.is_active} onChange={(v) => update('is_active', v)} />
            <FormField type="checkbox" label="Featured" name="is_featured" checked={form.is_featured} onChange={(v) => update('is_featured', v)} />
            <FormField type="checkbox" label="Has Leaderboard" name="has_leaderboard" checked={form.has_leaderboard} onChange={(v) => update('has_leaderboard', v)} />
            <FormField type="checkbox" label="External Competition" name="is_external" checked={form.is_external} onChange={(v) => update('is_external', v)} />
          </div>
          {form.is_external && (
            <FormField type="url" label="External URL" name="external_url" value={form.external_url} onChange={(v) => update('external_url', v)} placeholder="https://..." />
          )}
        </section>

        {/* Rounds */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Rounds / Timeline</h2>
            <button type="button" onClick={addRound}
              className="flex items-center gap-1.5 rounded-lg border border-card-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-card-border/30 transition-colors">
              <Plus size={13} /> Add Round
            </button>
          </div>
          {rounds.length === 0 && <p className="text-sm text-muted">No rounds added.</p>}
          {rounds.map((round, i) => (
            <div key={i} className="rounded-lg border border-card-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted uppercase">Round {i + 1}</span>
                <button type="button" onClick={() => removeRound(i)} className="text-muted hover:text-danger transition-colors"><X size={15} /></button>
              </div>
              <FormField type="text" label="Round Title" name={`round_title_${i}`} value={round.title} onChange={(v) => updateRound(i, 'title', v)} placeholder="e.g. Idea Submission" required />
              <FormField type="textarea" label="Description" name={`round_desc_${i}`} value={round.description} onChange={(v) => updateRound(i, 'description', v)} placeholder="What happens in this round?" rows={2} />
              <div className="grid grid-cols-2 gap-3">
                <DateTimePicker label="Start Date" name={`round_start_${i}`} value={round.start_date} onChange={(v) => updateRound(i, 'start_date', v)} />
                <DateTimePicker label="End Date" name={`round_end_${i}`} value={round.end_date} onChange={(v) => updateRound(i, 'end_date', v)} />
              </div>
            </div>
          ))}
        </section>

        {/* FAQs */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">FAQs</h2>
            <button type="button" onClick={addFaq}
              className="flex items-center gap-1.5 rounded-lg border border-card-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-card-border/30 transition-colors">
              <Plus size={13} /> Add FAQ
            </button>
          </div>
          {faqs.length === 0 && <p className="text-sm text-muted">No FAQs added.</p>}
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-lg border border-card-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted uppercase">FAQ {i + 1}</span>
                <button type="button" onClick={() => removeFaq(i)} className="text-muted hover:text-danger transition-colors"><X size={15} /></button>
              </div>
              <FormField type="text" label="Question" name={`faq_q_${i}`} value={faq.question} onChange={(v) => updateFaq(i, 'question', v)} placeholder="e.g. Who can participate?" required />
              <FormField type="textarea" label="Answer" name={`faq_a_${i}`} value={faq.answer} onChange={(v) => updateFaq(i, 'answer', v)} placeholder="Answer..." rows={2} required />
            </div>
          ))}
        </section>

        <div className="flex gap-3 pt-4 border-t border-card-border">
          <button type="submit" disabled={saving} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => router.back()} className="rounded-lg border border-card-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card-border/30">
            Cancel
          </button>
        </div>
      </form>

      <DeleteConfirmModal open={showDelete} title={form.title} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} loading={deleting} />
    </div>
  );
}
