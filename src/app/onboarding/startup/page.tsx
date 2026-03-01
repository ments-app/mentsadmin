'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Building2, ArrowRight, ArrowLeft, CheckCircle2, Rocket, Sparkles } from 'lucide-react';
import { registerNewStartup, autoRegisterMentsStartup } from '@/actions/rbac';

type Step = 'checking' | 'found' | 1 | 2;

const STAGES = [
  { value: 'ideation', label: 'Ideation', desc: 'Working on the idea, pre-product' },
  { value: 'mvp', label: 'MVP', desc: 'Built and testing a minimum viable product' },
  { value: 'scaling', label: 'Scaling', desc: 'Growing users and revenue' },
  { value: 'expansion', label: 'Expansion', desc: 'Expanding to new markets' },
  { value: 'maturity', label: 'Maturity', desc: 'Established, stable business' },
];

export default function StartupOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('checking');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [mentsName, setMentsName] = useState('');

  // Profile step
  const [profile, setProfile] = useState({ fullName: '', username: '' });
  // Startup step
  const [startup, setStartup] = useState({ brandName: '', stage: 'ideation', startupEmail: '', startupPhone: '' });

  useEffect(() => {
    async function init() {
      // Get auth user info for avatar / email prefill
      const { createBrowserClient } = await import('@supabase/ssr');
      const client = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookieOptions: { name: 'sb-admin-auth' } }
      );
      const { data: { user } } = await client.auth.getUser();
      if (!user) { router.replace('/login'); return; }

      setAvatarUrl(user.user_metadata?.avatar_url || null);
      const googleName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      if (googleName) {
        setProfile(p => ({ ...p, fullName: googleName }));
        setMentsName(googleName);
      }
      setStartup(p => ({ ...p, startupEmail: user.email || '' }));

      // Check if they already have a Ments account
      const result = await autoRegisterMentsStartup();
      if (result.found) {
        setStep('found');
        // Brief pause so user sees the "found" state, then redirect
        setTimeout(() => router.replace('/startup/dashboard'), 1800);
      } else {
        setStep(1);
      }
    }
    init();
  }, [router]);

  async function handleSubmit() {
    setError('');
    if (!profile.fullName.trim()) { setError('Full name is required'); return; }
    if (!profile.username.trim()) { setError('Username is required'); return; }
    if (!/^[a-z0-9_]{3,20}$/.test(profile.username.toLowerCase())) {
      setError('Username must be 3–20 chars: letters, numbers, underscores only');
      return;
    }
    if (!startup.brandName.trim()) { setError('Brand name is required'); return; }
    if (!startup.startupEmail.trim()) { setError('Contact email is required'); return; }

    setLoading(true);
    const result = await registerNewStartup({
      username: profile.username,
      fullName: profile.fullName,
      brandName: startup.brandName,
      stage: startup.stage,
      startupEmail: startup.startupEmail,
      startupPhone: startup.startupPhone || undefined,
    });

    if (!result.success) {
      setError(result.error ?? 'Registration failed');
      setLoading(false);
      return;
    }

    router.push('/startup/dashboard');
  }

  // ── Checking state ───────────────────────────────────────────
  if (step === 'checking') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <Loader2 size={24} className="animate-spin text-primary" />
        <p className="text-sm text-muted">Checking your account...</p>
      </div>
    );
  }

  // ── Found Ments account ──────────────────────────────────────
  if (step === 'found') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <Sparkles size={36} className="text-primary" />
            )}
          </div>
          <h2 className="text-xl font-bold text-foreground">
            Welcome back{mentsName ? `, ${mentsName.split(' ')[0]}` : ''}!
          </h2>
          <p className="mt-2 text-sm text-muted">
            We found your existing Ments account. Setting up your startup dashboard...
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-primary">
            <Loader2 size={15} className="animate-spin" />
            Redirecting...
          </div>
        </div>
      </div>
    );
  }

  // ── New user wizard ──────────────────────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
            <Rocket size={14} className="text-primary" />
            <span className="text-sm font-medium text-primary">Ments for Startups</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">
            {step === 1 ? 'Create your profile' : 'Set up your startup'}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {step === 1
              ? 'This becomes your identity on the Ments platform'
              : 'Your startup will be live on the platform immediately'}
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8 flex items-center gap-2">
          {([1, 2] as const).map((s) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                s < step ? 'bg-primary text-white' :
                s === step ? 'border-2 border-primary text-primary' :
                'border border-card-border text-muted'
              }`}>
                {s < step ? <CheckCircle2 size={14} /> : s}
              </div>
              <span className={`text-xs font-medium ${s === step ? 'text-foreground' : 'text-muted'}`}>
                {s === 1 ? 'Your Profile' : 'Your Startup'}
              </span>
              {s < 2 && <div className={`flex-1 h-px ${s < step ? 'bg-primary' : 'bg-card-border'}`} />}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-card-border bg-card-bg p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger dark:bg-red-950">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              {avatarUrl && (
                <div className="flex items-center gap-3">
                  <img src={avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover border border-card-border" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Profile picture from Google</p>
                    <p className="text-xs text-muted">This will be your avatar on the platform</p>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Full Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))}
                  placeholder="Jane Smith"
                  className="w-full rounded-lg border border-card-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Username <span className="text-danger">*</span>
                </label>
                <div className="flex items-center rounded-lg border border-card-border bg-background focus-within:border-primary">
                  <span className="pl-3 text-sm text-muted">@</span>
                  <input
                    type="text"
                    value={profile.username}
                    onChange={e => setProfile(p => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                    placeholder="yourhandle"
                    maxLength={20}
                    className="flex-1 bg-transparent px-2 py-2.5 text-sm text-foreground outline-none"
                  />
                </div>
                <p className="mt-1 text-xs text-muted">3–20 chars, letters, numbers and underscores only</p>
              </div>

              <button
                onClick={() => {
                  setError('');
                  if (!profile.fullName.trim()) { setError('Full name is required'); return; }
                  if (!profile.username.trim() || !/^[a-z0-9_]{3,20}$/.test(profile.username)) {
                    setError('Username must be 3–20 chars: letters, numbers, underscores only');
                    return;
                  }
                  setStep(2);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-white transition-colors hover:bg-primary/90"
              >
                Continue <ArrowRight size={16} />
              </button>

              <button
                onClick={() => router.push('/onboarding')}
                className="flex w-full items-center justify-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
              >
                <ArrowLeft size={14} /> Back to role selection
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Brand / Startup Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={startup.brandName}
                  onChange={e => setStartup(p => ({ ...p, brandName: e.target.value }))}
                  placeholder="Acme Technologies"
                  className="w-full rounded-lg border border-card-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Current Stage</label>
                <div className="space-y-2">
                  {STAGES.map(s => (
                    <label key={s.value} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      startup.stage === s.value ? 'border-primary bg-primary/5' : 'border-card-border hover:bg-primary-light/30'
                    }`}>
                      <input type="radio" name="stage" value={s.value} checked={startup.stage === s.value}
                        onChange={() => setStartup(p => ({ ...p, stage: s.value }))} className="accent-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.label}</p>
                        <p className="text-xs text-muted">{s.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Contact Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    value={startup.startupEmail}
                    onChange={e => setStartup(p => ({ ...p, startupEmail: e.target.value }))}
                    placeholder="hello@startup.com"
                    className="w-full rounded-lg border border-card-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Contact Phone</label>
                  <input
                    type="tel"
                    value={startup.startupPhone}
                    onChange={e => setStartup(p => ({ ...p, startupPhone: e.target.value }))}
                    placeholder="+91 9876543210"
                    className="w-full rounded-lg border border-card-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted">
                <p className="font-medium text-primary mb-0.5">You're all set</p>
                Your startup goes live on the Ments platform immediately — no review required. Complete your full profile from the dashboard.
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setError(''); setStep(1); }}
                  className="flex items-center gap-2 rounded-lg border border-card-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card-border/30"
                >
                  <ArrowLeft size={15} /> Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Building2 size={16} />}
                  {loading ? 'Creating your account...' : 'Launch my startup'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
