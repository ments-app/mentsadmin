'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerAsStartup } from '@/actions/rbac';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function StartupOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    displayName: '',
    startupName: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await registerAsStartup({
      displayName: form.displayName,
      startupName: form.startupName,
    });

    if (!result.success) {
      setError(result.error ?? 'Registration failed');
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 size={40} className="text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">You&apos;re Registered!</h2>
          <p className="mt-3 text-muted">
            Your startup account has been created. A facilitator will review and verify your account.
          </p>
          <button
            onClick={() => router.push('/pending-approval')}
            className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-white"
          >
            View Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <button
            onClick={() => router.push('/onboarding')}
            className="flex items-center gap-1 text-sm text-muted hover:text-foreground"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Register as a Startup</h1>
          <p className="mt-1 text-sm text-muted">
            Get verified by a facilitator to unlock full access.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-danger dark:bg-red-950">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Your Name</label>
            <input
              type="text"
              value={form.displayName}
              onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))}
              required
              className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Jane Smith"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Startup Name</label>
            <input
              type="text"
              value={form.startupName}
              onChange={e => setForm(p => ({ ...p, startupName: e.target.value }))}
              required
              className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Acme Technologies"
            />
          </div>

          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-sm text-foreground">
            <p className="font-medium text-primary mb-1">What happens next?</p>
            <ul className="space-y-1 text-muted">
              <li>• Your account will be in <strong>Pending</strong> status</li>
              <li>• A verified facilitator will review and approve you</li>
              <li>• Once approved, you&apos;ll get full dashboard access</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-white disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register Startup'}
          </button>
        </form>
      </div>
    </div>
  );
}
