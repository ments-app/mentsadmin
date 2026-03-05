'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FormField from '@/components/FormField';
import DateTimePicker from '@/components/DateTimePicker';
import { createJob } from '@/actions/jobs';
import { createStartupJob } from '@/actions/startup-portal';
import { createFacilitatorJob } from '@/actions/facilitators';
import { getMyAdminRole } from '@/actions/rbac';
import { supabase } from '@/lib/supabase';
import AiFieldButton from '@/components/AiFieldButton';
import { Globe, Lock } from 'lucide-react';
import SkillsInput from '@/components/SkillsInput';
import SalaryInput from '@/components/SalaryInput';
import LocationInput from '@/components/LocationInput';

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

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchingLogo, setFetchingLogo] = useState(false);
  const [userRole, setUserRole] = useState<'startup' | 'facilitator' | 'superadmin' | null>(null);
  const [form, setForm] = useState({
    title: '',
    company: '',
    description: '',
    location: '',
    salary_range: '',
    job_type: 'full-time',
    requirements: '',
    deadline: '',
    is_active: true,
    company_logo_url: '',
    company_website: '',
    experience_level: 'any',
    skills_required: [] as string[],
    benefits: '',
    responsibilities: '',
    category: 'other',
    work_mode: 'onsite',
    contact_email: '',
    visibility: 'public' as 'public' | 'facilitator_only',
  });

  useEffect(() => {
    getMyAdminRole().then((role) => setUserRole(role));
  }, []);

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
      if (userRole === 'startup') {
        await createStartupJob({
          title: form.title,
          company: form.company,
          description: form.description,
          location: form.location,
          salary_range: form.salary_range,
          job_type: form.job_type,
          requirements: form.requirements,
          deadline: form.deadline,
          skills_required: form.skills_required,
          experience_level: form.experience_level,
          category: form.category,
          work_mode: form.work_mode,
          contact_email: form.contact_email,
          visibility: form.visibility,
        });
        router.push('/startup/jobs');
      } else if (userRole === 'facilitator') {
        await createFacilitatorJob({
          title: form.title,
          company: form.company,
          description: form.description,
          location: form.location,
          salary_range: form.salary_range,
          job_type: form.job_type,
          requirements: form.requirements,
          deadline: form.deadline,
          skills_required: form.skills_required,
          experience_level: form.experience_level,
          category: form.category,
          work_mode: form.work_mode,
          contact_email: form.contact_email,
          company_logo_url: form.company_logo_url,
          company_website: form.company_website,
          benefits: form.benefits,
          responsibilities: form.responsibilities,
          is_active: form.is_active,
        });
        router.push('/facilitator/jobs');
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        await createJob({ ...form, created_by: user.id });
        router.push('/dashboard/jobs');
      }
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
          <div className="rounded-lg bg-red-50 p-3 text-sm text-danger dark:bg-red-950">
            {error}
          </div>
        )}

        {/* --- Posting Visibility (startups only) --- */}
        {userRole === 'startup' && (
          <div className="rounded-lg border border-card-border p-4 space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Where to Post</h2>
            <p className="text-sm text-muted">Choose who can see and apply to this job.</p>
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
                  <p className="text-xs text-muted mt-0.5">Shared only with facilitators who approved you</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* --- Basic Info --- */}
        <div className="rounded-lg border border-card-border p-4 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>
          <FormField
            type="text"
            label="Title"
            name="title"
            value={form.title}
            onChange={(v) => update('title', v)}
            required
            placeholder="Job title"
          />
          <FormField
            type="text"
            label="Company"
            name="company"
            value={form.company}
            onChange={(v) => update('company', v)}
            required
            placeholder="Company name"
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              type="select"
              label="Job Type"
              name="job_type"
              value={form.job_type}
              onChange={(v) => update('job_type', v)}
              options={jobTypeOptions}
              required
            />
            <FormField
              type="select"
              label="Work Mode"
              name="work_mode"
              value={form.work_mode}
              onChange={(v) => update('work_mode', v)}
              options={workModeOptions}
            />
          </div>
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
            <LocationInput label="Location" name="location" value={form.location} onChange={(v) => update('location', v)} placeholder="e.g. Bengaluru, Delhi, Online…" />
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Salary Range</label>
              <SalaryInput value={form.salary_range} onChange={(v) => update('salary_range', v)} />
            </div>
          </div>
          <DateTimePicker
            label="Deadline"
            name="deadline"
            value={form.deadline}
            onChange={(v) => update('deadline', v)}
          />
        </div>

        {/* --- Company Details --- */}
        <div className="rounded-lg border border-card-border p-4 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Company Details</h2>
          <FormField
            type="url"
            label="Company Website"
            name="company_website"
            value={form.company_website}
            onChange={(v) => update('company_website', v)}
            placeholder="https://example.com"
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Company Logo URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={form.company_logo_url}
                onChange={(e) => update('company_logo_url', e.target.value)}
                placeholder="https://example.com/logo.png"
                className="flex-1 rounded-lg border border-card-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={fetchLogoFromWebsite}
                disabled={fetchingLogo || !form.company_website.trim()}
                className="rounded-lg bg-primary/10 border border-primary/30 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {fetchingLogo ? 'Fetching...' : 'Fetch from Website'}
              </button>
            </div>
            {form.company_logo_url && (
              <div className="mt-3 flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg border border-card-border bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
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

        {/* --- Description & Requirements --- */}
        <div className="rounded-lg border border-card-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Details</h2>
            <span className="text-xs text-muted">AI can generate content based on the info above</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Description</label>
              <AiFieldButton
                field="description"
                type="job"
                context={{ title: form.title, company: form.company, category: form.category, job_type: form.job_type, experience_level: form.experience_level, location: form.location, work_mode: form.work_mode, company_website: form.company_website }}
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
              placeholder="Describe the role, team, and what the company does..."
              rows={5}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Responsibilities</label>
              <AiFieldButton
                field="responsibilities"
                type="job"
                context={{ title: form.title, company: form.company, category: form.category, experience_level: form.experience_level, description: form.description, skills_required: form.skills_required.join(', ') }}
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
              placeholder="What will the candidate be doing day-to-day..."
              rows={4}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Requirements</label>
              <AiFieldButton
                field="requirements"
                type="job"
                context={{ title: form.title, company: form.company, category: form.category, experience_level: form.experience_level, description: form.description, skills_required: form.skills_required.join(', ') }}
                onGenerated={(text) => update('requirements', text)}
                disabled={!form.title}
              />
            </div>
            <FormField
              type="textarea"
              label=""
              name="requirements"
              value={form.requirements}
              onChange={(v) => update('requirements', v)}
              placeholder="Required qualifications, experience, education..."
              rows={4}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Benefits & Perks</label>
              <AiFieldButton
                field="benefits"
                type="job"
                context={{ title: form.title, company: form.company, job_type: form.job_type, work_mode: form.work_mode }}
                onGenerated={(text) => update('benefits', text)}
                disabled={!form.title}
              />
            </div>
            <FormField
              type="textarea"
              label=""
              name="benefits"
              value={form.benefits}
              onChange={(v) => update('benefits', v)}
              placeholder="Health insurance, equity, PTO, flexible hours..."
              rows={3}
            />
          </div>
        </div>

        {/* --- Skills --- */}
        <div className="rounded-lg border border-card-border p-4 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Skills Required</h2>
          <SkillsInput value={form.skills_required} onChange={(skills) => update('skills_required', skills)} />
        </div>

        {/* --- Contact --- */}
        <div className="rounded-lg border border-card-border p-4 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Contact</h2>
          <FormField
            type="email"
            label="Contact Email"
            name="contact_email"
            value={form.contact_email}
            onChange={(v) => update('contact_email', v)}
            placeholder="hr@example.com"
          />
        </div>

        {/* --- Status --- */}
        <FormField
          type="checkbox"
          label="Active"
          name="is_active"
          checked={form.is_active}
          onChange={(v) => update('is_active', v)}
        />

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Job'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-card-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card-border/30"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
