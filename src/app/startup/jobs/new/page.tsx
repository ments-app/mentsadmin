'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FormField from '@/components/FormField';
import DateTimePicker from '@/components/DateTimePicker';
import AiFieldButton from '@/components/AiFieldButton';
import { createStartupJob, getMyApprovedFacilitators } from '@/actions/startup-portal';
import { Globe, Lock } from 'lucide-react';
import SkillsInput from '@/components/SkillsInput';
import SalaryInput from '@/components/SalaryInput';
import LocationInput from '@/components/LocationInput';

type Facilitator = { id: string; organisation_name: string | null; display_name: string; email: string };

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

export default function StartupNewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchingLogo, setFetchingLogo] = useState(false);
  const [facilitators, setFacilitators] = useState<Facilitator[]>([]);
  const [loadingFacilitators, setLoadingFacilitators] = useState(false);
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
    visibility: 'public' as 'public' | 'facilitator_only',
    target_facilitator_ids: [] as string[],
  });

  useEffect(() => {
    setLoadingFacilitators(true);
    getMyApprovedFacilitators().then((data) => {
      setFacilitators(data);
      setLoadingFacilitators(false);
    });
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
      await createStartupJob(form);
      router.push('/startup/jobs');
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

        {/* --- Posting Visibility --- */}
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

          {form.visibility === 'facilitator_only' && (
            <div className="mt-1 space-y-2 border-t border-card-border pt-3">
              <div>
                <p className="text-sm font-medium text-foreground">Select Facilitators</p>
                <p className="text-xs text-muted mt-0.5">Leave all unchecked to share with all your approved facilitators.</p>
              </div>
              {loadingFacilitators ? (
                <p className="text-sm text-muted animate-pulse">Loading facilitators...</p>
              ) : facilitators.length === 0 ? (
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
                  <img src={form.company_logo_url} alt="Logo preview" className="h-10 w-10 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <span className="text-xs text-muted truncate max-w-xs">{form.company_logo_url}</span>
              </div>
            )}
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
                <label className="text-sm font-medium text-foreground capitalize">{field === 'benefits' ? 'Benefits & Perks' : field.charAt(0).toUpperCase() + field.slice(1)}</label>
                <AiFieldButton
                  field={field}
                  type="job"
                  context={{ title: form.title, company: form.company, category: form.category, job_type: form.job_type, experience_level: form.experience_level, location: form.location, work_mode: form.work_mode }}
                  onGenerated={(text) => update(field, text)}
                  disabled={!form.title}
                />
              </div>
              <FormField
                type="textarea"
                label=""
                name={field}
                value={form[field]}
                onChange={(v) => update(field, v)}
                placeholder={
                  field === 'description' ? 'Describe the role and what your company does...' :
                  field === 'responsibilities' ? 'What will the candidate be doing day-to-day...' :
                  field === 'requirements' ? 'Required qualifications, experience, education...' :
                  'Health insurance, equity, PTO, flexible hours...'
                }
                rows={field === 'description' ? 5 : field === 'benefits' ? 3 : 4}
              />
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
