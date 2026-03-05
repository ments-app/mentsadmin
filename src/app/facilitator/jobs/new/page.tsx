'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Globe, Users } from 'lucide-react';
import FormField from '@/components/FormField';
import DateTimePicker from '@/components/DateTimePicker';
import AiFieldButton from '@/components/AiFieldButton';
import { createFacilitatorJob } from '@/actions/facilitators';
import SkillsInput from '@/components/SkillsInput';
import SalaryInput from '@/components/SalaryInput';
import LocationInput from '@/components/LocationInput';
import { cn } from '@/lib/cn';

const jobTypeOptions = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'remote', label: 'Remote' },
  { value: 'internship', label: 'Internship' },
];

const experienceLevelOptions = [
  { value: 'any', label: 'Any Level' },
  { value: 'internship', label: 'Internship' },
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'executive', label: 'Executive' },
];

const categoryOptions = [
  { value: 'engineering', label: 'Engineering' },
  { value: 'design', label: 'Design' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Sales' },
  { value: 'operations', label: 'Operations' },
  { value: 'finance', label: 'Finance' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'legal', label: 'Legal' },
  { value: 'product', label: 'Product' },
  { value: 'data', label: 'Data & Analytics' },
  { value: 'support', label: 'Customer Support' },
  { value: 'content', label: 'Content' },
  { value: 'other', label: 'Other' },
];

const workModeOptions = [
  { value: 'onsite', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
];

export default function FacilitatorNewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchingLogo, setFetchingLogo] = useState(false);
  const [form, setForm] = useState({
    title: '',
    company: '',
    description: '',
    location: '',
    salary_range: '',
    job_type: 'full-time',
    requirements: '',
    deadline: '',
    company_logo_url: '',
    company_website: '',
    experience_level: 'any',
    skills_required: [] as string[],
    benefits: '',
    responsibilities: '',
    category: 'other',
    work_mode: 'onsite',
    contact_email: '',
    is_active: true,
    visibility: 'public' as 'public' | 'email_restricted',
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
      await createFacilitatorJob(form);
      router.push('/facilitator/jobs');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">New Job</h1>
      <p className="mt-1 text-muted">Create a new job posting</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-danger dark:bg-red-950">{error}</div>
        )}

        {/* --- Visibility --- */}
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

        {/* --- Basic Info --- */}
        <div className="rounded-lg border border-card-border p-4 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>
          <FormField type="text" label="Title" name="title" value={form.title} onChange={(v) => update('title', v)} required placeholder="Job title" />
          <FormField type="text" label="Company" name="company" value={form.company} onChange={(v) => update('company', v)} required placeholder="Company name" />
          <div className="grid grid-cols-2 gap-4">
            <FormField type="select" label="Job Type" name="job_type" value={form.job_type} onChange={(v) => update('job_type', v)} options={jobTypeOptions} required />
            <FormField type="select" label="Work Mode" name="work_mode" value={form.work_mode} onChange={(v) => update('work_mode', v)} options={workModeOptions} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField type="select" label="Category" name="category" value={form.category} onChange={(v) => update('category', v)} options={categoryOptions} />
            <FormField type="select" label="Experience Level" name="experience_level" value={form.experience_level} onChange={(v) => update('experience_level', v)} options={experienceLevelOptions} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <LocationInput label="Location" name="location" value={form.location} onChange={(v) => update('location', v)} placeholder="e.g. Bengaluru, Delhi, Online…" />
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Salary Range</label>
              <SalaryInput value={form.salary_range} onChange={(v) => update('salary_range', v)} />
            </div>
          </div>
          <DateTimePicker label="Deadline" name="deadline" value={form.deadline} onChange={(v) => update('deadline', v)} />
        </div>

        {/* --- Company Details --- */}
        <div className="rounded-lg border border-card-border p-4 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Company Details</h2>
          <FormField type="url" label="Company Website" name="company_website" value={form.company_website} onChange={(v) => update('company_website', v)} placeholder="https://example.com" />
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Company Logo URL</label>
            <div className="flex gap-2">
              <input type="url" value={form.company_logo_url} onChange={(e) => update('company_logo_url', e.target.value)} placeholder="https://example.com/logo.png" className="flex-1 rounded-lg border border-card-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              <button type="button" onClick={fetchLogoFromWebsite} disabled={fetchingLogo || !form.company_website.trim()} className="rounded-lg bg-primary/10 border border-primary/30 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap">
                {fetchingLogo ? 'Fetching...' : 'Fetch from Website'}
              </button>
            </div>
          </div>
        </div>

        {/* --- Details --- */}
        <div className="rounded-lg border border-card-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Details</h2>
            <span className="text-xs text-muted">AI can generate content based on the info above</span>
          </div>
          {(['description', 'responsibilities', 'requirements', 'benefits'] as const).map((field) => (
            <div key={field} className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">{field === 'benefits' ? 'Benefits & Perks' : field.charAt(0).toUpperCase() + field.slice(1)}</label>
                <AiFieldButton field={field} type="job" context={{ title: form.title, company: form.company, category: form.category, job_type: form.job_type, experience_level: form.experience_level }} onGenerated={(text) => update(field, text)} disabled={!form.title} />
              </div>
              <FormField type="textarea" label="" name={field} value={form[field]} onChange={(v) => update(field, v)} placeholder="" rows={field === 'description' ? 5 : field === 'benefits' ? 3 : 4} />
            </div>
          ))}
        </div>

        {/* --- Skills --- */}
        <div className="rounded-lg border border-card-border p-4 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Skills Required</h2>
          <SkillsInput value={form.skills_required} onChange={(skills) => update('skills_required', skills)} />
        </div>

        {/* --- Contact --- */}
        <div className="rounded-lg border border-card-border p-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">Contact</h2>
          <FormField type="email" label="Contact Email" name="contact_email" value={form.contact_email} onChange={(v) => update('contact_email', v)} placeholder="hr@example.com" />
        </div>

        <FormField type="checkbox" label="Active" name="is_active" checked={form.is_active} onChange={(v) => update('is_active', v)} />

        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={loading} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Job'}
          </button>
          <button type="button" onClick={() => router.back()} className="rounded-lg border border-card-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card-border/30">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
