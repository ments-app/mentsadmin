'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormField from '@/components/FormField';
import DateTimePicker from '@/components/DateTimePicker';
import { createGig } from '@/actions/gigs';
import { supabase } from '@/lib/supabase';
import AiFieldButton from '@/components/AiFieldButton';
import SkillsInput from '@/components/SkillsInput';

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

export default function NewGigPage() {
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
    // New fields
    company: '',
    company_logo_url: '',
    company_website: '',
    category: 'other',
    experience_level: 'any',
    payment_type: 'fixed',
    deliverables: '',
    responsibilities: '',

    contact_email: '',
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
      const clearbitUrl = `https://logo.clearbit.com/${domain}`;
      await fetch(clearbitUrl, { method: 'HEAD', mode: 'no-cors' });
      update('company_logo_url', clearbitUrl);
    } catch {
      try {
        const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
        update('company_logo_url', `https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
      } catch {
        // ignore
      }
    } finally {
      setFetchingLogo(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await createGig({ ...form, created_by: user.id });
      router.push('/dashboard/gigs');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">New Gig</h1>
        <p className="mt-1 text-sm text-muted">Create a new freelance gig</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-danger dark:border-red-800 dark:bg-red-950">
            {error}
          </div>
        )}

        {/* --- Basic Info --- */}
        <div className="card-elevated rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Basic Information</h2>
          <FormField
            type="text"
            label="Title"
            name="title"
            value={form.title}
            onChange={(v) => update('title', v)}
            required
            placeholder="Gig title"
          />
          <FormField
            type="text"
            label="Client / Company"
            name="company"
            value={form.company}
            onChange={(v) => update('company', v)}
            placeholder="Client or company name"
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              type="select"
              label="Category"
              name="category"
              value={form.category}
              onChange={(v) => update('category', v)}
              options={categoryOptions}
            />
            <FormField
              type="select"
              label="Experience Level"
              name="experience_level"
              value={form.experience_level}
              onChange={(v) => update('experience_level', v)}
              options={experienceLevelOptions}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              type="select"
              label="Payment Type"
              name="payment_type"
              value={form.payment_type}
              onChange={(v) => update('payment_type', v)}
              options={paymentTypeOptions}
            />
            <FormField
              type="text"
              label="Budget"
              name="budget"
              value={form.budget}
              onChange={(v) => update('budget', v)}
              placeholder="e.g. $500 or $25/hr"
            />
          </div>
          <FormField
            type="text"
            label="Duration"
            name="duration"
            value={form.duration}
            onChange={(v) => update('duration', v)}
            placeholder="e.g. 2 weeks, 1 month"
          />
          <DateTimePicker
            label="Deadline"
            name="deadline"
            value={form.deadline}
            onChange={(v) => update('deadline', v)}
          />
        </div>

        {/* --- Client Details --- */}
        <div className="card-elevated rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Client Details</h2>
          <FormField
            type="url"
            label="Client Website"
            name="company_website"
            value={form.company_website}
            onChange={(v) => update('company_website', v)}
            placeholder="https://example.com"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Client Logo URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={form.company_logo_url}
                onChange={(e) => update('company_logo_url', e.target.value)}
                placeholder="https://example.com/logo.png"
                className="flex-1 rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-shadow"
              />
              <button
                type="button"
                onClick={fetchLogoFromWebsite}
                disabled={fetchingLogo || !form.company_website.trim()}
                className="btn-secondary whitespace-nowrap"
              >
                {fetchingLogo ? 'Fetching...' : 'Fetch from Website'}
              </button>
            </div>
            {form.company_logo_url && (
              <div className="mt-3 flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl border border-card-border bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.company_logo_url}
                    alt="Logo preview"
                    className="h-10 w-10 object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <span className="text-xs text-muted truncate max-w-xs">{form.company_logo_url}</span>
              </div>
            )}
          </div>
        </div>

        {/* --- Description & Scope --- */}
        <div className="card-elevated rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Details</h2>
            <span className="text-xs text-muted">AI can generate content based on the info above</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Description</label>
              <AiFieldButton
                field="description"
                type="gig"
                context={{ title: form.title, company: form.company, category: form.category, budget: form.budget, duration: form.duration, payment_type: form.payment_type, experience_level: form.experience_level, skills_required: form.skills_required.join(', '), company_website: form.company_website }}
                onGenerated={(text) => update('description', text)}
                disabled={!form.title}
              />
            </div>
            <FormField
              type="textarea"
              label=""
              name="description"
              value={form.description}
              onChange={(v) => update('description', v)}
              placeholder="Describe what the gig is about, context, and expectations..."
              rows={5}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Deliverables</label>
              <AiFieldButton
                field="deliverables"
                type="gig"
                context={{ title: form.title, category: form.category, budget: form.budget, duration: form.duration, description: form.description, skills_required: form.skills_required.join(', ') }}
                onGenerated={(text) => update('deliverables', text)}
                disabled={!form.title}
              />
            </div>
            <FormField
              type="textarea"
              label=""
              name="deliverables"
              value={form.deliverables}
              onChange={(v) => update('deliverables', v)}
              placeholder="What specific outputs/deliverables are expected..."
              rows={4}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Scope of Work</label>
              <AiFieldButton
                field="responsibilities"
                type="gig"
                context={{ title: form.title, category: form.category, description: form.description, duration: form.duration, skills_required: form.skills_required.join(', ') }}
                onGenerated={(text) => update('responsibilities', text)}
                disabled={!form.title}
              />
            </div>
            <FormField
              type="textarea"
              label=""
              name="responsibilities"
              value={form.responsibilities}
              onChange={(v) => update('responsibilities', v)}
              placeholder="Detailed breakdown of tasks and responsibilities..."
              rows={4}
            />
          </div>
        </div>

        {/* --- Skills --- */}
        <div className="card-elevated rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Skills Required</h2>
          <SkillsInput value={form.skills_required} onChange={(skills) => update('skills_required', skills)} />
        </div>

        {/* --- Application --- */}
        <div className="card-elevated rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Contact</h2>
          <FormField
            type="email"
            label="Contact Email"
            name="contact_email"
            value={form.contact_email}
            onChange={(v) => update('contact_email', v)}
            placeholder="contact@example.com"
          />
        </div>

        {/* --- Status --- */}
        <div className="card-elevated rounded-xl p-6">
          <FormField
            type="checkbox"
            label="Active"
            name="is_active"
            checked={form.is_active}
            onChange={(v) => update('is_active', v)}
          />
        </div>

        <div className="flex gap-3 pt-2 pb-8">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating...' : 'Create Gig'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
