'use client';

import { useEffect, useState } from 'react';
import {
  getMyOrganization,
  updateMyOrganization,
  createMyOrganization,
  Organization,
  OrgStartupRelation,
  OrganizationType,
} from '@/actions/facilitator-org';
import {
  Building2, Globe, Mail, MapPin, GraduationCap, Edit3, Save, X,
  RefreshCw, CheckCircle2, Rocket, Tag, Target, Handshake, Eye, EyeOff,
  BadgeCheck, Plus,
} from 'lucide-react';

const SECTOR_OPTIONS = [
  'Technology', 'Healthcare', 'Fintech', 'EdTech', 'E-Commerce', 'SaaS',
  'AI/ML', 'IoT', 'CleanTech', 'AgriTech', 'Social Impact', 'Media',
  'Logistics', 'Real Estate', 'Gaming', 'Other',
];

const STAGE_OPTIONS = [
  'Ideation', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Growth', 'All Stages',
];

const SUPPORT_OPTIONS = [
  'Mentorship', 'Funding', 'Workspace', 'Networking', 'Legal Support',
  'Marketing', 'Technical Support', 'Recruitment', 'IP Support', 'Market Access',
];

const ORG_TYPE_OPTIONS: { value: OrganizationType; label: string }[] = [
  { value: 'incubator', label: 'Incubator' },
  { value: 'accelerator', label: 'Accelerator' },
  { value: 'ecell', label: 'E-Cell' },
  { value: 'college_incubator', label: 'College Incubator' },
  { value: 'facilitator', label: 'Facilitator' },
  { value: 'venture_studio', label: 'Venture Studio' },
  { value: 'grant_body', label: 'Grant Body' },
  { value: 'community', label: 'Community' },
  { value: 'other', label: 'Other' },
];

const SHOW_UNIVERSITY = new Set(['incubator', 'ecell', 'college_incubator']);
const SHOW_SECTORS = new Set(['incubator', 'accelerator', 'venture_studio', 'grant_body', 'facilitator']);
const SHOW_STAGE_FOCUS = new Set(['incubator', 'accelerator', 'venture_studio', 'grant_body']);
const SHOW_SUPPORT = new Set(['incubator', 'accelerator', 'college_incubator', 'facilitator', 'community', 'venture_studio', 'grant_body']);

