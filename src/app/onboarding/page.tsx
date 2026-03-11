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
      <div className="w-full max-w-lg animate-fade-in">
        {/* Brand badge */}
        <div className="mb-8 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
            <Rocket size={14} className="text-primary" />
            <span className="text-sm font-medium text-primary">Welcome to Ments</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Choose your role</h1>
          <p className="mt-3 text-muted">Select how you'd like to use the platform to get started.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => router.push('/onboarding/facilitator')}
            className="group card-elevated flex flex-col items-center gap-4 p-8 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-200">
              <Building2 size={28} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Facilitator</h2>
              <p className="mt-1.5 text-sm text-muted leading-relaxed">
                E-Cell, Incubator, Accelerator, or College Cell
              </p>
            </div>
          </button>

          <button
            onClick={() => router.push('/onboarding/startup')}
            className="group card-elevated flex flex-col items-center gap-4 p-8 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-200">
              <Rocket size={28} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Startup</h2>
              <p className="mt-1.5 text-sm text-muted leading-relaxed">
                Startup looking for talent and resources
              </p>
            </div>
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-muted">
          Wrong account?{' '}
          <button
            onClick={handleLogout}
            className="font-medium text-primary hover:text-primary-hover transition-colors"
          >
            Sign out
          </button>
        </p>
      </div>
    </div>
  );
}
