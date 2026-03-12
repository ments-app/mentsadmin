'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Loader2, Plus, Trash2, Save, CheckCircle2, Building2,
  FileText, Tag, TrendingUp, Users, Award, Upload, X, ImageIcon,
  MapPin, Globe, Mail, Phone, Calendar, Hash, ExternalLink,
  Pencil, ArrowLeft, Link2, DollarSign, Lightbulb, Target, BarChart2,
} from 'lucide-react';
import {
  getMyFullStartupProfile,
  updateMyStartupProfile,
  updateMyFounders,
  updateMyFundingRounds,
  updateMyIncubators,
  updateMyAwards,
  createMyStartupProfile,
} from '@/actions/startup-profile';
import { supabase } from '@/lib/supabase';

type Tab = 'identity' | 'content' | 'market' | 'financials' | 'team' | 'recognition' | 'media';
type Mode = 'view' | 'edit';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'identity',    label: 'Identity',     icon: <Building2 size={14} /> },
  { id: 'content',     label: 'Content',      icon: <FileText size={14} /> },
  { id: 'market',      label: 'Market',       icon: <Tag size={14} /> },
  { id: 'financials',  label: 'Financials',   icon: <TrendingUp size={14} /> },
  { id: 'team',        label: 'Team',         icon: <Users size={14} /> },
  { id: 'recognition', label: 'Recognition',  icon: <Award size={14} /> },
  { id: 'media',       label: 'Media',        icon: <ImageIcon size={14} /> },
];

const LEGAL_STATUSES = [
  { value: 'llp',               label: 'LLP' },
  { value: 'pvt_ltd',           label: 'Pvt Ltd' },
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'not_registered',    label: 'Not Registered' },
];

const STAGES = [
  { value: 'ideation',   label: 'Ideation' },
  { value: 'mvp',        label: 'MVP' },
  { value: 'scaling',    label: 'Scaling' },
  { value: 'expansion',  label: 'Expansion' },
  { value: 'maturity',   label: 'Maturity' },
];

const ROUND_TYPES = [
  { value: 'pre_seed', label: 'Pre-Seed' },
  { value: 'seed',     label: 'Seed' },
  { value: 'series_a', label: 'Series A' },
  { value: 'series_b', label: 'Series B' },
  { value: 'series_c', label: 'Series C' },
  { value: 'other',    label: 'Other' },
];

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'SGD'];

// ─── Startup ID formatter ──────────────────────────────────────

function formatStartupId(uuid: string) {
  return 'MNT-' + uuid.replace(/-/g, '').slice(0, 8).toUpperCase();
}

// ─── Main Page ─────────────────────────────────────────────────

