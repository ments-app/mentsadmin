'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Loader2, UserCircle2, ArrowRight, Building2, ArrowLeft } from 'lucide-react';
import {
  findUserByEmail,
  getStartupByOwnerId,
  createAdminStartupProfile,
  type SimpleUser,
} from '@/actions/startups';

const STAGES = [
  { value: 'ideation', label: 'Ideation' },
  { value: 'mvp', label: 'MVP' },
  { value: 'scaling', label: 'Scaling' },
  { value: 'expansion', label: 'Expansion' },
  { value: 'maturity', label: 'Maturity' },
];

const LEGAL_STATUSES = [
  { value: 'llp', label: 'LLP' },
  { value: 'pvt_ltd', label: 'Pvt Ltd' },
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'not_registered', label: 'Not Registered' },
];

export default function CreateStartupPage() {
  const router = useRouter();

  // Step 1: email search
  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [existingStartupId, setExistingStartupId] = useState<string | null>(null);

  // Step 2: create form (only if no existing startup)
  const [form, setForm] = useState({
    brand_name: '',
    legal_status: 'not_registered',
    stage: 'ideation',
    startup_email: '',
    startup_phone: '',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSearching(true);
    setSearchError('');
    setUser(null);
    setExistingStartupId(null);
    try {
      const foundUser = await findUserByEmail(email.trim());
      if (!foundUser) {
        setSearchError('No user found with this email address. They must register on the Ments platform first.');
        return;
      }
      setUser(foundUser);
      // pre-fill startup email
      setForm((f) => ({ ...f, startup_email: foundUser.email }));
      // check if they already have a startup
      const startupId = await getStartupByOwnerId(foundUser.id);
      setExistingStartupId(startupId);
    } catch {
      setSearchError('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.brand_name.trim()) { setCreateError('Brand name is required'); return; }
    setCreating(true);
    setCreateError('');
    try {
      const { id } = await createAdminStartupProfile(user.id, {
        brand_name: form.brand_name,
        legal_status: form.legal_status as 'llp' | 'pvt_ltd' | 'sole_proprietorship' | 'not_registered',
        stage: form.stage,
        startup_email: form.startup_email || undefined,
        startup_phone: form.startup_phone || undefined,
      });
      router.push(`/dashboard/startups/${id}/edit`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Creation failed');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <Link
          href="/dashboard/startups"
          className="btn-ghost !p-2 !rounded-xl"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Create Startup Profile</h1>
          <p className="mt-0.5 text-sm text-muted">Search user by email, then create or edit their profile</p>
        </div>
      </div>

      {/* Step 1: Email Search */}
      <div className="card-elevated rounded-xl p-6">
        <h2 className="mb-4 flex items-center gap-2.5 text-sm font-semibold text-foreground">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">1</span>
          Find User by Email
        </h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="flex-1 rounded-xl border border-card-border bg-card-bg px-4 py-2.5 text-sm text-foreground placeholder-muted/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            disabled={searching || !email.trim()}
            className="btn-primary gap-2"
          >
            {searching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            Search
          </button>
        </form>
        {searchError && (
          <p className="mt-3 rounded-lg bg-red-50 dark:bg-red-950/50 p-3 text-xs text-red-600 dark:text-red-400">{searchError}</p>
        )}
      </div>

      {/* Found user */}
      {user && (
        <div className="mt-6 card-elevated rounded-xl p-6 animate-fade-in">
          <div className="flex items-center gap-3">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover border-2 border-card-border" />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                <UserCircle2 size={22} className="text-primary" />
              </div>
            )}
            <div>
              <p className="font-semibold text-foreground">{user.full_name}</p>
              <p className="text-xs text-muted">@{user.username} &middot; {user.email}</p>
            </div>
          </div>

          {/* Existing startup found */}
          {existingStartupId && (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 dark:border-emerald-800/50 dark:bg-emerald-950/30">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/50 p-2">
                  <Building2 size={18} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    Startup profile already exists
                  </p>
                  <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 leading-relaxed">
                    This user already has a startup profile on the platform. All existing data has been fetched from Ments.
                  </p>
                  <Link
                    href={`/dashboard/startups/${existingStartupId}/edit`}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow"
                  >
                    Edit their profile <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* No startup -- show create form */}
          {existingStartupId === null && (
            <div className="mt-5 border-t border-card-border pt-5">
              <h2 className="mb-4 flex items-center gap-2.5 text-sm font-semibold text-foreground">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">2</span>
                Create Startup Profile
              </h2>
              <p className="mb-5 text-sm text-muted leading-relaxed">
                This user has no startup profile yet. Fill in the basics below -- you can complete the full profile after creation.
              </p>
              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted uppercase tracking-wide">Brand Name *</label>
                  <input
                    type="text"
                    value={form.brand_name}
                    onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
                    placeholder="Your startup's name"
                    required
                    className="w-full rounded-xl border border-card-border bg-card-bg px-4 py-2.5 text-sm text-foreground placeholder-muted/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted uppercase tracking-wide">Legal Status</label>
                    <select
                      value={form.legal_status}
                      onChange={(e) => setForm({ ...form, legal_status: e.target.value })}
                      className="w-full rounded-xl border border-card-border bg-card-bg px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      {LEGAL_STATUSES.map((status) => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted uppercase tracking-wide">Stage</label>
                    <select
                      value={form.stage}
                      onChange={(e) => setForm({ ...form, stage: e.target.value })}
                      className="w-full rounded-xl border border-card-border bg-card-bg px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      {STAGES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted uppercase tracking-wide">Contact Email</label>
                    <input
                      type="email"
                      value={form.startup_email}
                      onChange={(e) => setForm({ ...form, startup_email: e.target.value })}
                      placeholder="startup@example.com"
                      className="w-full rounded-xl border border-card-border bg-card-bg px-4 py-2.5 text-sm text-foreground placeholder-muted/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted uppercase tracking-wide">Contact Phone</label>
                    <input
                      type="tel"
                      value={form.startup_phone}
                      onChange={(e) => setForm({ ...form, startup_phone: e.target.value })}
                      placeholder="+91 9876543210"
                      className="w-full rounded-xl border border-card-border bg-card-bg px-4 py-2.5 text-sm text-foreground placeholder-muted/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                {createError && (
                  <p className="rounded-lg bg-red-50 dark:bg-red-950/50 p-3 text-xs text-red-600 dark:text-red-400">{createError}</p>
                )}
                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={creating || !form.brand_name.trim()}
                    className="btn-primary gap-2"
                  >
                    {creating ? <Loader2 size={15} className="animate-spin" /> : <Building2 size={15} />}
                    Create & Edit Full Profile
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
