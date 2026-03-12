'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AlertCircle, Shield, Users, TrendingUp, Zap } from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const err = searchParams.get('error');
    if (err === 'auth_failed') setError('Authentication failed. Please try again.');
    if (err === 'unauthorized_domain') setError('Access denied. Please use an authorised account.');
  }, [searchParams]);

  async function handleGoogleSignIn() {
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel — hidden on mobile */}
      <div
        className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between"
        style={{
          background: '#00ffa2',
        }}
      >
        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Gradient orbs */}
        <div
          className="absolute -left-24 -top-24 h-96 w-96 rounded-full opacity-20"
          style={{ background: 'rgba(0, 0, 0, 0.05)' }}
        />
        <div
          className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full opacity-15"
          style={{ background: 'rgba(0, 0, 0, 0.05)' }}
        />

        {/* Top — Logo and tagline */}
        <div
          className="relative z-10 px-12 pt-12"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <span className="text-lg font-bold text-white">M</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">Ments</span>
          </div>
          <p className="mt-4 text-lg font-medium text-indigo-100">
            Admin Console
          </p>
          <p className="mt-1 max-w-sm text-sm leading-relaxed text-indigo-200/80">
            Manage your platform, moderate content, and empower entrepreneurs from a single dashboard.
          </p>
        </div>

        {/* Middle — Feature cards */}
        <div className="relative z-10 flex-1 px-12 py-10">
          <div className="flex flex-col gap-4">
            {[
              {
                icon: Users,
                title: 'User Management',
                desc: 'Manage accounts, roles, and permissions',
                delay: 200,
              },
              {
                icon: Shield,
                title: 'Content Moderation',
                desc: 'Review reports and maintain community standards',
                delay: 350,
              },
              {
                icon: TrendingUp,
                title: 'Platform Analytics',
                desc: 'Track growth, engagement, and key metrics',
                delay: 500,
              },
              {
                icon: Zap,
                title: 'Startup Ecosystem',
                desc: 'Oversee profiles, facilitators, and funding',
                delay: 650,
              },
            ].map(({ icon: Icon, title, desc, delay }) => (
              <div
                key={title}
                className="group flex items-start gap-4 rounded-xl bg-white/[0.08] px-5 py-4 backdrop-blur-sm transition-colors duration-200 hover:bg-white/[0.13]"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateX(0)' : 'translateX(-16px)',
                  transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms, background-color 0.2s ease`,
                }}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-[18px] w-[18px] text-indigo-100" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-xs text-indigo-200/70">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom — Footer */}
        <div
          className="relative z-10 px-12 pb-8"
          style={{
            opacity: mounted ? 1 : 0,
            transition: 'opacity 0.6s ease 0.7s',
          }}
        >
          <div className="flex items-center gap-2 text-xs text-indigo-300/60">
            <div className="h-px flex-1 bg-white/10" />
            <span>Empowering Entrepreneurs</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="relative flex w-full flex-col items-center justify-center bg-background px-6 lg:w-1/2">
        {/* Mobile logo — shown only on small screens */}
        <div
          className="mb-10 flex items-center gap-2.5 lg:hidden"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
          }}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <span className="text-base font-bold text-white">M</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">Ments</span>
        </div>

        {/* Login card */}
        <div
          className="w-full max-w-[380px]"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.98)',
            transition: 'opacity 0.5s ease 0.15s, transform 0.5s ease 0.15s',
          }}
        >
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-muted">
              Sign in to access the admin console
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="animate-scale-in mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 dark:border-red-900/50 dark:bg-red-950/50">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" strokeWidth={2} />
              <p className="text-sm leading-snug text-danger">{error}</p>
            </div>
          )}

          {/* Google button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-card-border bg-card-bg px-5 py-3.5 text-[15px] font-medium text-foreground shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? (
              <div className="relative h-5 w-5">
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
              </div>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            <span>{loading ? 'Redirecting...' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="mt-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-card-border" />
            <span className="text-xs text-muted/60">ADMIN ACCESS ONLY</span>
            <div className="h-px flex-1 bg-card-border" />
          </div>

          {/* Info text */}
          <p className="mt-6 text-center text-xs leading-relaxed text-muted/70">
            Access is restricted to authorized administrators.
            <br />
            Contact your team lead if you need access.
          </p>
        </div>

        {/* Footer */}
        <div
          className="absolute bottom-6 text-xs text-muted/40"
          style={{
            opacity: mounted ? 1 : 0,
            transition: 'opacity 0.6s ease 0.8s',
          }}
        >
          Powered by <span className="font-medium text-muted/60">Ments</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