export default function StartupProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('view');
  const [activeTab, setActiveTab] = useState<Tab>('identity');
  const [saved, setSaved] = useState<Tab | null>(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ brand_name: '', stage: 'ideation', startup_email: '', startup_phone: '' });
  const [createError, setCreateError] = useState('');

  const load = useCallback(async () => {
    const data = await getMyFullStartupProfile();
    setProfile(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function showSaved(tab: Tab) {
    setSaved(tab);
    setTimeout(() => setSaved(null), 2000);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.brand_name.trim()) { setCreateError('Brand name is required'); return; }
    setCreating(true); setCreateError('');
    try {
      await createMyStartupProfile(createForm);
      await load();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create profile');
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-3">
        <div className="h-8 w-48 animate-pulse rounded bg-card-border" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded bg-card-border" />
        ))}
      </div>
    );
  }

  // No profile yet — show create form
  if (!profile) {
    return (
      <div className="mx-auto max-w-lg">
        <h1 className="text-xl font-bold text-foreground">Set up your Startup Profile</h1>
        <p className="mt-1 text-sm text-muted">Your startup profile is shown publicly on the Ments platform.</p>
        <form onSubmit={handleCreate} className="mt-6 space-y-4 rounded-xl border border-card-border bg-card-bg p-6">
          {createError && <p className="text-xs text-danger">{createError}</p>}
          <Field label="Brand Name *" value={createForm.brand_name} onChange={v => setCreateForm(f => ({ ...f, brand_name: v }))} />
          <SelectField label="Stage" value={createForm.stage} onChange={v => setCreateForm(f => ({ ...f, stage: v }))} options={STAGES} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Contact Email" type="email" value={createForm.startup_email} onChange={v => setCreateForm(f => ({ ...f, startup_email: v }))} />
            <Field label="Contact Phone" value={createForm.startup_phone} onChange={v => setCreateForm(f => ({ ...f, startup_phone: v }))} />
          </div>
          <button type="submit" disabled={creating}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-white disabled:opacity-50">
            {creating ? <Loader2 size={15} className="animate-spin" /> : <Building2 size={15} />}
            Create Startup Profile
          </button>
        </form>
      </div>
    );
  }

  // ── View Mode ────────────────────────────────────────────────
  if (mode === 'view') {
    return (
      <ProfileView
        profile={profile}
        onEdit={() => setMode('edit')}
      />
    );
  }

  // ── Edit Mode ────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-3xl">
      {/* Back button */}
      <button
        onClick={() => setMode('view')}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} /> Back to Profile
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        {profile.logo_url ? (
          <img src={profile.logo_url} alt="" className="h-12 w-12 rounded-xl object-cover border border-card-border" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
            {profile.brand_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-foreground">Edit Profile</h1>
          <p className="text-xs text-muted">{profile.brand_name}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-card-border">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 rounded-t px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id ? 'border-b-2 border-primary text-primary' : 'text-muted hover:text-foreground'
            }`}>
            {tab.icon} {tab.label}
            {saved === tab.id && <CheckCircle2 size={11} className="text-green-500" />}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {activeTab === 'identity' && (
          <IdentityTab profile={profile} onSave={(data) => {
            updateMyStartupProfile(data).then(() => { setProfile((p: any) => p ? { ...p, ...data } : p); showSaved('identity'); });
          }} />
        )}
        {activeTab === 'content' && (
          <ContentTab profile={profile} onSave={(data) => {
            updateMyStartupProfile(data).then(() => { setProfile((p: any) => p ? { ...p, ...data } : p); showSaved('content'); });
          }} />
        )}
        {activeTab === 'market' && (
          <MarketTab profile={profile} onSave={(data) => {
            updateMyStartupProfile(data).then(() => { setProfile((p: any) => p ? { ...p, ...data } : p); showSaved('market'); });
          }} />
        )}
        {activeTab === 'financials' && (
          <FinancialsTab
            profile={profile}
            onSaveMeta={(data) => {
              updateMyStartupProfile(data).then(() => { setProfile((p: any) => p ? { ...p, ...data } : p); showSaved('financials'); });
            }}
            onSaveRounds={(rounds) => {
              updateMyFundingRounds(rounds).then(() => { setProfile((p: any) => p ? { ...p, funding_rounds: rounds } : p); showSaved('financials'); });
            }}
          />
        )}
        {activeTab === 'team' && (
          <TeamTab
            founders={profile.founders || []}
            onSave={(founders) => {
              updateMyFounders(founders).then(() => { setProfile((p: any) => p ? { ...p, founders } : p); showSaved('team'); });
            }}
          />
        )}
        {activeTab === 'recognition' && (
          <RecognitionTab
            incubators={profile.incubators || []}
            awards={profile.awards || []}
            onSaveIncubators={(items) => {
              updateMyIncubators(items).then(() => { setProfile((p: any) => p ? { ...p, incubators: items } : p); showSaved('recognition'); });
            }}
            onSaveAwards={(items) => {
              updateMyAwards(items).then(() => { setProfile((p: any) => p ? { ...p, awards: items } : p); showSaved('recognition'); });
            }}
          />
        )}
        {activeTab === 'media' && (
          <MediaTab
            profile={profile}
            onSave={(data) => {
              updateMyStartupProfile(data).then(() => { setProfile((p: any) => p ? { ...p, ...data } : p); showSaved('media'); });
            }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Profile View Component ────────────────────────────────────

function ProfileView({ profile, onEdit }: { profile: any; onEdit: () => void }) {
  const startupId = formatStartupId(profile.id);
  const stageLabel = STAGES.find(s => s.value === profile.stage)?.label ?? profile.stage ?? '';
  const legalLabel = LEGAL_STATUSES.find(l => l.value === profile.legal_status)?.label ?? profile.legal_status ?? '';
  const location = [profile.city, profile.state, profile.country].filter(Boolean).join(', ');

  return (
    <div className="mx-auto max-w-3xl">
      {/* Banner */}
      {profile.banner_url && (
        <div className="h-48 w-full overflow-hidden rounded-2xl border border-card-border">
          <img src={profile.banner_url} alt="Banner" className="h-full w-full object-cover" />
        </div>
      )}

      {/* Main header card */}
      <div className={`rounded-2xl border border-card-border bg-card-bg p-6 ${profile.banner_url ? 'mt-3' : ''}`}>
        <div className="flex items-start gap-4">
          {/* Logo */}
          {profile.logo_url ? (
            <img
              src={profile.logo_url}
              alt=""
              className="h-16 w-16 shrink-0 rounded-xl object-cover border border-card-border"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-2xl font-bold text-primary">
              {profile.brand_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}

          {/* Name & badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground leading-tight">{profile.brand_name}</h1>
              {profile.is_actively_raising && (
                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  Raising
                </span>
              )}
            </div>

            {/* Startup ID chip */}
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-mono font-semibold text-primary">
                <Hash size={10} />
                {startupId}
              </span>
              {stageLabel && (
                <span className="rounded-md bg-card-border px-2 py-0.5 text-xs font-medium text-muted capitalize">
                  {stageLabel}
                </span>
              )}
              {legalLabel && (
                <span className="rounded-md bg-card-border px-2 py-0.5 text-xs text-muted">
                  {legalLabel}
                </span>
              )}
            </div>

            {profile.tagline && (
              <p className="mt-2 text-sm text-muted leading-relaxed">{profile.tagline}</p>
            )}

            {/* Quick links */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
              {location && (
                <span className="flex items-center gap-1"><MapPin size={11} />{location}</span>
              )}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline">
                  <Globe size={11} />{profile.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              {profile.startup_email && (
                <span className="flex items-center gap-1"><Mail size={11} />{profile.startup_email}</span>
              )}
              {profile.startup_phone && (
                <span className="flex items-center gap-1"><Phone size={11} />{profile.startup_phone}</span>
              )}
              {profile.founded_date && (
                <span className="flex items-center gap-1">
                  <Calendar size={11} />
                  Founded {new Date(profile.founded_date).getFullYear()}
                </span>
              )}
            </div>
          </div>

          {/* Edit button */}
          <button
            onClick={onEdit}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-card-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Pencil size={14} />
            Edit Profile
          </button>
        </div>

        {/* Extra identity info */}
        {(profile.registered_name || profile.cin || profile.business_model || profile.team_size) && (
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-card-border pt-4 sm:grid-cols-4">
            {profile.registered_name && (
              <InfoCell label="Registered Name" value={profile.registered_name} />
            )}
            {profile.cin && (
              <InfoCell label="CIN / Reg. No." value={profile.cin} />
            )}
            {profile.business_model && (
              <InfoCell label="Business Model" value={profile.business_model} />
            )}
            {profile.team_size && (
              <InfoCell label="Team Size" value={String(profile.team_size)} />
            )}
          </div>
        )}
      </div>

      <div className="mt-4 space-y-4">
        {/* About */}
        {(profile.description || profile.elevator_pitch) && (
          <Section title="About" icon={<FileText size={15} />}>
            {profile.description && (
              <div>
                <p className="text-sm text-foreground leading-relaxed">{profile.description}</p>
              </div>
            )}
            {profile.elevator_pitch && (
              <div className={profile.description ? 'mt-3 border-t border-card-border pt-3' : ''}>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Elevator Pitch</p>
                <p className="text-sm text-foreground leading-relaxed">{profile.elevator_pitch}</p>
              </div>
            )}
          </Section>
        )}

        {/* Problem & Solution */}
        {(profile.problem_statement || profile.solution_statement || profile.target_audience) && (
          <Section title="Problem & Solution" icon={<Lightbulb size={15} />}>
            <div className="grid gap-4 sm:grid-cols-2">
              {profile.problem_statement && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Problem</p>
                  <p className="text-sm text-foreground leading-relaxed">{profile.problem_statement}</p>
                </div>
              )}
              {profile.solution_statement && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Solution</p>
                  <p className="text-sm text-foreground leading-relaxed">{profile.solution_statement}</p>
                </div>
              )}
            </div>
            {profile.target_audience && (
              <div className={profile.problem_statement || profile.solution_statement ? 'mt-3 border-t border-card-border pt-3' : ''}>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Target Audience</p>
                <p className="text-sm text-foreground leading-relaxed">{profile.target_audience}</p>
              </div>
            )}
          </Section>
        )}

        {/* Market */}
        {((profile.categories?.length > 0) || (profile.keywords?.length > 0)) && (
          <Section title="Market" icon={<Target size={15} />}>
            {profile.categories?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Categories</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.categories.map((c: string) => (
                    <span key={c} className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {profile.keywords?.length > 0 && (
              <div className={profile.categories?.length > 0 ? 'mt-3' : ''}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.keywords.map((k: string) => (
                    <span key={k} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      #{k}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* Traction */}
        {(profile.traction_metrics || profile.key_strengths) && (
          <Section title="Traction & Strengths" icon={<BarChart2 size={15} />}>
            {profile.traction_metrics && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Traction Metrics</p>
                <p className="text-sm text-foreground leading-relaxed">{profile.traction_metrics}</p>
              </div>
            )}
            {profile.key_strengths && (
              <div className={profile.traction_metrics ? 'mt-3 border-t border-card-border pt-3' : ''}>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Key Strengths</p>
                <p className="text-sm text-foreground leading-relaxed">{profile.key_strengths}</p>
              </div>
            )}
          </Section>
        )}

        {/* Team */}
        {profile.founders?.length > 0 && (
          <Section title="Team" icon={<Users size={15} />}>
            <div className="grid gap-3 sm:grid-cols-2">
              {profile.founders.map((f: any, i: number) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-card-border p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {f.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                    {f.role && <p className="text-xs text-muted truncate">{f.role}</p>}
                    {f.ments_username && (
                      <p className="mt-0.5 flex items-center gap-0.5 text-xs text-primary">
                        <Link2 size={10} /> @{f.ments_username.replace(/^@/, '')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Financials */}
        {(profile.is_actively_raising || profile.total_raised || profile.funding_rounds?.length > 0 || profile.revenue_amount) && (
          <Section title="Financials" icon={<DollarSign size={15} />}>
            <div className="grid gap-3 sm:grid-cols-3">
              {profile.is_actively_raising && (
                <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-900/20">
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400">Status</p>
                  <p className="mt-1 text-sm font-medium text-purple-700 dark:text-purple-300">Actively Raising</p>
                </div>
              )}
              {profile.total_raised && (
                <div className="rounded-xl border border-card-border bg-background p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total Raised</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{profile.total_raised}</p>
                </div>
              )}
              {profile.revenue_amount && (
                <div className="rounded-xl border border-card-border bg-background p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Monthly Revenue</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {profile.revenue_currency} {profile.revenue_amount}
                    {profile.revenue_growth && <span className="ml-1 text-green-600 text-xs">↑ {profile.revenue_growth}</span>}
                  </p>
                </div>
              )}
            </div>
            {profile.funding_rounds?.length > 0 && (
              <div className="mt-4 border-t border-card-border pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Funding Rounds</p>
                <div className="space-y-2">
                  {profile.funding_rounds.map((r: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-card-border bg-background px-3 py-2 text-sm">
                      <div>
                        <span className="font-medium text-foreground">{ROUND_TYPES.find(rt => rt.value === r.round_type)?.label ?? r.round_type}</span>
                        {r.investor && <span className="ml-2 text-muted">· {r.investor}</span>}
                      </div>
                      <div className="text-right">
                        {r.amount && <span className="text-foreground">{r.amount}</span>}
                        {r.round_date && <span className="ml-2 text-xs text-muted">{r.round_date}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* Recognition */}
        {(profile.incubators?.length > 0 || profile.awards?.length > 0) && (
          <Section title="Recognition" icon={<Award size={15} />}>
            {profile.incubators?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Incubators & Programs</p>
                <div className="flex flex-wrap gap-2">
                  {profile.incubators.map((inc: any, i: number) => (
                    <span key={i} className="flex items-center gap-1.5 rounded-full border border-card-border bg-background px-3 py-1 text-xs font-medium text-foreground">
                      <Building2 size={11} className="text-primary" />
                      {inc.program_name}{inc.year ? ` (${inc.year})` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {profile.awards?.length > 0 && (
              <div className={profile.incubators?.length > 0 ? 'mt-3 border-t border-card-border pt-3' : ''}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Awards</p>
                <div className="flex flex-wrap gap-2">
                  {profile.awards.map((a: any, i: number) => (
                    <span key={i} className="flex items-center gap-1.5 rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                      <Award size={11} />
                      {a.award_name}{a.year ? ` (${a.year})` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* Pitch Deck link */}
        {profile.pitch_deck_url && (
          <div className="flex items-center justify-between rounded-xl border border-card-border bg-card-bg px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <FileText size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Pitch Deck</p>
                <p className="text-xs text-muted">PDF document</p>
              </div>
            </div>
            <a
              href={profile.pitch_deck_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-card-border px-3 py-1.5 text-xs font-medium text-muted hover:border-primary hover:text-primary transition-colors"
            >
              <ExternalLink size={12} /> View PDF
            </a>
          </div>
        )}

        {/* Empty state hint */}
        {!profile.description && !profile.tagline && !profile.problem_statement && (
          <div className="rounded-xl border border-dashed border-card-border bg-background px-6 py-10 text-center">
            <Building2 size={36} className="mx-auto mb-3 text-muted opacity-40" />
            <p className="text-sm font-medium text-foreground">Complete your profile</p>
            <p className="mt-1 text-xs text-muted">Add a description, team info, and more to stand out on Ments.</p>
            <button
              onClick={onEdit}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              <Pencil size={13} /> Edit Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section wrapper ───────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-card-border bg-card-bg p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <h2 className="font-semibold text-foreground text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

// ─── Identity Tab ──────────────────────────────────────────────

function IdentityTab({ profile, onSave }: { profile: any; onSave: (d: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({
    brand_name:       profile.brand_name || '',
    registered_name:  profile.registered_name || '',
    tagline:          profile.tagline || '',
    legal_status:     profile.legal_status || '',
    cin:              profile.cin || '',
    stage:            profile.stage || '',
    founded_date:     profile.founded_date || '',
    city:             profile.city || '',
    state:            profile.state || '',
    country:          profile.country || '',
    startup_email:    profile.startup_email || '',
    startup_phone:    profile.startup_phone || '',
    business_model:   profile.business_model || '',
    team_size:        profile.team_size?.toString() || '',
    website:          profile.website || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!form.brand_name.trim()) { setError('Brand name is required'); return; }
    setSaving(true); setError('');
    try { onSave({ ...form, founded_date: form.founded_date || null, team_size: form.team_size || null }); }
    catch (e) { setError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Brand Name *" value={form.brand_name} onChange={v => setForm({ ...form, brand_name: v })} />
        <Field label="Registered Name" value={form.registered_name} onChange={v => setForm({ ...form, registered_name: v })} />
      </div>
      <Field label="Tagline" value={form.tagline} onChange={v => setForm({ ...form, tagline: v })} placeholder="Short catchy tagline" />
      <div className="grid grid-cols-2 gap-4">
        <SelectField label="Legal Status" value={form.legal_status} onChange={v => setForm({ ...form, legal_status: v })} options={LEGAL_STATUSES} />
        <Field label="CIN / Reg. No." value={form.cin} onChange={v => setForm({ ...form, cin: v })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SelectField label="Stage" value={form.stage} onChange={v => setForm({ ...form, stage: v })} options={STAGES} />
        <Field label="Founded Date" type="date" value={form.founded_date} onChange={v => setForm({ ...form, founded_date: v })} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="City" value={form.city} onChange={v => setForm({ ...form, city: v })} />
        <Field label="State" value={form.state} onChange={v => setForm({ ...form, state: v })} />
        <Field label="Country" value={form.country} onChange={v => setForm({ ...form, country: v })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Contact Email" type="email" value={form.startup_email} onChange={v => setForm({ ...form, startup_email: v })} />
        <Field label="Contact Phone" value={form.startup_phone} onChange={v => setForm({ ...form, startup_phone: v })} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <SelectField label="Business Model" value={form.business_model} onChange={v => setForm({ ...form, business_model: v })}
          options={['B2B', 'B2C', 'B2B2C', 'D2C', 'Marketplace', 'SaaS', 'Other'].map(m => ({ value: m, label: m }))} />
        <Field label="Team Size" value={form.team_size} onChange={v => setForm({ ...form, team_size: v })} placeholder="e.g. 5-10" />
        <Field label="Website" type="url" value={form.website} onChange={v => setForm({ ...form, website: v })} placeholder="https://" />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      <SaveButton saving={saving} onClick={handleSave} />
    </div>
  );
}

// ─── Content Tab ───────────────────────────────────────────────

function ContentTab({ profile, onSave }: { profile: any; onSave: (d: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({
    description:        profile.description || '',
    elevator_pitch:     profile.elevator_pitch || '',
    problem_statement:  profile.problem_statement || '',
    solution_statement: profile.solution_statement || '',
    target_audience:    profile.target_audience || '',
    key_strengths:      profile.key_strengths || '',
    traction_metrics:   profile.traction_metrics || '',
  });
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-4">
      <TextareaField label="Description" value={form.description} onChange={v => setForm({ ...form, description: v })}
        placeholder="What does your startup do?" maxLength={500} rows={3} />
      <TextareaField label="Elevator Pitch" value={form.elevator_pitch} onChange={v => setForm({ ...form, elevator_pitch: v })}
        placeholder="Short pitch for investors (~100 words)" rows={4} />
      <div className="grid grid-cols-2 gap-4">
        <TextareaField label="Problem Statement" value={form.problem_statement} onChange={v => setForm({ ...form, problem_statement: v })}
          placeholder="What problem are you solving?" rows={4} />
        <TextareaField label="Solution Statement" value={form.solution_statement} onChange={v => setForm({ ...form, solution_statement: v })}
          placeholder="How are you solving it?" rows={4} />
      </div>
      <TextareaField label="Target Audience" value={form.target_audience} onChange={v => setForm({ ...form, target_audience: v })}
        placeholder="Who are your target customers?" rows={3} />
      <TextareaField label="Key Strengths" value={form.key_strengths} onChange={v => setForm({ ...form, key_strengths: v })}
        placeholder="What are your competitive advantages?" rows={3} />
      <TextareaField label="Traction Metrics" value={form.traction_metrics} onChange={v => setForm({ ...form, traction_metrics: v })}
        placeholder="Users, revenue, growth numbers, partnerships..." rows={3} />
      <SaveButton saving={saving} onClick={() => {
        setSaving(true);
        onSave(Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v || null])));
        setSaving(false);
      }} />
    </div>
  );
}

// ─── Market Tab ────────────────────────────────────────────────

function MarketTab({ profile, onSave }: { profile: any; onSave: (d: Record<string, unknown>) => void }) {
  const [categories, setCategories] = useState<string[]>(profile.categories || []);
  const [keywords, setKeywords] = useState<string[]>(profile.keywords || []);
  const [catInput, setCatInput] = useState('');
  const [kwInput, setKwInput] = useState('');
  const [saving, setSaving] = useState(false);

  function addTag(list: string[], setList: (v: string[]) => void, input: string, setInput: (v: string) => void) {
    const t = input.trim();
    if (t && !list.includes(t)) setList([...list, t]);
    setInput('');
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Categories</label>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {categories.map(c => (
            <span key={c} className="flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {c}
              <button onClick={() => setCategories(categories.filter(x => x !== c))} className="hover:text-danger"><Trash2 size={10} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={catInput} onChange={e => setCatInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(categories, setCategories, catInput, setCatInput); }}}
            placeholder="Add category (press Enter)"
            className="flex-1 rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
          <button onClick={() => addTag(categories, setCategories, catInput, setCatInput)}
            className="rounded-lg border border-card-border px-3 py-2 text-xs font-medium text-muted hover:border-primary hover:text-primary">Add</button>
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Keywords / Tags</label>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {keywords.map(k => (
            <span key={k} className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              #{k}
              <button onClick={() => setKeywords(keywords.filter(x => x !== k))} className="hover:text-danger"><Trash2 size={10} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={kwInput} onChange={e => setKwInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(keywords, setKeywords, kwInput, setKwInput); }}}
            placeholder="Add keyword (press Enter)"
            className="flex-1 rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
          <button onClick={() => addTag(keywords, setKeywords, kwInput, setKwInput)}
            className="rounded-lg border border-card-border px-3 py-2 text-xs font-medium text-muted hover:border-primary hover:text-primary">Add</button>
        </div>
      </div>
      <SaveButton saving={saving} onClick={() => { setSaving(true); onSave({ categories, keywords }); setSaving(false); }} />
    </div>
  );
}

// ─── Financials Tab ────────────────────────────────────────────

function FinancialsTab({ profile, onSaveMeta, onSaveRounds }: {
  profile: any;
  onSaveMeta: (d: Record<string, unknown>) => void;
  onSaveRounds: (rounds: any[]) => void;
}) {
  const [meta, setMeta] = useState({
    revenue_amount:      profile.revenue_amount || '',
    revenue_currency:    profile.revenue_currency || 'INR',
    revenue_growth:      profile.revenue_growth || '',
    total_raised:        profile.total_raised?.toString() || '',
    investor_count:      profile.investor_count?.toString() || '',
    is_actively_raising: profile.is_actively_raising || false,
  });
  const [rounds, setRounds] = useState<any[]>((profile.funding_rounds || []).map((r: any) => ({
    investor: r.investor || '', amount: r.amount || '', round_type: r.round_type || '',
    round_date: r.round_date || '', is_public: r.is_public,
  })));
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingRounds, setSavingRounds] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Revenue & Traction</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex gap-2">
            <div className="w-24"><SelectField label="Currency" value={meta.revenue_currency} onChange={v => setMeta({ ...meta, revenue_currency: v })}
              options={CURRENCIES.map(c => ({ value: c, label: c }))} /></div>
            <div className="flex-1"><Field label="Monthly Revenue" value={meta.revenue_amount} onChange={v => setMeta({ ...meta, revenue_amount: v })} placeholder="e.g. 5,00,000" /></div>
          </div>
          <Field label="MoM Growth %" value={meta.revenue_growth} onChange={v => setMeta({ ...meta, revenue_growth: v })} placeholder="e.g. 15%" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Field label="Total Raised" value={meta.total_raised} onChange={v => setMeta({ ...meta, total_raised: v })} placeholder="e.g. ₹50,00,000" />
          <Field label="Investor Count" type="number" value={meta.investor_count} onChange={v => setMeta({ ...meta, investor_count: v })} />
        </div>
        <label className="mt-4 flex cursor-pointer items-center gap-3">
          <div onClick={() => setMeta({ ...meta, is_actively_raising: !meta.is_actively_raising })}
            className={`relative h-5 w-9 rounded-full transition-colors ${meta.is_actively_raising ? 'bg-primary' : 'bg-card-border'}`}>
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${meta.is_actively_raising ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-sm font-medium text-foreground">Actively Raising</span>
        </label>
        <div className="mt-4">
          <SaveButton saving={savingMeta} label="Save Revenue Info" onClick={() => {
            setSavingMeta(true);
            onSaveMeta({ ...meta, investor_count: meta.investor_count ? parseInt(meta.investor_count) : null });
            setSavingMeta(false);
          }} />
        </div>
      </div>
      <div className="border-t border-card-border pt-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Funding Rounds</h3>
          <button onClick={() => setRounds([...rounds, { investor: '', amount: '', round_type: '', round_date: '', is_public: true }])}
            className="flex items-center gap-1 rounded-lg border border-card-border px-2.5 py-1 text-xs font-medium text-muted hover:border-primary hover:text-primary">
            <Plus size={13} /> Add Round
          </button>
        </div>
        <div className="space-y-3">
          {rounds.map((r, i) => (
            <div key={i} className="rounded-lg border border-card-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted">Round {i + 1}</span>
                <button onClick={() => setRounds(rounds.filter((_, idx) => idx !== i))} className="text-muted hover:text-danger"><Trash2 size={13} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Investor" value={r.investor} onChange={v => setRounds(rounds.map((x, idx) => idx === i ? { ...x, investor: v } : x))} />
                <Field label="Amount" value={r.amount} onChange={v => setRounds(rounds.map((x, idx) => idx === i ? { ...x, amount: v } : x))} />
                <SelectField label="Round Type" value={r.round_type} onChange={v => setRounds(rounds.map((x, idx) => idx === i ? { ...x, round_type: v } : x))} options={ROUND_TYPES} />
                <Field label="Date" type="date" value={r.round_date} onChange={v => setRounds(rounds.map((x, idx) => idx === i ? { ...x, round_date: v } : x))} />
              </div>
            </div>
          ))}
          {rounds.length === 0 && <p className="text-xs text-muted">No funding rounds yet.</p>}
        </div>
        <div className="mt-3">
          <SaveButton saving={savingRounds} label="Save Funding Rounds" onClick={() => { setSavingRounds(true); onSaveRounds(rounds); setSavingRounds(false); }} />
        </div>
      </div>
    </div>
  );
}

// ─── Team Tab ──────────────────────────────────────────────────

function TeamTab({ founders, onSave }: { founders: any[]; onSave: (f: any[]) => void }) {
  const [list, setList] = useState(founders.map(f => ({ name: f.name || '', role: f.role || '', email: f.email || '', ments_username: f.ments_username || '' })));
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">Founders & co-founders</p>
        <button onClick={() => setList([...list, { name: '', role: '', email: '', ments_username: '' }])}
          className="flex items-center gap-1 rounded-lg border border-card-border px-2.5 py-1 text-xs font-medium text-muted hover:border-primary hover:text-primary">
          <Plus size={13} /> Add Member
        </button>
      </div>
      {list.map((f, i) => (
        <div key={i} className="rounded-lg border border-card-border p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Member {i + 1}</span>
            <button onClick={() => setList(list.filter((_, idx) => idx !== i))} className="text-muted hover:text-danger"><Trash2 size={13} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name *" value={f.name} onChange={v => setList(list.map((x, idx) => idx === i ? { ...x, name: v } : x))} />
            <Field label="Role / Title" value={f.role} onChange={v => setList(list.map((x, idx) => idx === i ? { ...x, role: v } : x))} placeholder="e.g. Co-founder & CEO" />
            <Field label="Email" type="email" value={f.email} onChange={v => setList(list.map((x, idx) => idx === i ? { ...x, email: v } : x))} />
            <Field label="Ments Username" value={f.ments_username} onChange={v => setList(list.map((x, idx) => idx === i ? { ...x, ments_username: v } : x))} placeholder="@username" />
          </div>
        </div>
      ))}
      {list.length === 0 && <p className="text-xs text-muted">No team members added yet.</p>}
      <SaveButton saving={saving} onClick={() => { setSaving(true); onSave(list.filter(f => f.name.trim())); setSaving(false); }} />
    </div>
  );
}

// ─── Recognition Tab ───────────────────────────────────────────

function RecognitionTab({ incubators, awards, onSaveIncubators, onSaveAwards }: {
  incubators: any[]; awards: any[];
  onSaveIncubators: (items: any[]) => void;
  onSaveAwards: (items: any[]) => void;
}) {
  const [incList, setIncList] = useState(incubators.map(i => ({ program_name: i.program_name, year: i.year?.toString() || '' })));
  const [awardList, setAwardList] = useState(awards.map(a => ({ award_name: a.award_name, year: a.year?.toString() || '' })));
  const [savingInc, setSavingInc] = useState(false);
  const [savingAward, setSavingAward] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Incubators & Programs</h3>
          <button onClick={() => setIncList([...incList, { program_name: '', year: '' }])}
            className="flex items-center gap-1 rounded-lg border border-card-border px-2.5 py-1 text-xs font-medium text-muted hover:border-primary hover:text-primary">
            <Plus size={13} /> Add
          </button>
        </div>
        {incList.map((inc, i) => (
          <div key={i} className="mb-2 flex gap-3">
            <div className="flex-1"><Field label="" value={inc.program_name} onChange={v => setIncList(incList.map((x, idx) => idx === i ? { ...x, program_name: v } : x))} placeholder="Program name" /></div>
            <div className="w-24"><Field label="" type="number" value={inc.year} onChange={v => setIncList(incList.map((x, idx) => idx === i ? { ...x, year: v } : x))} placeholder="Year" /></div>
            <button onClick={() => setIncList(incList.filter((_, idx) => idx !== i))} className="mt-1 self-center text-muted hover:text-danger"><Trash2 size={13} /></button>
          </div>
        ))}
        <SaveButton saving={savingInc} label="Save Incubators" onClick={() => {
          setSavingInc(true);
          onSaveIncubators(incList.filter(i => i.program_name.trim()).map(i => ({ program_name: i.program_name, year: i.year ? parseInt(i.year) : null })));
          setSavingInc(false);
        }} />
      </div>
      <div className="border-t border-card-border pt-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Awards & Recognition</h3>
          <button onClick={() => setAwardList([...awardList, { award_name: '', year: '' }])}
            className="flex items-center gap-1 rounded-lg border border-card-border px-2.5 py-1 text-xs font-medium text-muted hover:border-primary hover:text-primary">
            <Plus size={13} /> Add
          </button>
        </div>
        {awardList.map((a, i) => (
          <div key={i} className="mb-2 flex gap-3">
            <div className="flex-1"><Field label="" value={a.award_name} onChange={v => setAwardList(awardList.map((x, idx) => idx === i ? { ...x, award_name: v } : x))} placeholder="Award name" /></div>
            <div className="w-24"><Field label="" type="number" value={a.year} onChange={v => setAwardList(awardList.map((x, idx) => idx === i ? { ...x, year: v } : x))} placeholder="Year" /></div>
            <button onClick={() => setAwardList(awardList.filter((_, idx) => idx !== i))} className="mt-1 self-center text-muted hover:text-danger"><Trash2 size={13} /></button>
          </div>
        ))}
        <SaveButton saving={savingAward} label="Save Awards" onClick={() => {
          setSavingAward(true);
          onSaveAwards(awardList.filter(a => a.award_name.trim()).map(a => ({ award_name: a.award_name, year: a.year ? parseInt(a.year) : null })));
          setSavingAward(false);
        }} />
      </div>
    </div>
  );
}

// ─── Media Tab ─────────────────────────────────────────────────

function MediaTab({ profile, onSave }: { profile: any; onSave: (d: Record<string, unknown>) => void }) {
  const [logoUrl, setLogoUrl] = useState(profile.logo_url || '');
  const [bannerUrl, setBannerUrl] = useState(profile.banner_url || '');
  const [pitchDeckUrl, setPitchDeckUrl] = useState(profile.pitch_deck_url || '');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingDeck, setUploadingDeck] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const deckRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File, path: string): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `${path}/${user.id}/${fileName}`;
    const { error: uploadError } = await supabase.storage.from('media').upload(filePath, file, { contentType: file.type, upsert: true });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('media').getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function handleLogoUpload(file: File) {
    setUploadingLogo(true); setError('');
    try { const url = await uploadFile(file, 'startup-images/logo'); setLogoUrl(url); }
    catch (e) { setError(e instanceof Error ? e.message : 'Logo upload failed'); }
    finally { setUploadingLogo(false); }
  }

  async function handleBannerUpload(file: File) {
    setUploadingBanner(true); setError('');
    try { const url = await uploadFile(file, 'startup-images/banner'); setBannerUrl(url); }
    catch (e) { setError(e instanceof Error ? e.message : 'Banner upload failed'); }
    finally { setUploadingBanner(false); }
  }

  async function handleDeckUpload(file: File) {
    setUploadingDeck(true); setError('');
    try { const url = await uploadFile(file, 'pitch-decks'); setPitchDeckUrl(url); }
    catch (e) { setError(e instanceof Error ? e.message : 'Pitch deck upload failed'); }
    finally { setUploadingDeck(false); }
  }

  function handleSave() {
    setSaving(true);
    onSave({ logo_url: logoUrl || null, banner_url: bannerUrl || null, pitch_deck_url: pitchDeckUrl || null });
    setSaving(false);
  }

  return (
    <div className="space-y-8">
      {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>}

      {/* Logo */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">Logo</label>
        <div className="flex items-start gap-5">
          {logoUrl ? (
            <div className="group relative h-28 w-28 overflow-hidden rounded-2xl border border-card-border">
              <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <button type="button" onClick={() => setLogoUrl('')} className="rounded-full bg-white/90 p-2 shadow">
                  <X size={14} className="text-gray-700" />
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => logoRef.current?.click()} disabled={uploadingLogo}
              className="flex h-28 w-28 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-card-border bg-card-bg text-muted hover:border-primary hover:text-primary transition-all disabled:opacity-50">
              {uploadingLogo ? <Loader2 size={20} className="animate-spin text-primary" /> : (
                <><ImageIcon size={22} /><span className="text-[10px] font-medium">Upload</span></>
              )}
            </button>
          )}
          <div className="pt-2 space-y-1">
            <p className="text-xs text-muted">Recommended: 256 × 256 px</p>
            <p className="text-xs text-muted/60">PNG, JPG or SVG</p>
            {logoUrl && (
              <button onClick={() => logoRef.current?.click()} disabled={uploadingLogo}
                className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50">
                <Upload size={11} /> Change logo
              </button>
            )}
          </div>
        </div>
        <input ref={logoRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ''; }} />
      </div>

      {/* Banner */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">Banner Image</label>
        {bannerUrl ? (
          <div className="group relative h-44 w-full overflow-hidden rounded-2xl border border-card-border">
            <img src={bannerUrl} alt="Banner" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <button type="button" onClick={() => bannerRef.current?.click()} disabled={uploadingBanner}
                className="flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 shadow hover:bg-white">
                <Upload size={12} /> Change
              </button>
              <button type="button" onClick={() => setBannerUrl('')} className="rounded-full bg-white/90 p-2 shadow">
                <X size={14} className="text-gray-700" />
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => bannerRef.current?.click()} disabled={uploadingBanner}
            className="flex h-44 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-card-border bg-card-bg text-muted hover:border-primary hover:text-primary transition-all disabled:opacity-50">
            {uploadingBanner ? (
              <><Loader2 size={22} className="animate-spin text-primary" /><span className="text-sm">Uploading...</span></>
            ) : (
              <><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Upload size={20} className="text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Click to upload banner</p>
                <p className="text-[10px] text-muted/60 mt-0.5">1200 × 400 px recommended</p>
              </div></>
            )}
          </button>
        )}
        <input ref={bannerRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleBannerUpload(f); e.target.value = ''; }} />
      </div>

      {/* Pitch Deck */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">Pitch Deck</label>
        {pitchDeckUrl ? (
          <div className="flex items-center gap-4 rounded-xl border border-card-border bg-primary/5 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <FileText size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Pitch deck uploaded</p>
              <a href={pitchDeckUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary hover:underline truncate block">View PDF</a>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => deckRef.current?.click()} disabled={uploadingDeck}
                className="flex items-center gap-1 rounded-lg border border-card-border px-2.5 py-1.5 text-xs font-medium text-muted hover:border-primary hover:text-primary">
                <Upload size={11} /> Replace
              </button>
              <button onClick={() => setPitchDeckUrl('')}
                className="rounded-lg p-1.5 text-muted hover:text-danger hover:bg-danger/10 transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => deckRef.current?.click()} disabled={uploadingDeck}
            className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-card-border bg-card-bg text-muted hover:border-primary hover:text-primary transition-all disabled:opacity-50">
            {uploadingDeck ? (
              <><Loader2 size={22} className="animate-spin text-primary" /><span className="text-sm">Uploading...</span></>
            ) : (
              <><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Upload size={20} className="text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Upload your pitch deck</p>
                <p className="text-[10px] text-muted/60 mt-0.5">PDF format, max 10 MB</p>
              </div></>
            )}
          </button>
        )}
        <input ref={deckRef} type="file" accept=".pdf" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleDeckUpload(f); e.target.value = ''; }} />
      </div>

      <SaveButton saving={saving} label="Save Media" onClick={handleSave} />
    </div>
  );
}

// ─── Shared UI ─────────────────────────────────────────────────

function Field({ label, value, onChange, type = 'text', placeholder, maxLength }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; maxLength?: number;
}) {
  return (
    <div>
      {label && <label className="mb-1 block text-xs font-medium text-muted">{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength}
        className="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm text-foreground placeholder-muted/50 outline-none focus:border-primary" />
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder, rows = 3, maxLength }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; maxLength?: number;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs font-medium text-muted">{label}</label>
        {maxLength && <span className="text-xs text-muted">{value.length}/{maxLength}</span>}
      </div>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} maxLength={maxLength}
        className="w-full resize-none rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm text-foreground placeholder-muted/50 outline-none focus:border-primary" />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div>
      {label && <label className="mb-1 block text-xs font-medium text-muted">{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm text-foreground outline-none focus:border-primary">
        <option value="">Select...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function SaveButton({ saving, onClick, label = 'Save Changes' }: { saving: boolean; onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} disabled={saving}
      className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
      {label}
    </button>
  );
}