export default function FacilitatorProfilePage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [relations, setRelations] = useState<OrgStartupRelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Organization>>({});
  const [createForm, setCreateForm] = useState<{
    name: string;
    org_type: OrganizationType;
    short_bio: string;
    description: string;
    website: string;
    contact_email: string;
    city: string;
    state: string;
    country: string;
    university_name: string;
    sectors: string[];
    stage_focus: string[];
    support_types: string[];
    is_published: boolean;
  }>({
    name: '',
    org_type: 'incubator',
    short_bio: '',
    description: '',
    website: '',
    contact_email: '',
    city: '',
    state: '',
    country: '',
    university_name: '',
    sectors: [],
    stage_focus: [],
    support_types: [],
    is_published: true,
  });

  async function load() {
    setLoading(true);
    try {
      const result = await getMyOrganization();
      setOrg(result.org);
      setRelations(result.startupRelations);
      if (result.org) {
        setForm(result.org);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startEdit() {
    if (org) setForm({ ...org });
    setEditing(true);
  }

  function cancelEdit() {
    if (org) setForm({ ...org });
    setEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateMyOrganization({
        name: form.name,
        short_bio: form.short_bio ?? undefined,
        description: form.description ?? undefined,
        website: form.website ?? undefined,
        contact_email: form.contact_email ?? undefined,
        city: form.city ?? undefined,
        state: form.state ?? undefined,
        country: form.country ?? undefined,
        university_name: form.university_name ?? undefined,
        sectors: form.sectors,
        stage_focus: form.stage_focus,
        support_types: form.support_types,
        is_published: form.is_published,
      });
      setEditing(false);
      await load();
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  }

  function toggleArrayItem(field: 'sectors' | 'stage_focus' | 'support_types', value: string) {
    const current = (form[field] as string[]) ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setForm({ ...form, [field]: next });
  }

  function toggleCreateArrayItem(field: 'sectors' | 'stage_focus' | 'support_types', value: string) {
    const current = createForm[field];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setCreateForm({ ...createForm, [field]: next });
  }

  async function handleCreate() {
    if (!createForm.name.trim()) return;
    setSaving(true);
    try {
      await createMyOrganization(createForm);
      setCreating(false);
      await load();
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <RefreshCw className="animate-spin text-primary" size={28} />
        <p className="mt-3 text-sm text-muted">Loading organization...</p>
      </div>
    );
  }

  if (!org) {
    if (!creating) {
      return (
        <div className="py-24 text-center animate-fade-in">
          <Building2 size={48} className="mx-auto mb-4 text-muted/30" />
          <p className="text-base font-medium text-foreground">No organization found</p>
          <p className="mt-1 text-sm text-muted mb-6">
            Create your organization profile to get started.
          </p>
          <button onClick={() => setCreating(true)} className="btn-primary gap-2">
            <Plus size={16} /> Create Organization
          </button>
        </div>
      );
    }

    // ── Create Form ──────────────────────────────────────────
    const ct = createForm.org_type;
    return (
      <div className="animate-fade-in">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Create Organization</h1>
            <p className="mt-1 text-sm text-muted">Set up your organization profile</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setCreating(false)} className="btn-secondary gap-2">
              <X size={15} /> Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || !createForm.name.trim()}
              className="btn-primary gap-2"
            >
              <Save size={15} /> {saving ? 'Creating...' : 'Create Organization'}
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="card-elevated rounded-xl p-6">
              <h3 className="text-base font-semibold text-foreground mb-5">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted mb-1.5 block">
                    Organization Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Enter organization name"
                    className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted mb-1.5 block">
                    Organization Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={createForm.org_type}
                    onChange={(e) => setCreateForm({ ...createForm, org_type: e.target.value as OrganizationType })}
                    className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    {ORG_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted mb-1.5 block">Short Bio</label>
                  <input
                    type="text"
                    value={createForm.short_bio}
                    onChange={(e) => setCreateForm({ ...createForm, short_bio: e.target.value })}
                    placeholder="A brief one-liner about your organization..."
                    maxLength={200}
                    className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted mb-1.5 block">Description</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Detailed description of your organization..."
                    rows={5}
                    className="w-full rounded-xl border border-card-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Support Types (conditional) */}
            {SHOW_SUPPORT.has(ct) && (
              <div className="card-elevated rounded-xl p-6">
                <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Handshake size={16} className="text-primary" /> Support Types
                </h3>
                <div className="flex flex-wrap gap-2">
                  {SUPPORT_OPTIONS.map((opt) => {
                    const selected = createForm.support_types.includes(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => toggleCreateArrayItem('support_types', opt)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                          selected
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-background border border-card-border text-muted hover:border-primary hover:text-primary'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sectors (conditional) */}
            {SHOW_SECTORS.has(ct) && (
              <div className="card-elevated rounded-xl p-6">
                <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Tag size={16} className="text-primary" /> Sectors
                </h3>
                <div className="flex flex-wrap gap-2">
                  {SECTOR_OPTIONS.map((opt) => {
                    const selected = createForm.sectors.includes(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => toggleCreateArrayItem('sectors', opt)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                          selected
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-background border border-card-border text-muted hover:border-emerald-500 hover:text-emerald-600'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stage Focus (conditional) */}
            {SHOW_STAGE_FOCUS.has(ct) && (
              <div className="card-elevated rounded-xl p-6">
                <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Target size={16} className="text-primary" /> Stage Focus
                </h3>
                <div className="flex flex-wrap gap-2">
                  {STAGE_OPTIONS.map((opt) => {
                    const selected = createForm.stage_focus.includes(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => toggleCreateArrayItem('stage_focus', opt)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                          selected
                            ? 'bg-orange-500 text-white shadow-sm'
                            : 'bg-background border border-card-border text-muted hover:border-orange-400 hover:text-orange-500'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card-elevated rounded-xl p-6">
              <h3 className="text-base font-semibold text-foreground mb-5">Contact & Location</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted mb-1.5 block">Website</label>
                  <input
                    type="url"
                    value={createForm.website}
                    onChange={(e) => setCreateForm({ ...createForm, website: e.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted mb-1.5 block">Contact Email</label>
                  <input
                    type="email"
                    value={createForm.contact_email}
                    onChange={(e) => setCreateForm({ ...createForm, contact_email: e.target.value })}
                    placeholder="contact@org.com"
                    className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted mb-1.5 block">City</label>
                  <input
                    type="text"
                    value={createForm.city}
                    onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                    className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted mb-1.5 block">State</label>
                  <input
                    type="text"
                    value={createForm.state}
                    onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
                    className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted mb-1.5 block">Country</label>
                  <input
                    type="text"
                    value={createForm.country}
                    onChange={(e) => setCreateForm({ ...createForm, country: e.target.value })}
                    className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                {/* University (conditional) */}
                {SHOW_UNIVERSITY.has(ct) && (
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wide text-muted mb-1.5 block">University Name</label>
                    <input
                      type="text"
                      value={createForm.university_name}
                      onChange={(e) => setCreateForm({ ...createForm, university_name: e.target.value })}
                      placeholder="e.g. IIT Delhi"
                      className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                )}
                <div className="pt-2 border-t border-card-border">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createForm.is_published}
                      onChange={(e) => setCreateForm({ ...createForm, is_published: e.target.checked })}
                      className="h-4 w-4 rounded border-card-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-foreground">Publish immediately</span>
                  </label>
                  <p className="mt-1 text-xs text-muted">Make your organization visible on the platform.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Organization Profile</h1>
          <p className="mt-1 text-sm text-muted">View and manage your organization details</p>
        </div>
        {!editing ? (
          <button onClick={startEdit} className="btn-primary gap-2">
            <Edit3 size={15} /> Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={cancelEdit} className="btn-secondary gap-2">
              <X size={15} /> Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary gap-2">
              <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Banner + Logo */}
      <div className="card-elevated rounded-xl overflow-hidden mb-6">
        {/* Banner */}
        <div className="relative h-40 bg-gradient-to-r from-emerald-500/20 to-primary/20">
          {org.banner_url && (
            <img src={org.banner_url} alt="" className="h-full w-full object-cover" />
          )}
        </div>

        {/* Logo + Name */}
        <div className="relative px-6 pb-6">
          <div className="-mt-12 flex items-end gap-5">
            <div className="h-24 w-24 shrink-0 rounded-2xl border-4 border-card-bg bg-card-bg shadow-lg overflow-hidden">
              {org.logo_url ? (
                <img src={org.logo_url} alt={org.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-emerald-500/10 text-emerald-600 text-2xl font-bold">
                  {org.name?.charAt(0) ?? 'O'}
                </div>
              )}
            </div>
            <div className="min-w-0 pb-1">
              {editing ? (
                <input
                  type="text"
                  value={form.name ?? ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="text-xl font-bold text-foreground bg-transparent border-b-2 border-primary/50 outline-none pb-1 w-full max-w-md"
                />
              ) : (
                <h2 className="text-xl font-bold text-foreground">{org.name}</h2>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 capitalize">
                  <Building2 size={12} /> {org.org_type?.replace('_', ' ') ?? 'Organization'}
                </span>
                {org.is_verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
                    <BadgeCheck size={12} /> Verified
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  org.is_published
                    ? 'bg-green-500/10 text-green-600'
                    : 'bg-amber-500/10 text-amber-600'
                }`}>
                  {org.is_published ? <Eye size={12} /> : <EyeOff size={12} />}
                  {org.is_published ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <div className="card-elevated rounded-xl p-6">
            <h3 className="text-base font-semibold text-foreground mb-4">About</h3>
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted mb-1.5 block">Short Bio</label>
                  <input
                    type="text"
                    value={form.short_bio ?? ''}
                    onChange={(e) => setForm({ ...form, short_bio: e.target.value })}
                    placeholder="A brief one-liner about your organization..."
                    maxLength={200}
                    className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted mb-1.5 block">Description</label>
                  <textarea
                    value={form.description ?? ''}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Detailed description of your organization..."
                    rows={5}
                    className="w-full rounded-xl border border-card-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            ) : (
              <div>
                {org.short_bio && (
                  <p className="text-sm text-muted italic mb-3">{org.short_bio}</p>
                )}
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {org.description || 'No description provided.'}
                </p>
              </div>
            )}
          </div>

          {/* Support Types */}
          <div className="card-elevated rounded-xl p-6">
            <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <Handshake size={16} className="text-primary" /> Support Types
            </h3>
            {editing ? (
              <div className="flex flex-wrap gap-2">
                {SUPPORT_OPTIONS.map((opt) => {
                  const selected = (form.support_types ?? []).includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() => toggleArrayItem('support_types', opt)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                        selected
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-background border border-card-border text-muted hover:border-primary hover:text-primary'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {org.support_types.length > 0 ? org.support_types.map((t) => (
                  <span key={t} className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                    {t}
                  </span>
                )) : (
                  <p className="text-sm text-muted">No support types specified.</p>
                )}
              </div>
            )}
          </div>

          {/* Sectors */}
          <div className="card-elevated rounded-xl p-6">
            <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <Tag size={16} className="text-primary" /> Sectors
            </h3>
            {editing ? (
              <div className="flex flex-wrap gap-2">
                {SECTOR_OPTIONS.map((opt) => {
                  const selected = (form.sectors ?? []).includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() => toggleArrayItem('sectors', opt)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                        selected
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-background border border-card-border text-muted hover:border-emerald-500 hover:text-emerald-600'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {org.sectors.length > 0 ? org.sectors.map((s) => (
                  <span key={s} className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600">
                    {s}
                  </span>
                )) : (
                  <p className="text-sm text-muted">No sectors specified.</p>
                )}
              </div>
            )}
          </div>

          {/* Stage Focus */}
          <div className="card-elevated rounded-xl p-6">
            <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <Target size={16} className="text-primary" /> Stage Focus
            </h3>
            {editing ? (
              <div className="flex flex-wrap gap-2">
                {STAGE_OPTIONS.map((opt) => {
                  const selected = (form.stage_focus ?? []).includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() => toggleArrayItem('stage_focus', opt)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                        selected
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'bg-background border border-card-border text-muted hover:border-orange-400 hover:text-orange-500'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {org.stage_focus.length > 0 ? org.stage_focus.map((s) => (
                  <span key={s} className="rounded-full bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-600">
                    {s}
                  </span>
                )) : (
                  <p className="text-sm text-muted">No stage focus specified.</p>
                )}
              </div>
            )}
          </div>

          {/* Associated Startups */}
          {relations.length > 0 && (
            <div className="card-elevated rounded-xl p-6">
              <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <Rocket size={16} className="text-primary" /> Associated Startups
                <span className="text-sm font-normal text-muted">({relations.length})</span>
              </h3>
              <div className="space-y-3">
                {relations.map((r) => {
                  const sp = r.startup_profiles;
                  return (
                    <div key={r.id} className="flex items-center justify-between rounded-xl border border-card-border p-4 transition-colors hover:bg-background/50">
                      <div className="flex items-center gap-3">
                        {sp?.logo_url ? (
                          <img src={sp.logo_url} alt="" className="h-10 w-10 rounded-xl object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 font-bold text-sm">
                            {sp?.brand_name?.charAt(0) ?? '?'}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-foreground text-sm">{sp?.brand_name ?? 'Unknown'}</div>
                          <div className="mt-0.5 text-xs text-muted">
                            {[sp?.city, sp?.country].filter(Boolean).join(', ') || 'No location'}
                            {sp?.stage && <> &middot; {sp.stage}</>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
                          {r.relation_type?.replace('_', ' ') ?? 'Related'}
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                          r.status === 'active' ? 'bg-green-500/10 text-green-600' : 'bg-muted/10 text-muted'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="card-elevated rounded-xl p-6">
            <h3 className="text-base font-semibold text-foreground mb-5">Contact & Location</h3>
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted mb-1.5 block">Website</label>
                  <input
                    type="url"
                    value={form.website ?? ''}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted mb-1.5 block">Contact Email</label>
                  <input
                    type="email"
                    value={form.contact_email ?? ''}
                    onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                    placeholder="contact@org.com"
                    className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted mb-1.5 block">City</label>
                  <input
                    type="text"
                    value={form.city ?? ''}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted mb-1.5 block">State</label>
                  <input
                    type="text"
                    value={form.state ?? ''}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted mb-1.5 block">Country</label>
                  <input
                    type="text"
                    value={form.country ?? ''}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted mb-1.5 block">University Name</label>
                  <input
                    type="text"
                    value={form.university_name ?? ''}
                    onChange={(e) => setForm({ ...form, university_name: e.target.value })}
                    className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="pt-2 border-t border-card-border">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_published ?? false}
                      onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                      className="h-4 w-4 rounded border-card-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-foreground">Published</span>
                  </label>
                  <p className="mt-1 text-xs text-muted">Make your organization visible on the platform.</p>
                </div>
              </div>
            ) : (
              <dl className="space-y-4 text-sm">
                {org.website && (
                  <div>
                    <dt className="text-muted flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide">
                      <Globe size={13} /> Website
                    </dt>
                    <dd className="mt-1">
                      <a href={org.website} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">
                        {org.website}
                      </a>
                    </dd>
                  </div>
                )}
                {org.contact_email && (
                  <div>
                    <dt className="text-muted flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide">
                      <Mail size={13} /> Contact Email
                    </dt>
                    <dd className="mt-1 text-foreground">{org.contact_email}</dd>
                  </div>
                )}
                {(org.city || org.state || org.country) && (
                  <div>
                    <dt className="text-muted flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide">
                      <MapPin size={13} /> Location
                    </dt>
                    <dd className="mt-1 text-foreground">
                      {[org.city, org.state, org.country].filter(Boolean).join(', ')}
                    </dd>
                  </div>
                )}
                {org.university_name && (
                  <div>
                    <dt className="text-muted flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide">
                      <GraduationCap size={13} /> University
                    </dt>
                    <dd className="mt-1 text-foreground">{org.university_name}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
