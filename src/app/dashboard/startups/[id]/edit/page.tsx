'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  Plus,
  Trash2,
  Building2,
  FileText,
  Tag,
  TrendingUp,
  Users,
  Award,
  Settings2,
  Save,
  ArrowLeft,
  CheckCircle2,
  ArrowRight,
  Check,
} from 'lucide-react';
import {
  getFullStartupProfile,
  updateStartupCoreProfile,
  upsertStartupFounders,
  upsertFundingRounds,
  upsertStartupIncubators,
  upsertStartupAwards,
  type FullStartupProfile,
  type StartupFounder,
  type StartupFundingRound,
  type StartupIncubator,
  type StartupAward,
} from '@/actions/startups';

type Tab = 'identity' | 'content' | 'market' | 'financials' | 'team' | 'recognition' | 'publishing';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'identity', label: 'Identity', icon: <Building2 size={15} /> },
  { id: 'content', label: 'Content', icon: <FileText size={15} /> },
  { id: 'market', label: 'Market', icon: <Tag size={15} /> },
  { id: 'financials', label: 'Financials', icon: <TrendingUp size={15} /> },
  { id: 'team', label: 'Team', icon: <Users size={15} /> },
  { id: 'recognition', label: 'Recognition', icon: <Award size={15} /> },
  { id: 'publishing', label: 'Display', icon: <Settings2 size={15} /> },
];

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

const BUSINESS_MODELS = ['B2B', 'B2C', 'B2B2C', 'D2C', 'Marketplace', 'SaaS', 'Other'];

const ROUND_TYPES = [
  { value: 'pre_seed', label: 'Pre-Seed' },
  { value: 'seed', label: 'Seed' },
  { value: 'series_a', label: 'Series A' },
  { value: 'series_b', label: 'Series B' },
  { value: 'series_c', label: 'Series C' },
  { value: 'other', label: 'Other' },
];

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'SGD', 'AED'];

const TAB_ORDER: Tab[] = TABS.map((t) => t.id);

export default function StartupEditPageWrapper() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-3xl animate-fade-in">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-card-border/50" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-card-border/50" />
          ))}
        </div>
      </div>
    }>
      <StartupEditPage />
    </Suspense>
  );
}

function StartupEditPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const isSetup = searchParams.get('setup') === 'true';
  const [profile, setProfile] = useState<FullStartupProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('identity');
  const [saved, setSaved] = useState<Tab | null>(null);
  const [completedTabs, setCompletedTabs] = useState<Set<Tab>>(new Set());

  function goNextTab() {
    const currentIndex = TAB_ORDER.indexOf(activeTab);
    if (currentIndex < TAB_ORDER.length - 1) {
      setActiveTab(TAB_ORDER[currentIndex + 1]);
    }
  }

  function markCompleted(tab: Tab) {
    setCompletedTabs((prev) => new Set(prev).add(tab));
  }

  useEffect(() => {
    getFullStartupProfile(id).then((data) => {
      setProfile(data);
      setLoading(false);
    });
  }, [id]);

  function showSaved(tab: Tab) {
    setSaved(tab);
    setTimeout(() => setSaved(null), 2000);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl animate-fade-in">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-card-border/50" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-card-border/50" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl py-24 text-center">
        <Building2 size={48} className="mx-auto mb-4 text-muted/30" />
        <p className="text-base font-medium text-foreground">Startup not found</p>
        <Link href="/dashboard/startups" className="btn-primary mt-4 inline-flex">
          Go back
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <Link
          href={isSetup ? '/dashboard/startups' : `/dashboard/startups/${id}`}
          className="btn-ghost !p-2 !rounded-xl"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground">{profile.brand_name}</h1>
          <p className="mt-0.5 text-sm text-muted">
            {isSetup ? 'Set up the startup profile — fill in each section and click Next' : 'Edit startup profile'}
          </p>
        </div>
        {isSetup ? (
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {completedTabs.size} / {TAB_ORDER.length} completed
            </span>
          </div>
        ) : profile.owner ? (
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Owner</p>
            <p className="text-sm font-medium text-foreground">{profile.owner.full_name}</p>
            <p className="text-xs text-muted">{profile.owner.email}</p>
          </div>
        ) : null}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-1 border-b border-card-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-primary'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {isSetup && completedTabs.has(tab.id) ? (
              <Check size={15} className="text-emerald-500" />
            ) : (
              tab.icon
            )}
            {tab.label}
            {saved === tab.id && <CheckCircle2 size={12} className="text-emerald-500 animate-fade-in" />}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="card-elevated rounded-xl p-6">
        {activeTab === 'identity' && (
          <IdentityTab profile={profile} isSetup={isSetup} onSave={(data, andNext) => {
            updateStartupCoreProfile(id, data).then(() => {
              setProfile((p) => p ? { ...p, ...data } : p);
              showSaved('identity');
              markCompleted('identity');
              if (andNext) goNextTab();
            });
          }} />
        )}
        {activeTab === 'content' && (
          <ContentTab profile={profile} isSetup={isSetup} onSave={(data, andNext) => {
            updateStartupCoreProfile(id, data).then(() => {
              setProfile((p) => p ? { ...p, ...data } : p);
              showSaved('content');
              markCompleted('content');
              if (andNext) goNextTab();
            });
          }} />
        )}
        {activeTab === 'market' && (
          <MarketTab profile={profile} isSetup={isSetup} onSave={(data, andNext) => {
            updateStartupCoreProfile(id, data).then(() => {
              setProfile((p) => p ? { ...p, ...data } : p);
              showSaved('market');
              markCompleted('market');
              if (andNext) goNextTab();
            });
          }} />
        )}
        {activeTab === 'financials' && (
          <FinancialsTab
            profile={profile}
            isSetup={isSetup}
            onSaveMeta={(data, andNext) => {
              updateStartupCoreProfile(id, data).then(() => {
                setProfile((p) => p ? { ...p, ...data } : p);
                showSaved('financials');
                markCompleted('financials');
                if (andNext) goNextTab();
              });
            }}
            onSaveRounds={(rounds) => {
              upsertFundingRounds(id, rounds).then(() => {
                setProfile((p) => p ? { ...p, funding_rounds: rounds as StartupFundingRound[] } : p);
                showSaved('financials');
              });
            }}
          />
        )}
        {activeTab === 'team' && (
          <TeamTab
            founders={profile.founders}
            isSetup={isSetup}
            onSave={(founders, andNext) => {
              upsertStartupFounders(id, founders).then(() => {
                setProfile((p) => p ? { ...p, founders: founders as StartupFounder[] } : p);
                showSaved('team');
                markCompleted('team');
                if (andNext) goNextTab();
              });
            }}
          />
        )}
        {activeTab === 'recognition' && (
          <RecognitionTab
            incubators={profile.incubators}
            awards={profile.awards}
            isSetup={isSetup}
            onSaveIncubators={(items) => {
              upsertStartupIncubators(id, items).then(() => {
                setProfile((p) => p ? { ...p, incubators: items as StartupIncubator[] } : p);
                showSaved('recognition');
              });
            }}
            onSaveAwards={(items) => {
              upsertStartupAwards(id, items).then(() => {
                setProfile((p) => p ? { ...p, awards: items as StartupAward[] } : p);
                showSaved('recognition');
              });
            }}
            onComplete={(andNext) => {
              markCompleted('recognition');
              if (andNext) goNextTab();
            }}
          />
        )}
        {activeTab === 'publishing' && (
          <PublishingTab profile={profile} isSetup={isSetup} startupId={id} onSave={(data, andNext) => {
            updateStartupCoreProfile(id, data).then(() => {
              setProfile((p) => p ? { ...p, ...data } : p);
              showSaved('publishing');
              markCompleted('publishing');
              if (andNext) {
                // Last tab — go to startup detail page
                window.location.href = `/dashboard/startups/${id}`;
              }
            });
          }} />
        )}
      </div>
    </div>
  );
}

// ─── Identity Tab ──────────────────────────────────────────────

