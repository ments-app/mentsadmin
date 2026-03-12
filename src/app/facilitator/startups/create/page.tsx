'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Rocket, Upload } from 'lucide-react';
import { createFacilitatorStartupProfile } from '@/actions/facilitator-startups';
import ImageUpload from '@/components/ImageUpload';
import { supabase } from '@/lib/supabase';

const STAGES = [
  { value: 'ideation', label: 'Ideation' },
  { value: 'mvp', label: 'MVP' },
  { value: 'scaling', label: 'Scaling' },
  { value: 'expansion', label: 'Expansion' },
  { value: 'maturity', label: 'Maturity' },
];

const LEGAL_STATUSES = [
  { value: 'not_registered', label: 'Not Registered' },
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'llp', label: 'LLP' },
  { value: 'pvt_ltd', label: 'Pvt Ltd' },
];

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'investors_only', label: 'Investors Only' },
  { value: 'private', label: 'Private' },
];

const FUNDING_STAGES = [
  { value: '', label: 'Select stage' },
  { value: 'pre_seed', label: 'Pre-Seed' },
  { value: 'seed', label: 'Seed' },
  { value: 'series_a', label: 'Series A' },
  { value: 'series_b', label: 'Series B' },
  { value: 'series_c', label: 'Series C' },
  { value: 'bridge', label: 'Bridge' },
];

const REVENUE_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'SGD'];
const TEAM_SIZE_OPTIONS = ['Solo', '2-5', '6-10', '11-25', '26-50', '50+'];

const COUNTRY_OPTIONS = [
  'India',
  'United States',
  'United Kingdom',
  'Canada',
  'Singapore',
  'United Arab Emirates',
  'Australia',
  'Germany',
  'Other',
];

const INDIA_STATE_CITY_OPTIONS: Record<string, string[]> = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati'],
  Delhi: ['New Delhi', 'North Delhi', 'South Delhi', 'Dwarka', 'Rohini'],
  Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
  Haryana: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala'],
  Karnataka: ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi'],
  Kerala: ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur'],
  'Madhya Pradesh': ['Indore', 'Bhopal', 'Gwalior', 'Jabalpur'],
  Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Nashik'],
  Punjab: ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar'],
  Rajasthan: ['Jaipur', 'Udaipur', 'Jodhpur', 'Kota'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli'],
  Telangana: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar'],
  'Uttar Pradesh': ['Noida', 'Lucknow', 'Kanpur', 'Varanasi'],
  'West Bengal': ['Kolkata', 'Siliguri', 'Durgapur', 'Howrah'],
};

const CATEGORY_OPTIONS = [
  'Technology', 'Healthcare', 'Fintech', 'EdTech', 'E-Commerce', 'SaaS',
  'AI/ML', 'IoT', 'CleanTech', 'AgriTech', 'Social Impact', 'Media',
  'Logistics', 'Real Estate', 'Gaming', 'FoodTech', 'Other',
];

export default function FacilitatorCreateStartupPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [customCountry, setCustomCountry] = useState('');
  const [uploadingDeck, setUploadingDeck] = useState(false);
  const deckInputRef = useRef<HTMLInputElement>(null);
  const [founders, setFounders] = useState([
    { name: '', role: '', email: '', ments_username: '' },
  ]);
  const [form, setForm] = useState({
    brand_name: '',
    registered_name: '',
    legal_status: 'not_registered',
    cin: '',
    stage: 'ideation',
    description: '',
    startup_email: '',
    startup_phone: '',
    website: '',
    founded_date: '',
    pitch_deck_url: '',
    city: '',
    state: '',
    country: 'India',
    address_line1: '',
    address_line2: '',
    business_model: '',
    key_strengths: '',
    target_audience: '',
    elevator_pitch: '',
    revenue_amount: '',
    revenue_currency: 'INR',
    revenue_growth: '',
    traction_metrics: '',
    total_raised: '',
    investor_count: '',
    logo_url: '',
    banner_url: '',
    raise_target: '',
    equity_offered: '',
    min_ticket_size: '',
    funding_stage: '',
    team_size: '',
    sector: '',
    pitch_video_url: '',
    is_actively_raising: false,
    visibility: 'public',
    categories: [] as string[],
    keywords: '',
  });

  function update<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleCategory(category: string) {
    setForm((current) => ({
      ...current,
      categories: current.categories.includes(category)
        ? current.categories.filter((item) => item !== category)
        : [...current.categories, category],
    }));
  }

  function updateFounder(
    index: number,
    field: 'name' | 'role' | 'email' | 'ments_username',
    value: string
  ) {
    setFounders((current) =>
      current.map((founder, founderIndex) =>
        founderIndex === index ? { ...founder, [field]: value } : founder
      )
    );
  }

  const isIndia = form.country === 'India';
  const isCustomCountry = form.country === 'Other';
  const stateOptions = Object.keys(INDIA_STATE_CITY_OPTIONS);
  const cityOptions = isIndia && form.state ? (INDIA_STATE_CITY_OPTIONS[form.state] ?? []) : [];

  async function uploadMedia(file: File, path: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `${path}/${user.id}/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file, { contentType: file.type, upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('media').getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function handlePitchDeckUpload(file: File) {
    setUploadingDeck(true);
    setError('');
    try {
      const url = await uploadMedia(file, 'pitch-decks');
      update('pitch_deck_url', url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pitch deck upload failed');
    } finally {
      setUploadingDeck(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    if (!form.brand_name.trim()) {
      setError('Brand name is required');
      return;
    }

    if (!form.legal_status) {
      setError('Legal status is required');
      return;
    }

    if (isCustomCountry && !customCountry.trim()) {
      setError('Please enter the country name');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const { id } = await createFacilitatorStartupProfile({
        brand_name: form.brand_name,
        registered_name: form.registered_name || undefined,
        legal_status: form.legal_status as 'llp' | 'pvt_ltd' | 'sole_proprietorship' | 'not_registered',
        cin: form.cin || undefined,
        stage: form.stage,
        description: form.description || undefined,
        startup_email: form.startup_email || undefined,
        startup_phone: form.startup_phone || undefined,
        website: form.website || undefined,
        founded_date: form.founded_date || undefined,
        pitch_deck_url: form.pitch_deck_url || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        country: (isCustomCountry ? customCountry : form.country) || undefined,
        address_line1: form.address_line1 || undefined,
        address_line2: form.address_line2 || undefined,
        business_model: form.business_model || undefined,
        key_strengths: form.key_strengths || undefined,
        target_audience: form.target_audience || undefined,
        elevator_pitch: form.elevator_pitch || undefined,
        revenue_amount: form.revenue_amount || undefined,
        revenue_currency: form.revenue_currency || undefined,
        revenue_growth: form.revenue_growth || undefined,
        traction_metrics: form.traction_metrics || undefined,
        total_raised: form.total_raised || undefined,
        investor_count: form.investor_count ? Number(form.investor_count) : undefined,
        logo_url: form.logo_url || undefined,
        banner_url: form.banner_url || undefined,
        raise_target: form.raise_target || undefined,
        equity_offered: form.equity_offered || undefined,
        min_ticket_size: form.min_ticket_size || undefined,
        funding_stage: (form.funding_stage || undefined) as 'pre_seed' | 'seed' | 'series_a' | 'series_b' | 'series_c' | 'bridge' | undefined,
        team_size: form.team_size || undefined,
        sector: form.sector || undefined,
        pitch_video_url: form.pitch_video_url || undefined,
        is_actively_raising: form.is_actively_raising,
        visibility: form.visibility as 'public' | 'investors_only' | 'private',
        categories: form.categories,
        keywords: form.keywords.split(',').map((item) => item.trim()).filter(Boolean),
        founders: founders
          .map((founder, index) => ({
            ...founder,
            display_order: index,
            status: 'pending' as const,
          }))
          .filter((founder) => founder.name.trim()),
      });

      router.push(`/facilitator/startups/${id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Creation failed');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl animate-fade-in">
      <div className="mb-8 flex items-center gap-3">
        <Link href="/facilitator/startups" className="btn-ghost !rounded-xl !p-2">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Create Startup</h1>
          <p className="mt-0.5 text-sm text-muted">
            Create the startup with the full onboarding fields from `startup_profiles`, then continue in the editor.
          </p>
        </div>
      </div>

      <form onSubmit={handleCreate}>
        <div className="card-elevated mb-6 rounded-xl p-6">
          <h2 className="mb-5 text-base font-semibold text-foreground">Identity</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <ImageUpload label="Logo" name="logo_url" value={form.logo_url} onChange={(url) => update('logo_url', url)} />
            <ImageUpload label="Banner" name="banner_url" value={form.banner_url} onChange={(url) => update('banner_url', url)} />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field label="Brand Name *">
              <input className={inputCls} value={form.brand_name} onChange={(e) => update('brand_name', e.target.value)} />
            </Field>
            <Field label="Registered Name">
              <input className={inputCls} value={form.registered_name} onChange={(e) => update('registered_name', e.target.value)} />
            </Field>
            <Field label="CIN">
              <input className={inputCls} value={form.cin} onChange={(e) => update('cin', e.target.value)} />
            </Field>
            <Field label="Stage">
              <select className={inputCls} value={form.stage} onChange={(e) => update('stage', e.target.value)}>
                {STAGES.map((stage) => (
                  <option key={stage.value} value={stage.value}>{stage.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Legal Status *">
              <select className={inputCls} value={form.legal_status} onChange={(e) => update('legal_status', e.target.value)}>
                {LEGAL_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Description" className="mt-4">
            <textarea className={textareaCls} rows={5} value={form.description} onChange={(e) => update('description', e.target.value)} />
          </Field>
        </div>

        <div className="card-elevated mb-6 rounded-xl p-6">
          <h2 className="mb-5 text-base font-semibold text-foreground">Contact and Location</h2>
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
            <Field label="Founded Date">
              <input className={inputCls} type="date" value={form.founded_date} onChange={(e) => update('founded_date', e.target.value)} />
            </Field>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Field label="City">
              {isIndia && cityOptions.length > 0 ? (
                <select className={inputCls} value={form.city} onChange={(e) => update('city', e.target.value)}>
                  <option value="">Select city</option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              ) : (
                <input
                  className={inputCls}
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                  placeholder={isIndia ? 'Select state first' : 'Enter city'}
                />
              )}
            </Field>
            <Field label="State">
              {isIndia ? (
                <select className={inputCls} value={form.state} onChange={(e) => { update('state', e.target.value); update('city', ''); }}>
                  <option value="">Select state</option>
                  {stateOptions.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              ) : (
                <input className={inputCls} value={form.state} onChange={(e) => update('state', e.target.value)} />
              )}
            </Field>
            <Field label="Country">
              <select
                className={inputCls}
                value={form.country}
                onChange={(e) => {
                  const nextCountry = e.target.value;
                  update('country', nextCountry);
                  update('state', '');
                  update('city', '');
                  if (nextCountry !== 'Other') setCustomCountry('');
                }}
              >
                {COUNTRY_OPTIONS.map((country) => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </Field>
          </div>
          {isCustomCountry && (
            <Field label="Custom Country" className="mt-4">
              <input className={inputCls} value={customCountry} onChange={(e) => setCustomCountry(e.target.value)} />
            </Field>
          )}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Address Line 1">
              <input className={inputCls} value={form.address_line1} onChange={(e) => update('address_line1', e.target.value)} />
            </Field>
            <Field label="Address Line 2">
              <input className={inputCls} value={form.address_line2} onChange={(e) => update('address_line2', e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="card-elevated mb-6 rounded-xl p-6">
          <h2 className="mb-5 text-base font-semibold text-foreground">Market and Narrative</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Business Model">
              <input className={inputCls} value={form.business_model} onChange={(e) => update('business_model', e.target.value)} />
            </Field>
            <Field label="Sector">
              <input className={inputCls} value={form.sector} onChange={(e) => update('sector', e.target.value)} />
            </Field>
            <Field label="Team Size">
              <select className={inputCls} value={form.team_size} onChange={(e) => update('team_size', e.target.value)}>
                <option value="">Select size</option>
                {TEAM_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </Field>
            <Field label="Target Audience">
              <input className={inputCls} value={form.target_audience} onChange={(e) => update('target_audience', e.target.value)} />
            </Field>
          </div>
          <Field label="Key Strengths" className="mt-4">
            <textarea className={textareaCls} rows={3} value={form.key_strengths} onChange={(e) => update('key_strengths', e.target.value)} />
          </Field>
          <Field label="Elevator Pitch" className="mt-4">
            <textarea className={textareaCls} rows={3} value={form.elevator_pitch} onChange={(e) => update('elevator_pitch', e.target.value)} />
          </Field>
          <Field label="Traction Metrics" className="mt-4">
            <textarea className={textareaCls} rows={4} value={form.traction_metrics} onChange={(e) => update('traction_metrics', e.target.value)} />
          </Field>
        </div>

        <div className="card-elevated mb-6 rounded-xl p-6">
          <h2 className="mb-5 text-base font-semibold text-foreground">Financial and Raise</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Revenue Amount">
              <input className={inputCls} value={form.revenue_amount} onChange={(e) => update('revenue_amount', e.target.value)} />
            </Field>
            <Field label="Revenue Currency">
              <select className={inputCls} value={form.revenue_currency} onChange={(e) => update('revenue_currency', e.target.value)}>
                {REVENUE_CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </Field>
            <Field label="Revenue Growth">
              <input className={inputCls} value={form.revenue_growth} onChange={(e) => update('revenue_growth', e.target.value)} />
            </Field>
            <Field label="Total Raised">
              <input className={inputCls} value={form.total_raised} onChange={(e) => update('total_raised', e.target.value)} />
            </Field>
            <Field label="Investor Count">
              <input className={inputCls} type="number" min="0" value={form.investor_count} onChange={(e) => update('investor_count', e.target.value)} />
            </Field>
            <Field label="Funding Stage">
              <select className={inputCls} value={form.funding_stage} onChange={(e) => update('funding_stage', e.target.value)}>
                {FUNDING_STAGES.map((stage) => (
                  <option key={stage.value || 'none'} value={stage.value}>{stage.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Raise Target">
              <input className={inputCls} value={form.raise_target} onChange={(e) => update('raise_target', e.target.value)} />
            </Field>
            <Field label="Min Ticket Size">
              <input className={inputCls} value={form.min_ticket_size} onChange={(e) => update('min_ticket_size', e.target.value)} />
            </Field>
            <Field label="Equity Offered">
              <input className={inputCls} value={form.equity_offered} onChange={(e) => update('equity_offered', e.target.value)} />
            </Field>
            <label className="flex items-center justify-between rounded-xl border border-card-border bg-background px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Actively Raising</p>
                <p className="text-xs text-muted">Mark whether this startup is currently fundraising.</p>
              </div>
              <input type="checkbox" checked={form.is_actively_raising} onChange={(e) => update('is_actively_raising', e.target.checked)} className="h-4 w-4" />
            </label>
          </div>
        </div>

        <div className="card-elevated mb-6 rounded-xl p-6">
          <h2 className="mb-5 text-base font-semibold text-foreground">Links and Discovery</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Pitch Deck URL">
              <div className="space-y-3">
                <input className={inputCls} type="url" value={form.pitch_deck_url} onChange={(e) => update('pitch_deck_url', e.target.value)} />
                <button
                  type="button"
                  onClick={() => deckInputRef.current?.click()}
                  disabled={uploadingDeck}
                  className="inline-flex items-center gap-2 rounded-lg border border-card-border px-3 py-2 text-sm font-medium text-foreground hover:border-primary hover:text-primary disabled:opacity-50"
                >
                  {uploadingDeck ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {uploadingDeck ? 'Uploading...' : 'Upload Pitch Deck'}
                </button>
                <input
                  ref={deckInputRef}
                  type="file"
                  accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePitchDeckUpload(file);
                    e.target.value = '';
                  }}
                />
              </div>
            </Field>
            <Field label="Pitch Video URL">
              <input className={inputCls} type="url" value={form.pitch_video_url} onChange={(e) => update('pitch_video_url', e.target.value)} />
            </Field>
            <Field label="Visibility">
              <select className={inputCls} value={form.visibility} onChange={(e) => update('visibility', e.target.value)}>
                {VISIBILITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mt-5">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Categories</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((category) => {
                const selected = form.categories.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      selected
                        ? 'bg-primary text-white shadow-sm'
                        : 'border border-card-border bg-background text-muted hover:border-primary hover:text-primary'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
          <Field label="Keywords" className="mt-4">
            <input className={inputCls} value={form.keywords} onChange={(e) => update('keywords', e.target.value)} placeholder="Comma-separated keywords" />
          </Field>
        </div>

        <div className="card-elevated mb-6 rounded-xl p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-foreground">Startup Founders</h2>
            <button
              type="button"
              onClick={() => setFounders((current) => [...current, { name: '', role: '', email: '', ments_username: '' }])}
              className="rounded-lg border border-card-border px-3 py-2 text-sm font-medium text-foreground hover:border-primary hover:text-primary"
            >
              Add Founder
            </button>
          </div>

          <div className="space-y-4">
            {founders.map((founder, index) => (
              <div key={index} className="grid gap-4 rounded-xl border border-card-border p-4 md:grid-cols-2">
                <Field label="Founder Name">
                  <input className={inputCls} value={founder.name} onChange={(e) => updateFounder(index, 'name', e.target.value)} />
                </Field>
                <Field label="Role">
                  <input className={inputCls} value={founder.role} onChange={(e) => updateFounder(index, 'role', e.target.value)} />
                </Field>
                <Field label="Email">
                  <input className={inputCls} type="email" value={founder.email} onChange={(e) => updateFounder(index, 'email', e.target.value)} />
                </Field>
                <Field label="Ments Username">
                  <input className={inputCls} value={founder.ments_username} onChange={(e) => updateFounder(index, 'ments_username', e.target.value)} placeholder="@username" />
                </Field>
                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={() => setFounders((current) => current.length === 1 ? [{ name: '', role: '', email: '', ments_username: '' }] : current.filter((_, founderIndex) => founderIndex !== index))}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Remove Founder
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            Founders added here are stored in `startup_founders`. Invite and account-linking can be layered later.
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950/50 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={creating || !form.brand_name.trim()} className="btn-primary gap-2">
            {creating ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />}
            {creating ? 'Creating...' : 'Create Startup'}
          </button>
          <p className="text-xs text-muted">
            This creates the startup under the facilitator account first, then you can refine it further and transfer ownership later.
          </p>
        </div>
      </form>
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

const textareaCls =
  'w-full rounded-xl border border-card-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20';
