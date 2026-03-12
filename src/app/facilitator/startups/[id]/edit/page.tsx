'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, Users } from 'lucide-react';
import {
  getFacilitatorOwnedStartupProfile,
  updateFacilitatorOwnedStartupFounders,
  updateFacilitatorOwnedStartupProfile,
} from '@/actions/facilitator-startups';
import ImageUpload from '@/components/ImageUpload';

type FounderDraft = {
  name: string;
  role: string;
  email: string;
  linkedin_url: string;
};

type FounderRecord = {
  name: string | null;
  role: string | null;
  email: string | null;
  linkedin_url: string | null;
};

type FormState = {
  brand_name: string;
  legal_status: string;
  stage: string;
  description: string;
  startup_email: string;
  startup_phone: string;
  website: string;
  city: string;
  state: string;
  country: string;
  business_model: string;
  target_audience: string;
  traction_metrics: string;
  elevator_pitch: string;
  categories: string;
  keywords: string;
  logo_url: string;
  banner_url: string;
  is_published: boolean;
};

const LEGAL_STATUSES = [
  { value: 'llp', label: 'LLP' },
  { value: 'pvt_ltd', label: 'Pvt Ltd' },
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'not_registered', label: 'Not Registered' },
];

const STAGES = [
  { value: 'ideation', label: 'Ideation' },
  { value: 'mvp', label: 'MVP' },
  { value: 'scaling', label: 'Scaling' },
  { value: 'expansion', label: 'Expansion' },
  { value: 'maturity', label: 'Maturity' },
];

