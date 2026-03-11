'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import FormField from '@/components/FormField';
import DateTimePicker from '@/components/DateTimePicker';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { getJob, updateJob, deleteJob } from '@/actions/jobs';
import AiFieldButton from '@/components/AiFieldButton';
import SkillsInput from '@/components/SkillsInput';
import SalaryInput from '@/components/SalaryInput';
import LocationInput from '@/components/LocationInput';
import { ArrowLeft } from 'lucide-react';

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

export default function EditJobPage() {
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
    company: '',
    description: '',
    location: '',
    salary_range: '',
    job_type: 'full-time',
    requirements: '',
    deadline: '',
    is_active: true,
    // New fields
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
  });

  useEffect(() => {
    getJob(id).then((data) => {
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
        // New fields
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
    setSaving(true);

    try {
      await updateJob(id, form);
      router.push('/dashboard/jobs');
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
      router.push('/dashboard/jobs');
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl animate-fade-in">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-card-border" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-card-border" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in mx-auto max-w-2xl">
      {/* Breadcrumb */}
      <Link href="/dashboard/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors mb-4">
        <ArrowLeft size={15} />
        Back to Jobs
      </Link>

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Edit Job</h1>
          <p className="mt-1 text-sm text-muted">Update job posting details</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/jobs/${id}/applications`}
            className="btn-secondary"
          >
            View Applications
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
          <h2 className="text-base font-semibold text-foreground">Basic Information</h2>
          <FormField type="text" label="Title" name="title" value={form.title}
            onChange={(v) => update('title', v)} required placeholder="Job title" />
          <FormField type="text" label="Company" name="company" value={form.company}
            onChange={(v) => update('company', v)} required placeholder="Company name" />
          <div className="grid grid-cols-2 gap-4">
            <FormField type="select" label="Job Type" name="job_type" value={form.job_type}
              onChange={(v) => update('job_type', v)} options={jobTypeOptions} required />
            <FormField type="select" label="Work Mode" name="work_mode" value={form.work_mode}
              onChange={(v) => update('work_mode', v)} options={workModeOptions} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField type="select" label="Category" name="category" value={form.category}
              onChange={(v) => update('category', v)} options={categoryOptions} />
            <FormField type="select" label="Experience Level" name="experience_level" value={form.experience_level}
              onChange={(v) => update('experience_level', v)} options={experienceLevelOptions} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <LocationInput label="Location" name="location" value={form.location} onChange={(v) => update('location', v)} placeholder="e.g. Bengaluru, Delhi, Online..." />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Salary Range</label>
              <SalaryInput value={form.salary_range} onChange={(v) => update('salary_range', v)} />
            </div>
          </div>
          <DateTimePicker label="Deadline" name="deadline" value={form.deadline} onChange={(v) => update('deadline', v)} />
        </section>

        {/* Company Details */}
        <section className="card-elevated rounded-xl p-6 space-y-5">
          <h2 className="text-base font-semibold text-foreground">Company Details</h2>
          <FormField type="url" label="Company Website" name="company_website" value={form.company_website}
            onChange={(v) => update('company_website', v)} placeholder="https://example.com" />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Company Logo URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={form.company_logo_url}
                onChange={(e) => update('company_logo_url', e.target.value)}
                placeholder="https://example.com/logo.png"
                className="flex-1 rounded-xl border border-card-border bg-background px-3.5 py-2.5 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all"
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
        </section>

        {/* Description & Requirements */}
        <section className="card-elevated rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Details</h2>
            <span className="text-xs text-muted bg-primary/5 px-2.5 py-1 rounded-full">AI can generate content</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Description</label>
              <AiFieldButton
                field="description" type="job"
                context={{ title: form.title, company: form.company, category: form.category, job_type: form.job_type, experience_level: form.experience_level, location: form.location, work_mode: form.work_mode, company_website: form.company_website }}
                onGenerated={(text) => update('description', text)} disabled={!form.title}
              />
            </div>
            <FormField type="textarea" label="" name="description" value={form.description}
              onChange={(v) => update('description', v)} placeholder="Describe the role, team, and what the company does..." rows={5} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Responsibilities</label>
              <AiFieldButton
                field="responsibilities" type="job"
                context={{ title: form.title, company: form.company, category: form.category, experience_level: form.experience_level, description: form.description, skills_required: form.skills_required.join(', ') }}
                onGenerated={(text) => update('responsibilities', text)} disabled={!form.title}
              />
            </div>
            <FormField type="textarea" label="" name="responsibilities" value={form.responsibilities}
              onChange={(v) => update('responsibilities', v)} placeholder="What will the candidate be doing day-to-day..." rows={4} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Requirements</label>
              <AiFieldButton
                field="requirements" type="job"
                context={{ title: form.title, company: form.company, category: form.category, experience_level: form.experience_level, description: form.description, skills_required: form.skills_required.join(', ') }}
                onGenerated={(text) => update('requirements', text)} disabled={!form.title}
              />
            </div>
            <FormField type="textarea" label="" name="requirements" value={form.requirements}
              onChange={(v) => update('requirements', v)} placeholder="Required qualifications, experience, education..." rows={4} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Benefits & Perks</label>
              <AiFieldButton
                field="benefits" type="job"
                context={{ title: form.title, company: form.company, job_type: form.job_type, work_mode: form.work_mode }}
                onGenerated={(text) => update('benefits', text)} disabled={!form.title}
              />
            </div>
            <FormField type="textarea" label="" name="benefits" value={form.benefits}
              onChange={(v) => update('benefits', v)} placeholder="Health insurance, equity, PTO, flexible hours..." rows={3} />
          </div>
        </section>

        {/* Skills */}
        <section className="card-elevated rounded-xl p-6 space-y-5">
          <h2 className="text-base font-semibold text-foreground">Skills Required</h2>
          <SkillsInput value={form.skills_required} onChange={(skills) => update('skills_required', skills)} />
        </section>

        {/* Contact */}
        <section className="card-elevated rounded-xl p-6 space-y-5">
          <h2 className="text-base font-semibold text-foreground">Contact</h2>
          <FormField type="email" label="Contact Email" name="contact_email" value={form.contact_email}
            onChange={(v) => update('contact_email', v)} placeholder="hr@example.com" />
        </section>

        {/* Status */}
        <div className="card-elevated rounded-xl p-6">
          <FormField type="checkbox" label="Active" name="is_active" checked={form.is_active}
            onChange={(v) => update('is_active', v)} />
        </div>

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
