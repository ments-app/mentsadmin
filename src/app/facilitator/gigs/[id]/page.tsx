'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Globe, Users } from 'lucide-react';
import FormField from '@/components/FormField';
import DateTimePicker from '@/components/DateTimePicker';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import AiFieldButton from '@/components/AiFieldButton';
import SkillsInput from '@/components/SkillsInput';
import { getGig, updateGig, deleteGig } from '@/actions/gigs';
import { cn } from '@/lib/cn';

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

export default function FacilitatorEditGigPage() {
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
    visibility: 'public' as 'public' | 'email_restricted',
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
        visibility: ((data as any).visibility ?? 'public') as 'public' | 'email_restricted',
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
      router.push('/facilitator/gigs');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteGig(id);
      router.push('/facilitator/gigs');
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
          {Array.from({ length: 5 }).map((_, i) => (
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
          <h1 className="text-2xl font-bold text-foreground">Edit Gig</h1>
          <p className="mt-1 text-muted">Update gig details</p>
        </div>
        <button onClick={() => setShowDelete(true)} className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-danger-hover">
          Delete
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-danger dark:bg-red-950">{error}</div>
        )}

        {/* Visibility */}
        <div className="rounded-lg border border-card-border p-4 space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Who can see this?</h2>
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
        </div>

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
                <label className="text-sm font-medium text-foreground">{field === 'responsibilities' ? 'Scope of Work' : field.charAt(0).toUpperCase() + field.slice(1)}</label>
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

        <FormField type="checkbox" label="Active" name="is_active" checked={form.is_active} onChange={(v) => update('is_active', v)} />

        <div className="flex gap-3 pt-4">
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
