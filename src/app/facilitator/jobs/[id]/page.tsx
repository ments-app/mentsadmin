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
import SalaryInput from '@/components/SalaryInput';
import LocationInput from '@/components/LocationInput';
import { getJob, updateJob, deleteJob } from '@/actions/jobs';
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

export default function FacilitatorEditJobPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [error, setError] = useState('');
  const [fetchingLogo, setFetchingLogo] = useState(false);
  const [isStartupJob, setIsStartupJob] = useState(false);
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
    visibility: 'public' as 'public' | 'email_restricted',
  });

  useEffect(() => {
    getJob(id).then((data) => {
      setIsStartupJob(!!data.startup_id);
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
        visibility: (data.visibility ?? 'public') as 'public' | 'email_restricted',
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
      router.push('/facilitator/jobs');
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
      router.push('/facilitator/jobs');
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl animate-fade-in">
        <div className="h-8 w-48 skeleton-shimmer rounded-lg" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 skeleton-shimmer rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {isStartupJob ? 'View Job' : 'Edit Job'}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {isStartupJob ? 'Job posted by a startup in your network' : 'Update job posting details'}
          </p>
        </div>
        {!isStartupJob && (
          <button onClick={() => setShowDelete(true)} className="btn-danger">
            Delete
          </button>
        )}
      </div>

      <form onSubmit={isStartupJob ? undefined : handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-danger dark:bg-red-950">{error}</div>
        )}

        {isStartupJob && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
            This job was posted by a startup. You can view but not edit it.
          </div>
        )}

        {/* --- Visibility --- */}
        {!isStartupJob && (
          <div className="card-elevated p-5 space-y-4">
            <h2 className="text-base font-semibold text-foreground">Who can see this?</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => update('visibility', 'public')}
                className={cn(
                  'flex flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition-all duration-150',
                  form.visibility === 'public'
                    ? 'border-primary bg-primary/5 shadow-sm'
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
                  'flex flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition-all duration-150',
                  form.visibility === 'email_restricted'
                    ? 'border-primary bg-primary/5 shadow-sm'
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
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
                Only students in your Access List will see this.{' '}
                <Link href="/facilitator/students" className="font-medium underline">
                  Manage Access List →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* --- Basic Info --- */}
        <div className="card-elevated p-5 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Basic Information</h2>
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
            <LocationInput label="Location" name="location" value={form.location} onChange={(v) => update('location', v)} placeholder="e.g. Bengaluru, Delhi, Online..." />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Salary Range</label>
              <SalaryInput value={form.salary_range} onChange={(v) => update('salary_range', v)} />
            </div>
          </div>
          <DateTimePicker label="Deadline" name="deadline" value={form.deadline} onChange={(v) => update('deadline', v)} />
        </div>

        {/* --- Details --- */}
        <div className="card-elevated p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Details</h2>
            {!isStartupJob && <span className="text-xs text-muted">AI can generate content based on the info above</span>}
          </div>
          {(['description', 'responsibilities', 'requirements', 'benefits'] as const).map((field) => (
            <div key={field} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">{field === 'benefits' ? 'Benefits & Perks' : field.charAt(0).toUpperCase() + field.slice(1)}</label>
                {!isStartupJob && <AiFieldButton field={field} type="job" context={{ title: form.title, company: form.company }} onGenerated={(text) => update(field, text)} disabled={!form.title} />}
              </div>
              <FormField type="textarea" label="" name={field} value={form[field]} onChange={(v) => update(field, v)} placeholder="" rows={field === 'description' ? 5 : field === 'benefits' ? 3 : 4} />
            </div>
          ))}
        </div>

        {/* --- Skills --- */}
        <div className="card-elevated p-5 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Skills Required</h2>
          {isStartupJob ? (
            form.skills_required.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {form.skills_required.map((skill) => (
                  <span key={skill} className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No skills listed</p>
            )
          ) : (
            <SkillsInput value={form.skills_required} onChange={(skills) => update('skills_required', skills)} />
          )}
        </div>

        {!isStartupJob && (
          <>
            <FormField type="checkbox" label="Active" name="is_active" checked={form.is_active} onChange={(v) => update('is_active', v)} />
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary py-2.5 px-6">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => router.back()} className="btn-secondary py-2.5 px-6">
                Cancel
              </button>
            </div>
          </>
        )}

        {isStartupJob && (
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => router.back()} className="btn-secondary py-2.5 px-6">
              Back
            </button>
          </div>
        )}
      </form>

      {!isStartupJob && (
        <DeleteConfirmModal open={showDelete} title={form.title} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} loading={deleting} />
      )}
    </div>
  );
}
