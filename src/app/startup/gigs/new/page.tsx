'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormField from '@/components/FormField';
import DateTimePicker from '@/components/DateTimePicker';
import AiFieldButton from '@/components/AiFieldButton';
import { createStartupGig } from '@/actions/startup-portal';
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

export default function StartupNewGigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    try {
      await createStartupGig(form);
      router.push('/startup/gigs');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">New Gig</h1>
      <p className="mt-1 text-muted">Post a freelance or contract gig</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-danger dark:bg-red-950">{error}</div>
        )}

        {/* Basic Info */}
        <div className="rounded-lg border border-card-border p-4 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>
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
        <div className="rounded-lg border border-card-border p-4 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Client Details</h2>
          <FormField type="url" label="Client Website" name="company_website" value={form.company_website} onChange={(v) => update('company_website', v)} placeholder="https://example.com" />
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Client Logo URL</label>
            <div className="flex gap-2">
              <input type="url" value={form.company_logo_url} onChange={(e) => update('company_logo_url', e.target.value)} placeholder="https://example.com/logo.png" className="flex-1 rounded-lg border border-card-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              <button type="button" onClick={fetchLogoFromWebsite} disabled={fetchingLogo || !form.company_website.trim()} className="rounded-lg bg-primary/10 border border-primary/30 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap">
                {fetchingLogo ? 'Fetching...' : 'Fetch from Website'}
              </button>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="rounded-lg border border-card-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Details</h2>
            <span className="text-xs text-muted">AI can generate content based on the info above</span>
          </div>
          {(['description', 'deliverables', 'responsibilities'] as const).map((field) => (
            <div key={field} className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground capitalize">{field === 'responsibilities' ? 'Scope of Work' : field.charAt(0).toUpperCase() + field.slice(1)}</label>
                <AiFieldButton field={field} type="gig" context={{ title: form.title, company: form.company, category: form.category, budget: form.budget, duration: form.duration, payment_type: form.payment_type, experience_level: form.experience_level }} onGenerated={(text) => update(field, text)} disabled={!form.title} />
              </div>
              <FormField type="textarea" label="" name={field} value={form[field]} onChange={(v) => update(field, v)} placeholder="" rows={field === 'description' ? 5 : 4} />
            </div>
          ))}
        </div>

        {/* --- Skills --- */}
        <div className="rounded-lg border border-card-border p-4 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Skills Required</h2>
          <SkillsInput value={form.skills_required} onChange={(skills) => update('skills_required', skills)} />
        </div>

        {/* Contact */}
        <div className="rounded-lg border border-card-border p-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">Contact</h2>
          <FormField type="email" label="Contact Email" name="contact_email" value={form.contact_email} onChange={(v) => update('contact_email', v)} placeholder="contact@example.com" />
        </div>

        {/* Visibility */}
        <div className="rounded-lg border border-card-border p-4 space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Visibility</h2>
          <div className="grid grid-cols-2 gap-3">
            {(['public', 'facilitator_only'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => update('visibility', v)}
                className={cn(
                  'rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                  form.visibility === v
                    ? 'border-primary bg-primary/10 text-primary'
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

        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={loading} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Gig'}
          </button>
          <button type="button" onClick={() => router.back()} className="rounded-lg border border-card-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card-border/30">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