export default function FacilitatorStartupEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<FormState | null>(null);
  const [founders, setFounders] = useState<FounderDraft[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const profile = await getFacilitatorOwnedStartupProfile(id);
        setForm({
          brand_name: profile.brand_name ?? '',
          legal_status: profile.legal_status ?? 'not_registered',
          stage: profile.stage ?? 'ideation',
          description: profile.description ?? '',
          startup_email: profile.startup_email ?? '',
          startup_phone: profile.startup_phone ?? '',
          website: profile.website ?? '',
          city: profile.city ?? '',
          state: profile.state ?? '',
          country: profile.country ?? '',
          business_model: profile.business_model ?? '',
          target_audience: profile.target_audience ?? '',
          traction_metrics: profile.traction_metrics ?? '',
          elevator_pitch: profile.elevator_pitch ?? '',
          categories: (profile.categories ?? []).join(', '),
          keywords: (profile.keywords ?? []).join(', '),
          logo_url: profile.logo_url ?? '',
          banner_url: profile.banner_url ?? '',
          is_published: profile.is_published ?? false,
        });
        setFounders(
          (profile.founders ?? []).map((founder: FounderRecord) => ({
            name: founder.name ?? '',
            role: founder.role ?? '',
            email: founder.email ?? '',
            linkedin_url: founder.linkedin_url ?? '',
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load startup');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => (current ? { ...current, [field]: value } : current));
  }

  function updateFounder(index: number, field: keyof FounderDraft, value: string) {
    setFounders((current) => current.map((founder, i) => (i === index ? { ...founder, [field]: value } : founder)));
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateFacilitatorOwnedStartupProfile(id, {
        brand_name: form.brand_name.trim(),
        legal_status: form.legal_status,
        stage: form.stage,
        description: form.description.trim() || null,
        startup_email: form.startup_email.trim() || null,
        startup_phone: form.startup_phone.trim() || null,
        website: form.website.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        country: form.country.trim() || null,
        business_model: form.business_model.trim() || null,
        target_audience: form.target_audience.trim() || null,
        traction_metrics: form.traction_metrics.trim() || null,
        elevator_pitch: form.elevator_pitch.trim() || null,
        categories: form.categories.split(',').map((item) => item.trim()).filter(Boolean),
        keywords: form.keywords.split(',').map((item) => item.trim()).filter(Boolean),
        logo_url: form.logo_url || null,
        banner_url: form.banner_url || null,
        is_published: form.is_published,
      });

      await updateFacilitatorOwnedStartupFounders(
        id,
        founders
          .map((founder, index) => ({
            ...founder,
            display_order: index,
          }))
          .filter((founder) => founder.name.trim())
      );

      setSuccess('Startup profile updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save startup profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href={`/facilitator/startups/${id}`} className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
            <ArrowLeft size={15} />
            Back to startup
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">Edit Startup Profile</h1>
          <p className="mt-1 text-sm text-muted">
            Complete onboarding details for startups currently managed under your facilitator account.
          </p>
        </div>
        <button type="button" onClick={handleSave} disabled={saving || !form.brand_name.trim()} className="btn-primary gap-2">
          <Save size={15} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-danger dark:bg-red-950">{error}</div>}
      {success && <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">{success}</div>}

      <div className="rounded-2xl border border-card-border bg-card-bg p-6">
        <h2 className="mb-5 text-base font-semibold text-foreground">Identity</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <ImageUpload label="Logo" name="logo_url" value={form.logo_url} onChange={(url) => update('logo_url', url)} />
          <ImageUpload label="Banner" name="banner_url" value={form.banner_url} onChange={(url) => update('banner_url', url)} />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Brand Name">
            <input className={inputCls} value={form.brand_name} onChange={(e) => update('brand_name', e.target.value)} />
          </Field>
          <Field label="Stage">
            <select className={inputCls} value={form.stage} onChange={(e) => update('stage', e.target.value)}>
              {STAGES.map((stage) => (
                <option key={stage.value} value={stage.value}>{stage.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Legal Status">
            <select className={inputCls} value={form.legal_status} onChange={(e) => update('legal_status', e.target.value)}>
              {LEGAL_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Description" className="mt-4">
          <textarea className={inputCls} rows={5} value={form.description} onChange={(e) => update('description', e.target.value)} />
        </Field>
      </div>

      <div className="rounded-2xl border border-card-border bg-card-bg p-6">
        <h2 className="mb-5 text-base font-semibold text-foreground">Contact and Market</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Startup Email">
            <input className={inputCls} type="email" value={form.startup_email} onChange={(e) => update('startup_email', e.target.value)} />
          </Field>
          <Field label="Startup Phone">
            <input className={inputCls} value={form.startup_phone} onChange={(e) => update('startup_phone', e.target.value)} />
          </Field>
          <Field label="Website">
            <input className={inputCls} type="url" value={form.website} onChange={(e) => update('website', e.target.value)} />
          </Field>
          <Field label="Business Model">
            <input className={inputCls} value={form.business_model} onChange={(e) => update('business_model', e.target.value)} />
          </Field>
          <Field label="City">
            <input className={inputCls} value={form.city} onChange={(e) => update('city', e.target.value)} />
          </Field>
          <Field label="State">
            <input className={inputCls} value={form.state} onChange={(e) => update('state', e.target.value)} />
          </Field>
          <Field label="Country">
            <input className={inputCls} value={form.country} onChange={(e) => update('country', e.target.value)} />
          </Field>
          <Field label="Target Audience">
            <input className={inputCls} value={form.target_audience} onChange={(e) => update('target_audience', e.target.value)} />
          </Field>
        </div>
        <Field label="Categories" className="mt-4">
          <input className={inputCls} value={form.categories} onChange={(e) => update('categories', e.target.value)} placeholder="Comma-separated" />
        </Field>
        <Field label="Keywords" className="mt-4">
          <input className={inputCls} value={form.keywords} onChange={(e) => update('keywords', e.target.value)} placeholder="Comma-separated" />
        </Field>
      </div>

      <div className="rounded-2xl border border-card-border bg-card-bg p-6">
        <h2 className="mb-5 text-base font-semibold text-foreground">Narrative</h2>
        <div className="grid gap-4">
          <Field label="Elevator Pitch">
            <textarea className={inputCls} rows={3} value={form.elevator_pitch} onChange={(e) => update('elevator_pitch', e.target.value)} />
          </Field>
          <Field label="Traction Metrics">
            <textarea className={inputCls} rows={4} value={form.traction_metrics} onChange={(e) => update('traction_metrics', e.target.value)} />
          </Field>
        </div>
        <label className="mt-5 flex items-center justify-between rounded-xl border border-card-border bg-background px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Publish startup profile</p>
            <p className="text-xs text-muted">Keep off until the startup is ready for public discovery.</p>
          </div>
          <input type="checkbox" checked={form.is_published} onChange={(e) => update('is_published', e.target.checked)} className="h-4 w-4" />
        </label>
      </div>

      <div className="rounded-2xl border border-card-border bg-card-bg p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-primary" />
            <h2 className="text-base font-semibold text-foreground">Founders</h2>
          </div>
          <button
            type="button"
            onClick={() => setFounders((current) => [...current, { name: '', role: '', email: '', linkedin_url: '' }])}
            className="rounded-lg border border-card-border px-3 py-2 text-sm font-medium text-foreground hover:border-primary hover:text-primary"
          >
            Add Founder
          </button>
        </div>

        <div className="space-y-4">
          {founders.length === 0 && (
            <p className="text-sm text-muted">Add founders now. Email-based cofounder invitations can be layered in later.</p>
          )}
          {founders.map((founder, index) => (
            <div key={index} className="grid gap-4 rounded-xl border border-card-border p-4 md:grid-cols-2">
              <Field label="Name">
                <input className={inputCls} value={founder.name} onChange={(e) => updateFounder(index, 'name', e.target.value)} />
              </Field>
              <Field label="Role">
                <input className={inputCls} value={founder.role} onChange={(e) => updateFounder(index, 'role', e.target.value)} />
              </Field>
              <Field label="Email">
                <input className={inputCls} type="email" value={founder.email} onChange={(e) => updateFounder(index, 'email', e.target.value)} />
              </Field>
              <Field label="LinkedIn URL">
                <input className={inputCls} value={founder.linkedin_url} onChange={(e) => updateFounder(index, 'linkedin_url', e.target.value)} />
              </Field>
              <button
                type="button"
                onClick={() => setFounders((current) => current.filter((_, i) => i !== index))}
                className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Remove Founder
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={() => router.push(`/facilitator/startups/${id}`)} className="btn-secondary">
          Cancel
        </button>
        <button type="button" onClick={handleSave} disabled={saving || !form.brand_name.trim()} className="btn-primary gap-2">
          <Save size={15} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  'w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20';
