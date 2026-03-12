'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Rocket, Save } from 'lucide-react';
import { createFacilitatorStartupProfile } from '@/actions/facilitator-startups';

const STAGES = [
  { value: 'ideation', label: 'Ideation' },
  { value: 'mvp', label: 'MVP' },
  { value: 'scaling', label: 'Scaling' },
  { value: 'expansion', label: 'Expansion' },
  { value: 'maturity', label: 'Maturity' },
];

const CATEGORY_OPTIONS = [
  'Technology', 'Healthcare', 'Fintech', 'EdTech', 'E-Commerce', 'SaaS',
  'AI/ML', 'IoT', 'CleanTech', 'AgriTech', 'Social Impact', 'Media',
  'Logistics', 'Real Estate', 'Gaming', 'FoodTech', 'Other',
];

export default function FacilitatorCreateStartupPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    brand_name: '',
    stage: 'ideation',
    description: '',
    startup_email: '',
    startup_phone: '',
    city: '',
    country: '',
    website: '',
    business_model: '',
    categories: [] as string[],
    keywords: '',
  });

  function toggleCategory(cat: string) {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter((c) => c !== cat)
        : [...f.categories, cat],
    }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.brand_name.trim()) {
      setError('Brand name is required');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const { id } = await createFacilitatorStartupProfile({
        brand_name: form.brand_name,
        stage: form.stage,
        description: form.description || undefined,
        startup_email: form.startup_email || undefined,
        startup_phone: form.startup_phone || undefined,
        city: form.city || undefined,
        country: form.country || undefined,
        website: form.website || undefined,
        business_model: form.business_model || undefined,
        categories: form.categories,
        keywords: form.keywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean),
      });
      router.push(`/facilitator/startups/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Creation failed');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <Link
          href="/facilitator/startups"
          className="btn-ghost !p-2 !rounded-xl"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Create Startup</h1>
          <p className="mt-0.5 text-sm text-muted">
            Create a startup profile. You can transfer ownership later.
          </p>
        </div>
      </div>

      <form onSubmit={handleCreate}>
        {/* Basic Info */}
        <div className="card-elevated rounded-xl p-6 mb-6">
          <h2 className="text-base font-semibold text-foreground mb-5">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted uppercase tracking-wide">
                Brand Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.brand_name}
                onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
                placeholder="Startup name"
                required
                className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted uppercase tracking-wide">Stage</label>
                <select
                  value={form.stage}
                  onChange={(e) => setForm({ ...form, stage: e.target.value })}
                  className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  {STAGES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted uppercase tracking-wide">Business Model</label>
                <input
                  type="text"
                  value={form.business_model}
                  onChange={(e) => setForm({ ...form, business_model: e.target.value })}
                  placeholder="e.g. B2B SaaS"
                  className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted uppercase tracking-wide">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of what the startup does..."
                rows={4}
                className="w-full rounded-xl border border-card-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Contact & Location */}
        <div className="card-elevated rounded-xl p-6 mb-6">
          <h2 className="text-base font-semibold text-foreground mb-5">Contact & Location</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted uppercase tracking-wide">Startup Email</label>
                <input
                  type="email"
                  value={form.startup_email}
                  onChange={(e) => setForm({ ...form, startup_email: e.target.value })}
                  placeholder="hello@startup.com"
                  className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted uppercase tracking-wide">Phone</label>
                <input
                  type="tel"
                  value={form.startup_phone}
                  onChange={(e) => setForm({ ...form, startup_phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted uppercase tracking-wide">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g. Mumbai"
                  className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted uppercase tracking-wide">Country</label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  placeholder="e.g. India"
                  className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted uppercase tracking-wide">Website</label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://..."
                className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="card-elevated rounded-xl p-6 mb-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((cat) => {
              const selected = form.categories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    selected
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-background border border-card-border text-muted hover:border-primary hover:text-primary'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-medium text-muted uppercase tracking-wide">Keywords</label>
            <input
              type="text"
              value={form.keywords}
              onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              placeholder="Comma-separated: fintech, payments, UPI"
              className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Error & Submit */}
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/50 p-3 text-xs text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={creating || !form.brand_name.trim()}
            className="btn-primary gap-2"
          >
            {creating ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />}
            {creating ? 'Creating...' : 'Create Startup'}
          </button>
          <p className="text-xs text-muted">
            You&apos;ll be the temporary owner. Transfer ownership anytime from the startup detail page.
          </p>
        </div>
      </form>
    </div>
  );
}
