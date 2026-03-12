'use client';

import { useEffect, useState } from 'react';
import { Building2, Globe, Mail, MapPin, RefreshCw, Save, ShieldCheck } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import { getMyFacilitatorPublicProfile, updateMyFacilitatorPublicProfile } from '@/actions/facilitator-profile';

const ORG_TYPES = [
  { value: 'ecell', label: 'E-Cell' },
  { value: 'incubator', label: 'Incubator' },
  { value: 'accelerator', label: 'Accelerator' },
  { value: 'college_cell', label: 'College Cell' },
  { value: 'other', label: 'Other' },
] as const;

const SECTOR_OPTIONS = [
  'Technology', 'Healthcare', 'Fintech', 'EdTech', 'E-Commerce', 'SaaS',
  'AI/ML', 'IoT', 'CleanTech', 'AgriTech', 'Social Impact', 'Media',
  'Logistics', 'Real Estate', 'Gaming', 'FoodTech', 'Other',
];

const STAGE_OPTIONS = ['Ideation', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Growth', 'All Stages'];
const SUPPORT_OPTIONS = [
  'Mentorship', 'Funding', 'Workspace', 'Networking', 'Legal Support',
  'Marketing', 'Technical Support', 'Recruitment', 'IP Support', 'Market Access',
];

type FormState = {
  organisation_name: string;
  organisation_address: string;
  organisation_type: 'ecell' | 'incubator' | 'accelerator' | 'college_cell' | 'other';
  official_email: string;
  poc_name: string;
  contact_number: string;
  website: string;
  slug: string;
  short_bio: string;
  public_description: string;
  logo_url: string;
  banner_url: string;
  city: string;
  state: string;
  country: string;
  university_name: string;
  sectors: string[];
  stage_focus: string[];
  support_types: string[];
  is_published: boolean;
};

const emptyForm: FormState = {
  organisation_name: '',
  organisation_address: '',
  organisation_type: 'other',
  official_email: '',
  poc_name: '',
  contact_number: '',
  website: '',
  slug: '',
  short_bio: '',
  public_description: '',
  logo_url: '',
  banner_url: '',
  city: '',
  state: '',
  country: '',
  university_name: '',
  sectors: [],
  stage_focus: [],
  support_types: [],
  is_published: false,
};

function ChipGroup({
  options,
  value,
  onToggle,
}: {
  options: string[];
  value: string[];
  onToggle: (item: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? 'bg-primary text-white'
                : 'border border-card-border bg-background text-muted hover:border-primary hover:text-primary'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export default function FacilitatorProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<string>('');
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await getMyFacilitatorPublicProfile();
        setVerificationStatus(data.profile.verification_status);
        setForm({
          organisation_name: data.facilitatorProfile.organisation_name ?? '',
          organisation_address: data.facilitatorProfile.organisation_address ?? '',
          organisation_type: data.facilitatorProfile.organisation_type ?? 'other',
          official_email: data.facilitatorProfile.official_email ?? '',
          poc_name: data.facilitatorProfile.poc_name ?? '',
          contact_number: data.facilitatorProfile.contact_number ?? '',
          website: data.facilitatorProfile.website ?? '',
          slug: data.facilitatorProfile.slug ?? '',
          short_bio: data.facilitatorProfile.short_bio ?? '',
          public_description: data.facilitatorProfile.public_description ?? '',
          logo_url: data.facilitatorProfile.logo_url ?? '',
          banner_url: data.facilitatorProfile.banner_url ?? '',
          city: data.facilitatorProfile.city ?? '',
          state: data.facilitatorProfile.state ?? '',
          country: data.facilitatorProfile.country ?? '',
          university_name: data.facilitatorProfile.university_name ?? '',
          sectors: data.facilitatorProfile.sectors ?? [],
          stage_focus: data.facilitatorProfile.stage_focus ?? [],
          support_types: data.facilitatorProfile.support_types ?? [],
          is_published: data.facilitatorProfile.is_published ?? false,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load facilitator profile');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggle(field: 'sectors' | 'stage_focus' | 'support_types', item: string) {
    setForm((current) => ({
      ...current,
      [field]: current[field].includes(item)
        ? current[field].filter((value) => value !== item)
        : [...current[field], item],
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateMyFacilitatorPublicProfile(form);
      setSuccess('Facilitator profile updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save facilitator profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <RefreshCw size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Facilitator Profile</h1>
          <p className="mt-1 text-sm text-muted">
            Manage the shared facilitator record used for verification and public display.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-card-border bg-card-bg px-3 py-1.5 text-xs font-medium text-muted">
            Verification: <span className="capitalize text-foreground">{verificationStatus}</span>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !form.organisation_name.trim()}
            className="btn-primary gap-2"
          >
            <Save size={15} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-danger dark:bg-red-950">{error}</div>}
      {success && <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">{success}</div>}

      <div className="rounded-2xl border border-card-border bg-card-bg p-6">
        <div className="mb-5 flex items-center gap-2">
          <ShieldCheck size={16} className="text-primary" />
          <h2 className="text-base font-semibold text-foreground">Verification Record</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Organisation Name">
            <input className={inputCls} value={form.organisation_name} onChange={(e) => update('organisation_name', e.target.value)} />
          </Field>
          <Field label="Organisation Type">
            <select className={inputCls} value={form.organisation_type} onChange={(e) => update('organisation_type', e.target.value as FormState['organisation_type'])}>
              {ORG_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Official Email">
            <input className={inputCls} type="email" value={form.official_email} onChange={(e) => update('official_email', e.target.value)} />
          </Field>
          <Field label="Contact Number">
            <input className={inputCls} value={form.contact_number} onChange={(e) => update('contact_number', e.target.value)} />
          </Field>
          <Field label="Point of Contact">
            <input className={inputCls} value={form.poc_name} onChange={(e) => update('poc_name', e.target.value)} />
          </Field>
          <Field label="Website">
            <input className={inputCls} type="url" value={form.website} onChange={(e) => update('website', e.target.value)} />
          </Field>
        </div>
        <Field label="Organisation Address" className="mt-4">
          <textarea className={inputCls} rows={3} value={form.organisation_address} onChange={(e) => update('organisation_address', e.target.value)} />
        </Field>
      </div>

      <div className="rounded-2xl border border-card-border bg-card-bg p-6">
        <div className="mb-5 flex items-center gap-2">
          <Building2 size={16} className="text-primary" />
          <h2 className="text-base font-semibold text-foreground">Public App Profile</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ImageUpload label="Logo" name="logo_url" value={form.logo_url} onChange={(url) => update('logo_url', url)} />
          <ImageUpload label="Banner" name="banner_url" value={form.banner_url} onChange={(url) => update('banner_url', url)} />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Public Slug">
            <input className={inputCls} value={form.slug} onChange={(e) => update('slug', e.target.value)} placeholder="ments-incubator" />
          </Field>
          <Field label="Short Bio">
            <input className={inputCls} value={form.short_bio} onChange={(e) => update('short_bio', e.target.value)} placeholder="1-line summary" />
          </Field>
        </div>

        <Field label="Public Description" className="mt-4">
          <textarea
            className={inputCls}
            rows={5}
            value={form.public_description}
            onChange={(e) => update('public_description', e.target.value)}
            placeholder="Describe your startup support, thesis, and ecosystem."
          />
        </Field>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="City">
            <input className={inputCls} value={form.city} onChange={(e) => update('city', e.target.value)} />
          </Field>
          <Field label="State">
            <input className={inputCls} value={form.state} onChange={(e) => update('state', e.target.value)} />
          </Field>
          <Field label="Country">
            <input className={inputCls} value={form.country} onChange={(e) => update('country', e.target.value)} />
          </Field>
          <Field label="University Name">
            <input className={inputCls} value={form.university_name} onChange={(e) => update('university_name', e.target.value)} />
          </Field>
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Sectors</p>
            <ChipGroup options={SECTOR_OPTIONS} value={form.sectors} onToggle={(item) => toggle('sectors', item)} />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Stage Focus</p>
            <ChipGroup options={STAGE_OPTIONS} value={form.stage_focus} onToggle={(item) => toggle('stage_focus', item)} />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Support Types</p>
            <ChipGroup options={SUPPORT_OPTIONS} value={form.support_types} onToggle={(item) => toggle('support_types', item)} />
          </div>
        </div>

        <label className="mt-6 flex items-center justify-between rounded-xl border border-card-border bg-background px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Publish this facilitator profile</p>
            <p className="text-xs text-muted">Only publish after your public-facing details are ready.</p>
          </div>
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => update('is_published', e.target.checked)}
            className="h-4 w-4 rounded border-card-border text-primary focus:ring-primary"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard icon={<Globe size={16} className="text-primary" />} label="Public URL" value={form.slug ? `/facilitators/${form.slug}` : 'Not set'} />
        <InfoCard icon={<Mail size={16} className="text-primary" />} label="Contact Email" value={form.official_email || 'Not set'} />
        <InfoCard icon={<MapPin size={16} className="text-primary" />} label="Location" value={[form.city, form.state, form.country].filter(Boolean).join(', ') || 'Not set'} />
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

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-card-border bg-card-bg p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
        {icon}
      </div>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20';
