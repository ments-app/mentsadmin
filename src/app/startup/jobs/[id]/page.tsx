'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FormField from '@/components/FormField';
import DateTimePicker from '@/components/DateTimePicker';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import AiFieldButton from '@/components/AiFieldButton';
import { getJob, updateJob, deleteJob } from '@/actions/jobs';
import { getMyApprovedFacilitators } from '@/actions/startup-portal';
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

export default function StartupEditJobPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [error, setError] = useState('');
  const [fetchingLogo, setFetchingLogo] = useState(false);
  const [facilitators, setFacilitators] = useState<Facilitator[]>([]);
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
    apply_url: '',
    apply_email: '',
    visibility: 'public' as 'public' | 'facilitator_only',
    target_facilitator_ids: [] as string[],
  });

  useEffect(() => {
    Promise.all([
      getJob(id),
      getMyApprovedFacilitators(),
    ]).then(([data, facs]) => {
      setFacilitators(facs);
      setForm({
        title: data.title,
        company: data.company,
        description: data.description ?? '',
        location: data.location ?? '',
        salary_range: data.salary_range ?? '',
        job_type: data.job_type,
        requirements: data.requirements ?? '',
        deadline: data.deadline ? data.deadline.slice(0, 16) : '',
        is_active: data.is_active,
        company_logo_url: data.company_logo_url ?? '',
        company_website: data.company_website ?? '',
        experience_level: data.experience_level ?? 'any',
        skills_required: data.skills_required ?? [],
        benefits: data.benefits ?? '',
        responsibilities: data.responsibilities ?? '',
        category: data.category ?? 'other',
        work_mode: data.work_mode ?? 'onsite',
        contact_email: data.contact_email ?? '',
        apply_url: data.apply_url ?? '',
        apply_email: data.apply_email ?? '',
        visibility: (data.visibility ?? 'public') as 'public' | 'facilitator_only',
        target_facilitator_ids: (data as any).target_facilitator_ids ?? [],
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
      await updateJob(id, form);
      router.push('/startup/jobs');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteJob(id);
      router.push('/startup/jobs');
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
          <h1 className="text-2xl font-bold text-foreground">Edit Job</h1>
          <p className="mt-1 text-muted">Update job posting details</p>
        </div>
        <button
          onClick={() => setShowDelete(true)}
          className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-danger-hover"
        >
          Delete
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-danger dark:bg-red-950">{error}</div>
        )}

        {/* --- Posting Visibility --- */}
        <div className="rounded-lg border border-card-border p-4 space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Visibility</h2>
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
                <p className="text-xs text-muted mt-0.5">Visible to everyone</p>
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
                <p className="text-xs text-muted mt-0.5">Only your approved facilitators</p>
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