function IdentityTab({ profile, isSetup, onSave }: { profile: FullStartupProfile; isSetup?: boolean; onSave: (d: Record<string, unknown>, andNext?: boolean) => void }) {
  const [form, setForm] = useState({
    brand_name: profile.brand_name || '',
    registered_name: profile.registered_name || '',
    legal_status: profile.legal_status || '',
    cin: profile.cin || '',
    stage: profile.stage || '',
    founded_date: profile.founded_date || '',
    address_line1: (profile as FullStartupProfile).address_line1 || '',
    address_line2: (profile as FullStartupProfile).address_line2 || '',
    city: profile.city || '',
    state: (profile as FullStartupProfile).state || '',
    country: profile.country || '',
    startup_email: profile.startup_email || '',
    startup_phone: profile.startup_phone || '',
    business_model: profile.business_model || '',
    team_size: profile.team_size?.toString() || '',
    website: profile.website || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(andNext?: boolean) {
    if (!form.brand_name.trim()) { setError('Brand name is required'); return; }
    setSaving(true); setError('');
    try {
      onSave({
        ...form,
        founded_date: form.founded_date || null,
        team_size: form.team_size || null,
      }, andNext);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Brand Name *" value={form.brand_name} onChange={(v) => setForm({ ...form, brand_name: v })} />
        <Field label="Registered Name" value={form.registered_name} onChange={(v) => setForm({ ...form, registered_name: v })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SelectField label="Legal Status" value={form.legal_status} onChange={(v) => setForm({ ...form, legal_status: v })}
          options={LEGAL_STATUSES} placeholder="Select..." />
        <Field label="CIN / Registration No." value={form.cin} onChange={(v) => setForm({ ...form, cin: v })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SelectField label="Stage" value={form.stage} onChange={(v) => setForm({ ...form, stage: v })}
          options={STAGES} placeholder="Select stage..." />
        <Field label="Founded Date" type="date" value={form.founded_date} onChange={(v) => setForm({ ...form, founded_date: v })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Address Line 1" value={form.address_line1} onChange={(v) => setForm({ ...form, address_line1: v })} />
        <Field label="Address Line 2" value={form.address_line2} onChange={(v) => setForm({ ...form, address_line2: v })} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
        <Field label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
        <Field label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Contact Email" type="email" value={form.startup_email} onChange={(v) => setForm({ ...form, startup_email: v })} />
        <Field label="Contact Phone" value={form.startup_phone} onChange={(v) => setForm({ ...form, startup_phone: v })} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <SelectField label="Business Model" value={form.business_model} onChange={(v) => setForm({ ...form, business_model: v })}
          options={BUSINESS_MODELS.map((m) => ({ value: m, label: m }))} placeholder="Select..." />
        <Field label="Team Size" value={form.team_size} onChange={(v) => setForm({ ...form, team_size: v })} placeholder="e.g. 5-10" />
        <Field label="Website" type="url" value={form.website} onChange={(v) => setForm({ ...form, website: v })} placeholder="https://" />
      </div>
      {error && <p className="rounded-lg bg-red-50 dark:bg-red-950/50 p-3 text-xs text-red-600 dark:text-red-400">{error}</p>}
      <div className="border-t border-card-border pt-5 flex gap-3">
        <SaveButton saving={saving} onClick={() => handleSave(false)} />
        {isSetup && <SaveNextButton saving={saving} onClick={() => handleSave(true)} />}
      </div>
    </div>
  );
}

// ─── Content Tab ───────────────────────────────────────────────

function ContentTab({ profile, isSetup, onSave }: { profile: FullStartupProfile; isSetup?: boolean; onSave: (d: Record<string, unknown>, andNext?: boolean) => void }) {
  const [form, setForm] = useState({
    description: profile.description || '',
    elevator_pitch: profile.elevator_pitch || '',
    target_audience: profile.target_audience || '',
    traction_metrics: profile.traction_metrics || '',
    key_strengths: (profile as FullStartupProfile).key_strengths || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(andNext?: boolean) {
    setSaving(true); setError('');
    try {
      onSave({
        ...form,
        description: form.description || null,
        elevator_pitch: form.elevator_pitch || null,
        target_audience: form.target_audience || null,
        traction_metrics: form.traction_metrics || null,
        key_strengths: form.key_strengths || null,
      }, andNext);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <TextareaField
        label="Description"
        value={form.description}
        onChange={(v) => setForm({ ...form, description: v })}
        placeholder="What does your startup do? (max 500 chars)"
        maxLength={500}
        rows={3}
      />
      <TextareaField
        label="Elevator Pitch"
        value={form.elevator_pitch}
        onChange={(v) => setForm({ ...form, elevator_pitch: v })}
        placeholder="Short pitch for investors (~100 words)"
        rows={4}
      />
      <TextareaField
        label="Target Audience"
        value={form.target_audience}
        onChange={(v) => setForm({ ...form, target_audience: v })}
        placeholder="Who are your target customers?"
        rows={3}
      />
      <TextareaField
        label="Key Strengths"
        value={form.key_strengths}
        onChange={(v) => setForm({ ...form, key_strengths: v })}
        placeholder="What are your competitive advantages?"
        rows={3}
      />
      <TextareaField
        label="Traction Metrics"
        value={form.traction_metrics}
        onChange={(v) => setForm({ ...form, traction_metrics: v })}
        placeholder="Users, revenue, growth numbers, partnerships, etc."
        rows={3}
      />
      {error && <p className="rounded-lg bg-red-50 dark:bg-red-950/50 p-3 text-xs text-red-600 dark:text-red-400">{error}</p>}
      <div className="border-t border-card-border pt-5 flex gap-3">
        <SaveButton saving={saving} onClick={() => handleSave(false)} />
        {isSetup && <SaveNextButton saving={saving} onClick={() => handleSave(true)} />}
      </div>
    </div>
  );
}

// ─── Market Tab ────────────────────────────────────────────────

function MarketTab({ profile, isSetup, onSave }: { profile: FullStartupProfile; isSetup?: boolean; onSave: (d: Record<string, unknown>, andNext?: boolean) => void }) {
  const [categories, setCategories] = useState<string[]>(profile.categories || []);
  const [keywords, setKeywords] = useState<string[]>(profile.keywords || []);
  const [catInput, setCatInput] = useState('');
  const [kwInput, setKwInput] = useState('');
  const [saving, setSaving] = useState(false);

  function addTag(list: string[], setList: (v: string[]) => void, input: string, setInput: (v: string) => void) {
    const trimmed = input.trim();
    if (trimmed && !list.includes(trimmed)) setList([...list, trimmed]);
    setInput('');
  }

  function removeTag(list: string[], setList: (v: string[]) => void, tag: string) {
    setList(list.filter((t) => t !== tag));
  }

  async function handleSave(andNext?: boolean) {
    setSaving(true);
    try { onSave({ categories, keywords }, andNext); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">Categories</label>
        <div className="mb-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <span key={c} className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/10 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20">
              {c}
              <button onClick={() => removeTag(categories, setCategories, c)} className="hover:text-red-500 transition-colors ml-0.5">
                <Trash2 size={11} />
              </button>
            </span>
          ))}
          {categories.length === 0 && <span className="text-xs text-muted">No categories added yet</span>}
        </div>
        <TagInput
          value={catInput}
          onChange={setCatInput}
          onAdd={() => addTag(categories, setCategories, catInput, setCatInput)}
          placeholder="Add category (press Enter)"
        />
      </div>
      <div className="border-t border-card-border pt-6">
        <label className="mb-2 block text-sm font-medium text-foreground">Keywords / Tags</label>
        <div className="mb-3 flex flex-wrap gap-2">
          {keywords.map((k) => (
            <span key={k} className="flex items-center gap-1.5 rounded-full bg-primary/5 px-3 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/10">
              #{k}
              <button onClick={() => removeTag(keywords, setKeywords, k)} className="hover:text-red-500 transition-colors ml-0.5">
                <Trash2 size={11} />
              </button>
            </span>
          ))}
          {keywords.length === 0 && <span className="text-xs text-muted">No keywords added yet</span>}
        </div>
        <TagInput
          value={kwInput}
          onChange={setKwInput}
          onAdd={() => addTag(keywords, setKeywords, kwInput, setKwInput)}
          placeholder="Add keyword (press Enter)"
        />
      </div>
      <div className="border-t border-card-border pt-5 flex gap-3">
        <SaveButton saving={saving} onClick={() => handleSave(false)} />
        {isSetup && <SaveNextButton saving={saving} onClick={() => handleSave(true)} />}
      </div>
    </div>
  );
}

// ─── Financials Tab ────────────────────────────────────────────

type RoundDraft = { investor: string; amount: string; round_type: string; round_date: string; is_public: boolean };

function FinancialsTab({
  profile,
  isSetup,
  onSaveMeta,
  onSaveRounds,
}: {
  profile: FullStartupProfile;
  isSetup?: boolean;
  onSaveMeta: (d: Record<string, unknown>, andNext?: boolean) => void;
  onSaveRounds: (rounds: RoundDraft[]) => void;
}) {
  const fp = profile as FullStartupProfile;
  const [meta, setMeta] = useState({
    revenue_amount: fp.revenue_amount || '',
    revenue_currency: fp.revenue_currency || 'INR',
    revenue_growth: fp.revenue_growth || '',
    total_raised: fp.total_raised?.toString() || '',
    investor_count: fp.investor_count?.toString() || '',
    is_actively_raising: fp.is_actively_raising,
  });
  const [rounds, setRounds] = useState<RoundDraft[]>(
    (profile.funding_rounds || []).map((r) => ({
      investor: r.investor || '',
      amount: r.amount || '',
      round_type: r.round_type || '',
      round_date: r.round_date || '',
      is_public: r.is_public,
    }))
  );
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingRounds, setSavingRounds] = useState(false);

  function addRound() {
    setRounds([...rounds, { investor: '', amount: '', round_type: '', round_date: '', is_public: true }]);
  }

  function updateRound(i: number, field: keyof RoundDraft, value: string | boolean) {
    setRounds(rounds.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">Revenue & Traction</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex gap-2">
            <div className="w-24">
              <SelectField label="Currency" value={meta.revenue_currency} onChange={(v) => setMeta({ ...meta, revenue_currency: v })}
                options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
            </div>
            <div className="flex-1">
              <Field label="Monthly Revenue" value={meta.revenue_amount} onChange={(v) => setMeta({ ...meta, revenue_amount: v })} placeholder="e.g. 5,00,000" />
            </div>
          </div>
          <Field label="MoM Growth %" value={meta.revenue_growth} onChange={(v) => setMeta({ ...meta, revenue_growth: v })} placeholder="e.g. 15%" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Field label="Total Raised" value={meta.total_raised} onChange={(v) => setMeta({ ...meta, total_raised: v })} placeholder="e.g. 50,00,000" />
          <Field label="Investor Count" type="number" value={meta.investor_count} onChange={(v) => setMeta({ ...meta, investor_count: v })} />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Toggle
            checked={meta.is_actively_raising}
            onChange={(v) => setMeta({ ...meta, is_actively_raising: v })}
            label="Actively Raising"
          />
        </div>
        <div className="mt-5 flex gap-3">
          <SaveButton
            saving={savingMeta}
            label="Save Revenue Info"
            onClick={() => {
              setSavingMeta(true);
              onSaveMeta({
                revenue_amount: meta.revenue_amount || null,
                revenue_currency: meta.revenue_currency || null,
                revenue_growth: meta.revenue_growth || null,
                total_raised: meta.total_raised || null,
                investor_count: meta.investor_count ? parseInt(meta.investor_count) : null,
                is_actively_raising: meta.is_actively_raising,
              }, false);
              setSavingMeta(false);
            }}
          />
          {isSetup && (
            <SaveNextButton
              saving={savingMeta}
              onClick={() => {
                setSavingMeta(true);
                onSaveMeta({
                  revenue_amount: meta.revenue_amount || null,
                  revenue_currency: meta.revenue_currency || null,
                  revenue_growth: meta.revenue_growth || null,
                  total_raised: meta.total_raised || null,
                  investor_count: meta.investor_count ? parseInt(meta.investor_count) : null,
                  is_actively_raising: meta.is_actively_raising,
                }, true);
                setSavingMeta(false);
              }}
            />
          )}
        </div>
      </div>

      <div className="border-t border-card-border pt-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">Funding Rounds</h3>
          <button onClick={addRound} className="btn-ghost gap-1.5 text-xs">
            <Plus size={14} /> Add Round
          </button>
        </div>
        <div className="space-y-4">
          {rounds.map((r, i) => (
            <div key={i} className="rounded-xl border border-card-border p-4 transition-colors hover:bg-background/30">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted uppercase tracking-wide">Round {i + 1}</span>
                <button onClick={() => setRounds(rounds.filter((_, idx) => idx !== i))} className="btn-ghost !p-1 text-muted hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Investor" value={r.investor} onChange={(v) => updateRound(i, 'investor', v)} placeholder="Investor name" />
                <Field label="Amount" value={r.amount} onChange={(v) => updateRound(i, 'amount', v)} placeholder="e.g. 1Cr" />
                <SelectField label="Round Type" value={r.round_type} onChange={(v) => updateRound(i, 'round_type', v)}
                  options={ROUND_TYPES} placeholder="Select..." />
                <Field label="Date" type="date" value={r.round_date} onChange={(v) => updateRound(i, 'round_date', v)} />
              </div>
              <div className="mt-3">
                <Toggle checked={r.is_public} onChange={(v) => updateRound(i, 'is_public', v)} label="Publicly visible" />
              </div>
            </div>
          ))}
          {rounds.length === 0 && (
            <div className="rounded-xl border border-dashed border-card-border py-8 text-center">
              <TrendingUp size={32} className="mx-auto mb-2 text-muted/30" />
              <p className="text-sm text-muted">No funding rounds added yet</p>
            </div>
          )}
        </div>
        <div className="mt-5">
          <SaveButton
            saving={savingRounds}
            label="Save Funding Rounds"
            onClick={() => {
              setSavingRounds(true);
              onSaveRounds(rounds);
              setSavingRounds(false);
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Team Tab ──────────────────────────────────────────────────

type FounderDraft = { name: string; role: string; email: string; ments_username: string };

function TeamTab({
  founders,
  isSetup,
  onSave,
}: {
  founders: StartupFounder[];
  isSetup?: boolean;
  onSave: (founders: FounderDraft[], andNext?: boolean) => void;
}) {
  const [list, setList] = useState<FounderDraft[]>(
    founders.map((f) => ({
      name: f.name || '',
      role: f.role || '',
      email: f.email || '',
      ments_username: f.ments_username || '',
    }))
  );
  const [saving, setSaving] = useState(false);

  function add() {
    setList([...list, { name: '', role: '', email: '', ments_username: '' }]);
  }

  function update(i: number, field: keyof FounderDraft, value: string) {
    setList(list.map((f, idx) => (idx === i ? { ...f, [field]: value } : f)));
  }

  async function handleSave(andNext?: boolean) {
    setSaving(true);
    try { onSave(list.filter((f) => f.name.trim()), andNext); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">Founders & co-founders</p>
        <button onClick={add} className="btn-ghost gap-1.5 text-xs">
          <Plus size={14} /> Add Member
        </button>
      </div>
      {list.map((f, i) => (
        <div key={i} className="rounded-xl border border-card-border p-4 transition-colors hover:bg-background/30">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wide">Member {i + 1}</span>
            <button onClick={() => setList(list.filter((_, idx) => idx !== i))} className="btn-ghost !p-1 text-muted hover:text-red-500">
              <Trash2 size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name *" value={f.name} onChange={(v) => update(i, 'name', v)} />
            <Field label="Role / Title" value={f.role} onChange={(v) => update(i, 'role', v)} placeholder="e.g. Co-founder & CEO" />
            <Field label="Email" type="email" value={f.email} onChange={(v) => update(i, 'email', v)} />
            <Field label="Ments Username" value={f.ments_username} onChange={(v) => update(i, 'ments_username', v)} placeholder="@username" />
          </div>
        </div>
      ))}
      {list.length === 0 && (
        <div className="rounded-xl border border-dashed border-card-border py-8 text-center">
          <Users size={32} className="mx-auto mb-2 text-muted/30" />
          <p className="text-sm text-muted">No team members added yet</p>
        </div>
      )}
      <div className="border-t border-card-border pt-5 flex gap-3">
        <SaveButton saving={saving} onClick={() => handleSave(false)} />
        {isSetup && <SaveNextButton saving={saving} onClick={() => handleSave(true)} />}
      </div>
    </div>
  );
}

// ─── Recognition Tab ───────────────────────────────────────────

type IncubatorDraft = { program_name: string; year: string };
type AwardDraft = { award_name: string; year: string };

function RecognitionTab({
  incubators,
  awards,
  isSetup,
  onSaveIncubators,
  onSaveAwards,
  onComplete,
}: {
  incubators: StartupIncubator[];
  awards: StartupAward[];
  isSetup?: boolean;
  onSaveIncubators: (items: { program_name: string; year?: number | null }[]) => void;
  onSaveAwards: (items: { award_name: string; year?: number | null }[]) => void;
  onComplete?: (andNext?: boolean) => void;
}) {
  const [incList, setIncList] = useState<IncubatorDraft[]>(
    incubators.map((i) => ({ program_name: i.program_name, year: i.year?.toString() || '' }))
  );
  const [awardList, setAwardList] = useState<AwardDraft[]>(
    awards.map((a) => ({ award_name: a.award_name, year: a.year?.toString() || '' }))
  );
  const [savingInc, setSavingInc] = useState(false);
  const [savingAward, setSavingAward] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">Incubators & Programs</h3>
          <button onClick={() => setIncList([...incList, { program_name: '', year: '' }])}
            className="btn-ghost gap-1.5 text-xs">
            <Plus size={14} /> Add
          </button>
        </div>
        <div className="space-y-3">
          {incList.map((inc, i) => (
            <div key={i} className="flex gap-3 items-end">
              <div className="flex-1">
                <Field label="" value={inc.program_name} onChange={(v) => setIncList(incList.map((x, idx) => idx === i ? { ...x, program_name: v } : x))} placeholder="Program / Incubator name" />
              </div>
              <div className="w-24">
                <Field label="" type="number" value={inc.year} onChange={(v) => setIncList(incList.map((x, idx) => idx === i ? { ...x, year: v } : x))} placeholder="Year" />
              </div>
              <button onClick={() => setIncList(incList.filter((_, idx) => idx !== i))} className="btn-ghost !p-2 mb-0.5 text-muted hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {incList.length === 0 && <p className="text-sm text-muted py-2">No incubators added yet.</p>}
        </div>
        <div className="mt-4">
          <SaveButton
            saving={savingInc}
            label="Save Incubators"
            onClick={() => {
              setSavingInc(true);
              onSaveIncubators(incList.filter((i) => i.program_name.trim()).map((i) => ({
                program_name: i.program_name,
                year: i.year ? parseInt(i.year) : null,
              })));
              setSavingInc(false);
            }}
          />
        </div>
      </div>

      <div className="border-t border-card-border pt-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">Awards & Recognition</h3>
          <button onClick={() => setAwardList([...awardList, { award_name: '', year: '' }])}
            className="btn-ghost gap-1.5 text-xs">
            <Plus size={14} /> Add
          </button>
        </div>
        <div className="space-y-3">
          {awardList.map((a, i) => (
            <div key={i} className="flex gap-3 items-end">
              <div className="flex-1">
                <Field label="" value={a.award_name} onChange={(v) => setAwardList(awardList.map((x, idx) => idx === i ? { ...x, award_name: v } : x))} placeholder="Award name" />
              </div>
              <div className="w-24">
                <Field label="" type="number" value={a.year} onChange={(v) => setAwardList(awardList.map((x, idx) => idx === i ? { ...x, year: v } : x))} placeholder="Year" />
              </div>
              <button onClick={() => setAwardList(awardList.filter((_, idx) => idx !== i))} className="btn-ghost !p-2 mb-0.5 text-muted hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {awardList.length === 0 && <p className="text-sm text-muted py-2">No awards added yet.</p>}
        </div>
        <div className="mt-4 flex gap-3">
          <SaveButton
            saving={savingAward}
            label="Save Awards"
            onClick={() => {
              setSavingAward(true);
              onSaveAwards(awardList.filter((a) => a.award_name.trim()).map((a) => ({
                award_name: a.award_name,
                year: a.year ? parseInt(a.year) : null,
              })));
              setSavingAward(false);
              onComplete?.(false);
            }}
          />
          {isSetup && (
            <SaveNextButton
              saving={savingAward}
              onClick={() => {
                setSavingAward(true);
                onSaveAwards(awardList.filter((a) => a.award_name.trim()).map((a) => ({
                  award_name: a.award_name,
                  year: a.year ? parseInt(a.year) : null,
                })));
                setSavingAward(false);
                onComplete?.(true);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Publishing Tab ────────────────────────────────────────────

function PublishingTab({ profile, isSetup, startupId, onSave }: { profile: FullStartupProfile; isSetup?: boolean; startupId?: string; onSave: (d: Record<string, unknown>, andNext?: boolean) => void }) {
  const [form, setForm] = useState({
    visibility: profile.visibility || 'public',
    is_featured: profile.is_featured,
  });
  const [saving, setSaving] = useState(false);

  async function handleSave(andNext?: boolean) {
    setSaving(true);
    try { onSave(form, andNext); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">Visibility</label>
        <div className="space-y-2.5">
          {[
            { value: 'public', label: 'Public', desc: 'Visible to all users on the platform' },
            { value: 'investors_only', label: 'Investors Only', desc: 'Only visible to verified investors' },
            { value: 'private', label: 'Private', desc: 'Only visible to the owner' },
          ].map((opt) => (
            <label key={opt.value} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${form.visibility === opt.value ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-card-border hover:bg-background/50 hover:border-muted/30'}`}>
              <input type="radio" name="visibility" value={opt.value} checked={form.visibility === opt.value}
                onChange={() => setForm({ ...form, visibility: opt.value })} className="accent-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">{opt.label}</p>
                <p className="text-xs text-muted">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <Toggle checked={form.is_featured} onChange={(v) => setForm({ ...form, is_featured: v })}
          label="Featured" desc="Highlights the startup with a featured badge on the listing page" />
      </div>
      <div className="border-t border-card-border pt-5 flex gap-3">
        <SaveButton saving={saving} onClick={() => handleSave(false)} />
        {isSetup && (
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="btn-primary gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            Finish Setup
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Shared UI Components ──────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div>
      {label && <label className="mb-1.5 block text-xs font-medium text-muted uppercase tracking-wide">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full rounded-xl border border-card-border bg-card-bg px-3.5 py-2.5 text-sm text-foreground placeholder-muted/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs font-medium text-muted uppercase tracking-wide">{label}</label>
        {maxLength && (
          <span className={`text-xs ${value.length > maxLength * 0.9 ? 'text-amber-600' : 'text-muted'}`}>{value.length}/{maxLength}</span>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className="w-full resize-none rounded-xl border border-card-border bg-card-bg px-3.5 py-2.5 text-sm text-foreground placeholder-muted/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div>
      {label && <label className="mb-1.5 block text-xs font-medium text-muted uppercase tracking-wide">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-card-border bg-card-bg px-3.5 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function TagInput({
  value,
  onChange,
  onAdd,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
  placeholder?: string;
}) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAdd(); } }}
        placeholder={placeholder}
        className="flex-1 rounded-xl border border-card-border bg-card-bg px-3.5 py-2.5 text-sm text-foreground placeholder-muted/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <button
        type="button"
        onClick={onAdd}
        className="btn-secondary !text-xs"
      >
        Add
      </button>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <div
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-card-border'}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {desc && <p className="text-xs text-muted">{desc}</p>}
      </div>
    </label>
  );
}

function SaveButton({
  saving,
  onClick,
  label = 'Save Changes',
}: {
  saving: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="btn-primary gap-2"
    >
      {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
      {label}
    </button>
  );
}

function SaveNextButton({
  saving,
  onClick,
}: {
  saving: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="btn-primary gap-2"
    >
      {saving ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
      Save & Next
    </button>
  );
}
