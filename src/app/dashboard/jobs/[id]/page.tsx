'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import FormField from '@/components/FormField';
import DateTimePicker from '@/components/DateTimePicker';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { getJob, updateJob, deleteJob } from '@/actions/jobs';
import AiFieldButton from '@/components/AiFieldButton';

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
  const [skillInput, setSkillInput] = useState('');
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

  function addSkill() {
    const skill = skillInput.trim();
    if (skill && !form.skills_required.includes(skill)) {
      update('skills_required', [...form.skills_required, skill]);
      setSkillInput('');
    }
  }

  function removeSkill(skill: string) {
    update('skills_required', form.skills_required.filter((s) => s !== skill));
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
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/jobs/${id}/applications`}
            className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            View Applications
          </Link>
          <button
            onClick={() => setShowDelete(true)}
            className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-danger-hover"
          >
            Delete
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-danger dark:bg-red-950">
            {error}
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
            <FormField
              type="text"
              label="Location"
              name="location"
              value={form.location}
              onChange={(v) => update('location', v)}
              placeholder="e.g. San Francisco, CA"
            />
            <FormField
              type="text"
              label="Salary Range"
              name="salary_range"
              value={form.salary_range}
              onChange={(v) => update('salary_range', v)}
              placeholder="e.g. $80k - $120k"
            />
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
          <div className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder="Type a skill and press Enter"
              className="flex-1 rounded-lg border border-card-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={addSkill}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Add
            </button>
          </div>
          {form.skills_required.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.skills_required.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="ml-0.5 text-purple-500 hover:text-purple-700"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* --- Application --- */}
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
            disabled={saving}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
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

      <DeleteConfirmModal
        open={showDelete}
        title={form.title}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        loading={deleting}
      />
    </div>
  );
}
