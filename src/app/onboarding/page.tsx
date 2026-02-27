'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Building2, Rocket } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-foreground">Welcome to Ments</h1>
          <p className="mt-3 text-muted">Choose your role to complete your account setup.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => router.push('/onboarding/facilitator')}
            className="group flex flex-col items-center gap-4 rounded-xl border-2 border-card-border bg-card-bg p-8 text-center transition-all hover:border-primary hover:bg-primary/5"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <Building2 size={28} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Facilitator</h2>
              <p className="mt-1 text-sm text-muted">
                E-Cell, Incubator, Accelerator, or College Cell
              </p>
            </div>
          </button>

          <button
            onClick={() => router.push('/onboarding/startup')}
            className="group flex flex-col items-center gap-4 rounded-xl border-2 border-card-border bg-card-bg p-8 text-center transition-all hover:border-primary hover:bg-primary/5"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <Rocket size={28} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Startup</h2>
              <p className="mt-1 text-sm text-muted">
                Startup looking for talent and resources
              </p>
            </div>
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-muted">
          Wrong account?{' '}
          <button
            onClick={handleLogout}
            className="font-medium text-primary hover:text-primary-hover"
          >
            Sign out
          </button>
        </p>
      </div>
    </div>
  );
}
