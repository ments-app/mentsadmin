'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, X, Users, ArrowLeft } from 'lucide-react';
import FormField from '@/components/FormField';
import ImageUpload from '@/components/ImageUpload';
import DateTimePicker from '@/components/DateTimePicker';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import {
  getCompetition, updateCompetition, deleteCompetition,
  getCompetitionRounds, upsertCompetitionRounds,
  getCompetitionFaqs, upsertCompetitionFaqs,
} from '@/actions/competitions';
import Link from 'next/link';

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

export default function EditCompetitionPage() {
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
    brochure_url: '',
  });

  const [rounds, setRounds] = useState<Round[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);

  useEffect(() => {
    Promise.all([
      getCompetition(id),
      getCompetitionRounds(id),
      getCompetitionFaqs(id),
    ]).then(([comp, roundData, faqData]) => {
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
        brochure_url: comp.brochure_url ?? '',
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

  const inputBase =
    'w-full rounded-xl border border-card-border bg-background px-3.5 py-2.5 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all';

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl animate-fade-in">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-card-border" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-card-border" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in mx-auto max-w-3xl">
      {/* Breadcrumb */}
      <Link href="/dashboard/competitions" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors mb-4">
        <ArrowLeft size={15} />
        Back to Competitions
      </Link>

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Edit Competition</h1>
          <p className="mt-1 text-sm text-muted">Update competition details, rounds, and FAQs</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/competitions/${id}/registrations`}
            className="btn-secondary flex items-center gap-2"
          >
            <Users size={15} />
            Registrations
          </Link>
          <button onClick={() => setShowDelete(true)} className="btn-danger">
            Delete
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 p-4 text-sm text-danger flex items-center gap-2">
            <span className="shrink-0 h-2 w-2 rounded-full bg-red-500" />
            {error}
          </div>
        )}

        {/* Basic Info */}
        <section className="card-elevated rounded-xl p-6 space-y-5">
          <h2 className="text-base font-semibold text-foreground">Basic Info</h2>
          <FormField type="text" label="Title" name="title" value={form.title}
            onChange={(v) => update('title', v)} required placeholder="Competition title" />
          <FormField type="textarea" label="Description" name="description" value={form.description}
            onChange={(v) => update('description', v)} placeholder="Describe the competition..." rows={5} />
          <div className="grid grid-cols-2 gap-4">
            <FormField type="select" label="Domain / Category" name="domain" value={form.domain}
              onChange={(v) => update('domain', v)} options={domainOptions} />
            <FormField type="text" label="Organizer Name" name="organizer_name" value={form.organizer_name}
              onChange={(v) => update('organizer_name', v)} placeholder="e.g. Google, IIT Delhi" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Tags</label>
            <div className="flex flex-wrap gap-2 rounded-xl border border-card-border bg-background p-3 min-h-[46px] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              {form.tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-primary/70 transition-colors"><X size={10} /></button>
                </span>
              ))}
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag}
                placeholder="Add tag, press Enter"
                className="flex-1 min-w-[120px] bg-transparent text-sm outline-none text-foreground placeholder:text-muted" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DateTimePicker label="Deadline" name="deadline" value={form.deadline}
              onChange={(v) => update('deadline', v)} />
            <FormField type="text" label="Prize Pool" name="prize_pool" value={form.prize_pool}
              onChange={(v) => update('prize_pool', v)} placeholder="e.g. Rs.1,00,000" />
          </div>
          <ImageUpload label="Banner Image" name="banner_image_url" value={form.banner_image_url}
            onChange={(v) => update('banner_image_url', v)} />

          <FormField type="url" label="Brochure URL" name="brochure_url" value={form.brochure_url}
            onChange={(v) => update('brochure_url', v)} placeholder="https://drive.google.com/... or any downloadable link" />
        </section>

        {/* Participation */}
        <section className="card-elevated rounded-xl p-6 space-y-5">
          <h2 className="text-base font-semibold text-foreground">Participation</h2>
          <FormField type="select" label="Participation Type" name="participation_type"
            value={form.participation_type} onChange={(v) => update('participation_type', v)}
            options={[{ value: 'individual', label: 'Individual' }, { value: 'team', label: 'Team' }]} />
          {form.participation_type === 'team' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Min Team Size</label>
                <input type="number" min={1} max={20} value={form.team_size_min}
                  onChange={(e) => update('team_size_min', Number(e.target.value))} className={inputBase} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Max Team Size</label>
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
        <section className="card-elevated rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Settings</h2>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <FormField type="checkbox" label="Active (visible on hub)" name="is_active"
              checked={form.is_active} onChange={(v) => update('is_active', v)} />
            <FormField type="checkbox" label="Featured" name="is_featured"
              checked={form.is_featured} onChange={(v) => update('is_featured', v)} />
            <FormField type="checkbox" label="Has Leaderboard" name="has_leaderboard"
              checked={form.has_leaderboard} onChange={(v) => update('has_leaderboard', v)} />
            <FormField type="checkbox" label="External Competition" name="is_external"
              checked={form.is_external} onChange={(v) => update('is_external', v)} />
          </div>
          {form.is_external && (
            <FormField type="url" label="External URL" name="external_url" value={form.external_url}
              onChange={(v) => update('external_url', v)} placeholder="https://..." />
          )}
        </section>

        {/* Rounds */}
        <section className="card-elevated rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Rounds / Timeline</h2>
            <button type="button" onClick={addRound}
              className="btn-secondary flex items-center gap-1.5 !py-1.5 !px-3 !text-xs">
              <Plus size={13} /> Add Round
            </button>
          </div>
          {rounds.length === 0 && (
            <div className="rounded-xl border border-dashed border-card-border py-8 text-center">
              <p className="text-sm text-muted">No rounds added.</p>
            </div>
          )}
          {rounds.map((round, i) => (
            <div key={i} className="rounded-xl border border-card-border bg-background p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">Round {i + 1}</span>
                <button type="button" onClick={() => removeRound(i)} className="btn-ghost !p-1.5 text-muted hover:text-danger">
                  <X size={15} />
                </button>
              </div>
              <FormField type="text" label="Round Title" name={`round_title_${i}`} value={round.title}
                onChange={(v) => updateRound(i, 'title', v)} placeholder="e.g. Idea Submission" required />
              <FormField type="textarea" label="Description" name={`round_desc_${i}`} value={round.description}
                onChange={(v) => updateRound(i, 'description', v)} placeholder="What happens in this round?" rows={2} />
              <div className="grid grid-cols-2 gap-4">
                <DateTimePicker label="Start Date" name={`round_start_${i}`} value={round.start_date}
                  onChange={(v) => updateRound(i, 'start_date', v)} />
                <DateTimePicker label="End Date" name={`round_end_${i}`} value={round.end_date}
                  onChange={(v) => updateRound(i, 'end_date', v)} />
              </div>
            </div>
          ))}
        </section>

        {/* FAQs */}
        <section className="card-elevated rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">FAQs</h2>
            <button type="button" onClick={addFaq}
              className="btn-secondary flex items-center gap-1.5 !py-1.5 !px-3 !text-xs">
              <Plus size={13} /> Add FAQ
            </button>
          </div>
          {faqs.length === 0 && (
            <div className="rounded-xl border border-dashed border-card-border py-8 text-center">
              <p className="text-sm text-muted">No FAQs added.</p>
            </div>
          )}
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-xl border border-card-border bg-background p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">FAQ {i + 1}</span>
                <button type="button" onClick={() => removeFaq(i)} className="btn-ghost !p-1.5 text-muted hover:text-danger">
                  <X size={15} />
                </button>
              </div>
              <FormField type="text" label="Question" name={`faq_q_${i}`} value={faq.question}
                onChange={(v) => updateFaq(i, 'question', v)} placeholder="e.g. Who can participate?" required />
              <FormField type="textarea" label="Answer" name={`faq_a_${i}`} value={faq.answer}
                onChange={(v) => updateFaq(i, 'answer', v)} placeholder="Answer..." rows={2} required />
            </div>
          ))}
        </section>

        {/* Submit */}
        <div className="flex gap-3 pt-2 pb-4">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>

      <DeleteConfirmModal open={showDelete} title={form.title}
        onConfirm={handleDelete} onCancel={() => setShowDelete(false)} loading={deleting} />
    </div>
  );
}
