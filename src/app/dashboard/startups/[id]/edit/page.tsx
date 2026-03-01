'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  { id: 'identity', label: 'Identity', icon: <Building2 size={14} /> },
  { id: 'content', label: 'Content', icon: <FileText size={14} /> },
  { id: 'market', label: 'Market', icon: <Tag size={14} /> },
  { id: 'financials', label: 'Financials', icon: <TrendingUp size={14} /> },
  { id: 'team', label: 'Team', icon: <Users size={14} /> },
  { id: 'recognition', label: 'Recognition', icon: <Award size={14} /> },
  { id: 'publishing', label: 'Display', icon: <Settings2 size={14} /> },
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

export default function StartupEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<FullStartupProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('identity');
  const [saved, setSaved] = useState<Tab | null>(null);

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
      <div className="mx-auto max-w-3xl">
        <div className="h-8 w-48 animate-pulse rounded bg-card-border" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-card-border" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl py-12 text-center text-muted">
        Startup not found.{' '}
        <Link href="/dashboard/startups" className="text-primary hover:underline">
          Go back
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/startups/${id}`}
          className="rounded-lg border border-card-border p-1.5 text-muted transition-colors hover:bg-card-border/30 hover:text-foreground"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">{profile.brand_name}</h1>
          <p className="text-xs text-muted">Edit startup profile</p>
        </div>
        {profile.owner && (
          <div className="ml-auto text-right">
            <p className="text-xs text-muted">Owner</p>
            <p className="text-sm font-medium text-foreground">{profile.owner.full_name}</p>
            <p className="text-xs text-muted">{profile.owner.email}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-5 flex flex-wrap gap-1 border-b border-card-border pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 rounded-t px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
            {saved === tab.id && <CheckCircle2 size={11} className="text-green-500" />}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {activeTab === 'identity' && (
          <IdentityTab profile={profile} onSave={(data) => {
            updateStartupCoreProfile(id, data).then(() => {
              setProfile((p) => p ? { ...p, ...data } : p);
              showSaved('identity');
            });
          }} />
        )}
        {activeTab === 'content' && (
          <ContentTab profile={profile} onSave={(data) => {
            updateStartupCoreProfile(id, data).then(() => {
              setProfile((p) => p ? { ...p, ...data } : p);
              showSaved('content');
            });
          }} />
        )}
        {activeTab === 'market' && (
          <MarketTab profile={profile} onSave={(data) => {
            updateStartupCoreProfile(id, data).then(() => {
              setProfile((p) => p ? { ...p, ...data } : p);
              showSaved('market');
            });
          }} />
        )}
        {activeTab === 'financials' && (
          <FinancialsTab
            profile={profile}
            onSaveMeta={(data) => {
              updateStartupCoreProfile(id, data).then(() => {
                setProfile((p) => p ? { ...p, ...data } : p);
                showSaved('financials');
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
            onSave={(founders) => {
              upsertStartupFounders(id, founders).then(() => {
                setProfile((p) => p ? { ...p, founders: founders as StartupFounder[] } : p);
                showSaved('team');
              });
            }}
          />
        )}
        {activeTab === 'recognition' && (
          <RecognitionTab
            incubators={profile.incubators}
            awards={profile.awards}
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
          />
        )}
        {activeTab === 'publishing' && (
          <PublishingTab profile={profile} onSave={(data) => {
            updateStartupCoreProfile(id, data).then(() => {
              setProfile((p) => p ? { ...p, ...data } : p);
              showSaved('publishing');
            });
          }} />
        )}
      </div>
    </div>
  );
}

// ─── Identity Tab ──────────────────────────────────────────────

function IdentityTab({ profile, onSave }: { profile: FullStartupProfile; onSave: (d: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({
    brand_name: profile.brand_name || '',
    registered_name: profile.registered_name || '',
    tagline: profile.tagline || '',
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

  async function handleSave() {
    if (!form.brand_name.trim()) { setError('Brand name is required'); return; }
    setSaving(true); setError('');
    try {
      onSave({ ...form, team_size: form.team_size || null });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Brand Name *" value={form.brand_name} onChange={(v) => setForm({ ...form, brand_name: v })} />
        <Field label="Registered Name" value={form.registered_name} onChange={(v) => setForm({ ...form, registered_name: v })} />
      </div>
      <Field label="Tagline" value={form.tagline} onChange={(v) => setForm({ ...form, tagline: v })} placeholder="Short catchy tagline" />
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
      {error && <p className="text-xs text-danger">{error}</p>}
      <SaveButton saving={saving} onClick={handleSave} />
    </div>
  );
}

// ─── Content Tab ───────────────────────────────────────────────

function ContentTab({ profile, onSave }: { profile: FullStartupProfile; onSave: (d: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({
    description: profile.description || '',
    elevator_pitch: profile.elevator_pitch || '',
    problem_statement: profile.problem_statement || '',
    solution_statement: profile.solution_statement || '',
    target_audience: profile.target_audience || '',
    traction_metrics: profile.traction_metrics || '',
    key_strengths: (profile as FullStartupProfile).key_strengths || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true); setError('');
    try {
      onSave({
        ...form,
        description: form.description || null,
        elevator_pitch: form.elevator_pitch || null,
        problem_statement: form.problem_statement || null,
        solution_statement: form.solution_statement || null,
        target_audience: form.target_audience || null,
        traction_metrics: form.traction_metrics || null,
        key_strengths: form.key_strengths || null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextareaField
          label="Problem Statement"
          value={form.problem_statement}
          onChange={(v) => setForm({ ...form, problem_statement: v })}
          placeholder="What problem are you solving?"
          rows={4}
        />
        <TextareaField
          label="Solution Statement"
          value={form.solution_statement}
          onChange={(v) => setForm({ ...form, solution_statement: v })}
          placeholder="How are you solving it?"
          rows={4}
        />
      </div>
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
      {error && <p className="text-xs text-danger">{error}</p>}
      <SaveButton saving={saving} onClick={handleSave} />
    </div>
  );
}

// ─── Market Tab ────────────────────────────────────────────────

function MarketTab({ profile, onSave }: { profile: FullStartupProfile; onSave: (d: Record<string, unknown>) => void }) {
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

  async function handleSave() {
    setSaving(true);
    try { onSave({ categories, keywords }); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Categories</label>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <span key={c} className="flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {c}
              <button onClick={() => removeTag(categories, setCategories, c)} className="hover:text-danger ml-0.5">
                <Trash2 size={10} />
              </button>
            </span>
          ))}
        </div>
        <TagInput
          value={catInput}
          onChange={setCatInput}
          onAdd={() => addTag(categories, setCategories, catInput, setCatInput)}
          placeholder="Add category (press Enter)"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Keywords / Tags</label>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {keywords.map((k) => (
            <span key={k} className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              #{k}
              <button onClick={() => removeTag(keywords, setKeywords, k)} className="hover:text-danger ml-0.5">
                <Trash2 size={10} />
              </button>
            </span>
          ))}
        </div>
        <TagInput
          value={kwInput}
          onChange={setKwInput}
          onAdd={() => addTag(keywords, setKeywords, kwInput, setKwInput)}
          placeholder="Add keyword (press Enter)"
        />
      </div>
      <SaveButton saving={saving} onClick={handleSave} />
    </div>
  );
}

// ─── Financials Tab ────────────────────────────────────────────

type RoundDraft = { investor: string; amount: string; round_type: string; round_date: string; is_public: boolean };

function FinancialsTab({
  profile,
  onSaveMeta,
  onSaveRounds,
}: {
  profile: FullStartupProfile;
  onSaveMeta: (d: Record<string, unknown>) => void;
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
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Revenue & Traction</h3>
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
          <Field label="Total Raised" value={meta.total_raised} onChange={(v) => setMeta({ ...meta, total_raised: v })} placeholder="e.g. ₹50,00,000" />
          <Field label="Investor Count" type="number" value={meta.investor_count} onChange={(v) => setMeta({ ...meta, investor_count: v })} />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Toggle
            checked={meta.is_actively_raising}
            onChange={(v) => setMeta({ ...meta, is_actively_raising: v })}
            label="Actively Raising"
          />
        </div>
        <div className="mt-4">
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
              });
              setSavingMeta(false);
            }}
          />
        </div>
      </div>

      <div className="border-t border-card-border pt-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Funding Rounds</h3>
          <button onClick={addRound} className="flex items-center gap-1 rounded-lg border border-card-border px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:border-primary hover:text-primary">
            <Plus size={13} /> Add Round
          </button>
        </div>
        <div className="space-y-3">
          {rounds.map((r, i) => (
            <div key={i} className="rounded-lg border border-card-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted">Round {i + 1}</span>
                <button onClick={() => setRounds(rounds.filter((_, idx) => idx !== i))} className="text-muted hover:text-danger">
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Investor" value={r.investor} onChange={(v) => updateRound(i, 'investor', v)} placeholder="Investor name" />
                <Field label="Amount" value={r.amount} onChange={(v) => updateRound(i, 'amount', v)} placeholder="e.g. ₹1Cr" />
                <SelectField label="Round Type" value={r.round_type} onChange={(v) => updateRound(i, 'round_type', v)}
                  options={ROUND_TYPES} placeholder="Select..." />
                <Field label="Date" type="date" value={r.round_date} onChange={(v) => updateRound(i, 'round_date', v)} />
              </div>
              <div className="mt-2">
                <Toggle checked={r.is_public} onChange={(v) => updateRound(i, 'is_public', v)} label="Publicly visible" />
              </div>
            </div>
          ))}
          {rounds.length === 0 && (
            <p className="text-xs text-muted">No funding rounds added yet.</p>
          )}
        </div>
        <div className="mt-3">
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

type FounderDraft = { name: string; role: string; email: string; linkedin_url: string };

function TeamTab({
  founders,
  onSave,
}: {
  founders: StartupFounder[];
  onSave: (founders: FounderDraft[]) => void;
}) {
  const [list, setList] = useState<FounderDraft[]>(
    founders.map((f) => ({
      name: f.name || '',
      role: f.role || '',
      email: f.email || '',
      linkedin_url: f.linkedin_url || '',
    }))
  );
  const [saving, setSaving] = useState(false);

  function add() {
    setList([...list, { name: '', role: '', email: '', linkedin_url: '' }]);
  }

  function update(i: number, field: keyof FounderDraft, value: string) {
    setList(list.map((f, idx) => (idx === i ? { ...f, [field]: value } : f)));
  }

  async function handleSave() {
    setSaving(true);
    try { onSave(list.filter((f) => f.name.trim())); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">Founders & co-founders</p>
        <button onClick={add} className="flex items-center gap-1 rounded-lg border border-card-border px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:border-primary hover:text-primary">
          <Plus size={13} /> Add Member
        </button>
      </div>
      {list.map((f, i) => (
        <div key={i} className="rounded-lg border border-card-border p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Member {i + 1}</span>
            <button onClick={() => setList(list.filter((_, idx) => idx !== i))} className="text-muted hover:text-danger">
              <Trash2 size={13} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name *" value={f.name} onChange={(v) => update(i, 'name', v)} />
            <Field label="Role / Title" value={f.role} onChange={(v) => update(i, 'role', v)} placeholder="e.g. Co-founder & CEO" />
            <Field label="Email" type="email" value={f.email} onChange={(v) => update(i, 'email', v)} />
            <Field label="LinkedIn URL" type="url" value={f.linkedin_url} onChange={(v) => update(i, 'linkedin_url', v)} placeholder="https://linkedin.com/in/..." />
          </div>
        </div>
      ))}
      {list.length === 0 && <p className="text-xs text-muted">No team members added yet.</p>}
      <SaveButton saving={saving} onClick={handleSave} />
    </div>
  );
}

// ─── Recognition Tab ───────────────────────────────────────────

type IncubatorDraft = { program_name: string; year: string };
type AwardDraft = { award_name: string; year: string };

function RecognitionTab({
  incubators,
  awards,
  onSaveIncubators,
  onSaveAwards,
}: {
  incubators: StartupIncubator[];
  awards: StartupAward[];
  onSaveIncubators: (items: { program_name: string; year?: number | null }[]) => void;
  onSaveAwards: (items: { award_name: string; year?: number | null }[]) => void;
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
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Incubators & Programs</h3>
          <button onClick={() => setIncList([...incList, { program_name: '', year: '' }])}
            className="flex items-center gap-1 rounded-lg border border-card-border px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:border-primary hover:text-primary">
            <Plus size={13} /> Add
          </button>
        </div>
        {incList.map((inc, i) => (
          <div key={i} className="mb-2 flex gap-3">
            <div className="flex-1">
              <Field label="" value={inc.program_name} onChange={(v) => setIncList(incList.map((x, idx) => idx === i ? { ...x, program_name: v } : x))} placeholder="Program / Incubator name" />
            </div>
            <div className="w-24">
              <Field label="" type="number" value={inc.year} onChange={(v) => setIncList(incList.map((x, idx) => idx === i ? { ...x, year: v } : x))} placeholder="Year" />
            </div>
            <button onClick={() => setIncList(incList.filter((_, idx) => idx !== i))} className="mt-1 self-center text-muted hover:text-danger">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
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

      <div className="border-t border-card-border pt-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Awards & Recognition</h3>
          <button onClick={() => setAwardList([...awardList, { award_name: '', year: '' }])}
            className="flex items-center gap-1 rounded-lg border border-card-border px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:border-primary hover:text-primary">
            <Plus size={13} /> Add
          </button>
        </div>
        {awardList.map((a, i) => (
          <div key={i} className="mb-2 flex gap-3">
            <div className="flex-1">
              <Field label="" value={a.award_name} onChange={(v) => setAwardList(awardList.map((x, idx) => idx === i ? { ...x, award_name: v } : x))} placeholder="Award name" />
            </div>
            <div className="w-24">
              <Field label="" type="number" value={a.year} onChange={(v) => setAwardList(awardList.map((x, idx) => idx === i ? { ...x, year: v } : x))} placeholder="Year" />
            </div>
            <button onClick={() => setAwardList(awardList.filter((_, idx) => idx !== i))} className="mt-1 self-center text-muted hover:text-danger">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
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
          }}
        />
      </div>
    </div>
  );
}

// ─── Publishing Tab ────────────────────────────────────────────

function PublishingTab({ profile, onSave }: { profile: FullStartupProfile; onSave: (d: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({
    visibility: profile.visibility || 'public',
    is_featured: profile.is_featured,
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try { onSave(form); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Visibility</label>
        <div className="space-y-2">
          {[
            { value: 'public', label: 'Public', desc: 'Visible to all users on the platform' },
            { value: 'investors_only', label: 'Investors Only', desc: 'Only visible to verified investors' },
            { value: 'private', label: 'Private', desc: 'Only visible to the owner' },
          ].map((opt) => (
            <label key={opt.value} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${form.visibility === opt.value ? 'border-primary bg-primary/5' : 'border-card-border hover:bg-primary-light/30'}`}>
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
      <SaveButton saving={saving} onClick={handleSave} />
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
      {label && <label className="mb-1 block text-xs font-medium text-muted">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm text-foreground placeholder-muted/50 outline-none transition-colors focus:border-primary"
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
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs font-medium text-muted">{label}</label>
        {maxLength && (
          <span className="text-xs text-muted">{value.length}/{maxLength}</span>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className="w-full resize-none rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm text-foreground placeholder-muted/50 outline-none transition-colors focus:border-primary"
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
      {label && <label className="mb-1 block text-xs font-medium text-muted">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
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
        className="flex-1 rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm text-foreground placeholder-muted/50 outline-none transition-colors focus:border-primary"
      />
      <button
        type="button"
        onClick={onAdd}
        className="rounded-lg border border-card-border px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-primary hover:text-primary"
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
      className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
    >
      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
      {label}
    </button>
  );
}
