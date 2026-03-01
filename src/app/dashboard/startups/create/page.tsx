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
    <div className="mx-auto max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/startups"
          className="rounded-lg border border-card-border p-1.5 text-muted transition-colors hover:bg-card-border/30 hover:text-foreground"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Create Startup Profile</h1>
          <p className="text-xs text-muted">Search user by email, then create or edit their profile</p>
        </div>
      </div>

      {/* Step 1: Email Search */}
      <div className="mt-6 rounded-lg border border-card-border bg-card-bg p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">1</span>
          Find User by Email
        </h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="flex-1 rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm text-foreground placeholder-muted/50 outline-none transition-colors focus:border-primary"
          />
          <button
            type="submit"
            disabled={searching || !email.trim()}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Search
          </button>
        </form>
        {searchError && (
          <p className="mt-2 text-xs text-danger">{searchError}</p>
        )}
      </div>

      {/* Found user */}
      {user && (
        <div className="mt-4 rounded-lg border border-card-border bg-card-bg p-5">
          <div className="flex items-center gap-3">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover border border-card-border" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <UserCircle2 size={20} className="text-primary" />
              </div>
            )}
            <div>
              <p className="font-medium text-foreground">{user.full_name}</p>
              <p className="text-xs text-muted">@{user.username} · {user.email}</p>
            </div>
          </div>

          {/* Existing startup found */}
          {existingStartupId && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
              <div className="flex items-start gap-2">
                <Building2 size={16} className="mt-0.5 shrink-0 text-green-600 dark:text-green-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    Startup profile already exists
                  </p>
                  <p className="mt-0.5 text-xs text-green-600 dark:text-green-400">
                    This user already has a startup profile on the platform. All existing data has been fetched from Ments.
                  </p>
                  <Link
                    href={`/dashboard/startups/${existingStartupId}/edit`}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-green-700"
                  >
                    Edit their profile <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* No startup — show create form */}
          {existingStartupId === null && (
            <div className="mt-4 border-t border-card-border pt-4">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">2</span>
                Create Startup Profile
              </h2>
              <p className="mb-4 text-xs text-muted">
                This user has no startup profile yet. Fill in the basics below — you can complete the full profile after creation.
              </p>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Brand Name *</label>
                  <input
                    type="text"
                    value={form.brand_name}
                    onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
                    placeholder="Your startup's name"
                    required
                    className="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm text-foreground placeholder-muted/50 outline-none transition-colors focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Stage</label>
                  <select
                    value={form.stage}
                    onChange={(e) => setForm({ ...form, stage: e.target.value })}
                    className="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  >
                    {STAGES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">Contact Email</label>
                    <input
                      type="email"
                      value={form.startup_email}
                      onChange={(e) => setForm({ ...form, startup_email: e.target.value })}
                      placeholder="startup@example.com"
                      className="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm text-foreground placeholder-muted/50 outline-none transition-colors focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">Contact Phone</label>
                    <input
                      type="tel"
                      value={form.startup_phone}
                      onChange={(e) => setForm({ ...form, startup_phone: e.target.value })}
                      placeholder="+91 9876543210"
                      className="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm text-foreground placeholder-muted/50 outline-none transition-colors focus:border-primary"
                    />
                  </div>
                </div>
                {createError && <p className="text-xs text-danger">{createError}</p>}
                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={creating || !form.brand_name.trim()}
                    className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {creating ? <Loader2 size={14} className="animate-spin" /> : <Building2 size={14} />}
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
