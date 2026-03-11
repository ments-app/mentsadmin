'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FormField from '@/components/FormField';
import DateTimePicker from '@/components/DateTimePicker';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import AiFieldButton from '@/components/AiFieldButton';
import { getGig, updateGig } from '@/actions/gigs';
import { deleteStartupGig } from '@/actions/startup-portal';
import SkillsInput from '@/components/SkillsInput';
import { cn } from '@/lib/utils';

const categoryOptions = [
  { value: 'development', label: 'Development' },
  { value: 'design', label: 'Design' },
  { value: 'writing', label: 'Writing & Content' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'video', label: 'Video & Animation' },
  { value: 'audio', label: 'Audio & Music' },
  { value: 'data', label: 'Data & Analytics' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'other', label: 'Other' },
];

const experienceLevelOptions = [
  { value: 'any', label: 'Any Level' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'expert', label: 'Expert' },
];

const paymentTypeOptions = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'hourly', label: 'Hourly Rate' },
  { value: 'milestone', label: 'Milestone-based' },
  { value: 'negotiable', label: 'Negotiable' },
];

export default function StartupEditGigPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [error, setError] = useState('');
  const [fetchingLogo, setFetchingLogo] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    budget: '',
    duration: '',
    skills_required: [] as string[],
    deadline: '',
    is_active: true,
    company: '',
    company_logo_url: '',
    company_website: '',
    category: 'other',
    experience_level: 'any',
    payment_type: 'fixed',
    deliverables: '',
    responsibilities: '',
    contact_email: '',
    visibility: 'public' as 'public' | 'facilitator_only',
  });

  useEffect(() => {
    getGig(id).then((data) => {
      setForm({
        title: data.title,
        description: data.description ?? '',
        budget: data.budget ?? '',
        duration: data.duration ?? '',
        skills_required: data.skills_required ?? [],
        deadline: data.deadline ? data.deadline.slice(0, 16) : '',
        is_active: data.is_active,
        company: data.company ?? '',
        company_logo_url: data.company_logo_url ?? '',
        company_website: data.company_website ?? '',
        category: data.category ?? 'other',
        experience_level: data.experience_level ?? 'any',
        payment_type: data.payment_type ?? 'fixed',
        deliverables: data.deliverables ?? '',
        responsibilities: data.responsibilities ?? '',
        contact_email: data.contact_email ?? '',
        visibility: (data.visibility as 'public' | 'facilitator_only') ?? 'public',
      });
      setLoading(false);
    });
  }, [id]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function fetchLogoFromWebsite() {
    const url = form.company_website.trim();
    if (!url) return;
    setFetchingLogo(true);
    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
      update('company_logo_url', `https://logo.clearbit.com/${domain}`);
    } catch {
      try {
        const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
        update('company_logo_url', `https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
      } catch { /* ignore */ }
    } finally {
      setFetchingLogo(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await updateGig(id, form);
      router.push('/startup/gigs');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteStartupGig(id);
      router.push('/startup/gigs');
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
          {Array.from({ length: 5 }).map((_, i) => (
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
          <h1 className="text-2xl font-semibold text-foreground">Edit Gig</h1>
          <p className="mt-1 text-sm text-muted">Update gig details</p>
        </div>
        <button onClick={() => setShowDelete(true)} className="btn-danger">
          Delete
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-danger dark:bg-red-950 dark:border-red-900">{error}</div>
        )}

        {/* Basic Info */}
        <div className="card-elevated rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Basic Information</h2>
          <FormField type="text" label="Title" name="title" value={form.title} onChange={(v) => update('title', v)} required placeholder="Gig title" />
          <FormField type="text" label="Client / Company" name="company" value={form.company} onChange={(v) => update('company', v)} placeholder="Client or company name" />
          <div className="grid grid-cols-2 gap-4">
            <FormField type="select" label="Category" name="category" value={form.category} onChange={(v) => update('category', v)} options={categoryOptions} />
            <FormField type="select" label="Experience Level" name="experience_level" value={form.experience_level} onChange={(v) => update('experience_level', v)} options={experienceLevelOptions} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField type="select" label="Payment Type" name="payment_type" value={form.payment_type} onChange={(v) => update('payment_type', v)} options={paymentTypeOptions} />
            <FormField type="text" label="Budget" name="budget" value={form.budget} onChange={(v) => update('budget', v)} placeholder="e.g. $500 or $25/hr" />
          </div>
          <FormField type="text" label="Duration" name="duration" value={form.duration} onChange={(v) => update('duration', v)} placeholder="e.g. 2 weeks, 1 month" />
          <DateTimePicker label="Deadline" name="deadline" value={form.deadline} onChange={(v) => update('deadline', v)} />
        </div>

        {/* Client Details */}
        <div className="card-elevated rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Client Details</h2>
          <FormField type="url" label="Client Website" name="company_website" value={form.company_website} onChange={(v) => update('company_website', v)} placeholder="https://example.com" />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Client Logo URL</label>
            <div className="flex gap-2">
              <input type="url" value={form.company_logo_url} onChange={(e) => update('company_logo_url', e.target.value)} placeholder="https://example.com/logo.png" className="flex-1 rounded-xl border border-card-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
              <button type="button" onClick={fetchLogoFromWebsite} disabled={fetchingLogo || !form.company_website.trim()} className="btn-secondary whitespace-nowrap">
                {fetchingLogo ? 'Fetching...' : 'Fetch from Website'}
              </button>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="card-elevated rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Details</h2>
            <span className="text-xs text-muted">AI can generate content based on the info above</span>
          </div>
          {(['description', 'deliverables', 'responsibilities'] as const).map((field) => (
            <div key={field} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">{field === 'responsibilities' ? 'Scope of Work' : field.charAt(0).toUpperCase() + field.slice(1)}</label>
                <AiFieldButton field={field} type="gig" context={{ title: form.title, company: form.company, category: form.category, budget: form.budget, duration: form.duration, payment_type: form.payment_type, experience_level: form.experience_level }} onGenerated={(text) => update(field, text)} disabled={!form.title} />
              </div>
              <FormField type="textarea" label="" name={field} value={form[field]} onChange={(v) => update(field, v)} placeholder="" rows={field === 'description' ? 5 : 4} />
            </div>
          ))}
        </div>

        {/* --- Skills --- */}
        <div className="card-elevated rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Skills Required</h2>
          <SkillsInput value={form.skills_required} onChange={(skills) => update('skills_required', skills)} />
        </div>

        {/* Contact */}
        <div className="card-elevated rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Contact</h2>
          <FormField type="email" label="Contact Email" name="contact_email" value={form.contact_email} onChange={(v) => update('contact_email', v)} placeholder="contact@example.com" />
        </div>

        {/* Visibility */}
        <div className="card-elevated rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Visibility</h2>
          <div className="grid grid-cols-2 gap-3">
            {(['public', 'facilitator_only'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => update('visibility', v)}
                className={cn(
                  'rounded-xl border px-4 py-3.5 text-left text-sm transition-all',
                  form.visibility === v
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20 text-primary'
                    : 'border-card-border text-foreground hover:bg-card-border/20'
                )}
              >
                <div className="font-medium">{v === 'public' ? 'Public' : 'My Facilitators Only'}</div>
                <div className="mt-0.5 text-xs opacity-70">
                  {v === 'public' ? 'Visible to everyone' : 'Only your assigned facilitators can see this'}
                </div>
              </button>
            ))}
          </div>
        </div>

        <FormField type="checkbox" label="Active" name="is_active" checked={form.is_active} onChange={(v) => update('is_active', v)} />

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
