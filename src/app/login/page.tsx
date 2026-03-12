'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AlertCircle, Shield, Users, TrendingUp, Zap, ArrowRight } from 'lucide-react';

import Image from 'next/image';

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
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      {/* Left branding panel */}
      <div
        className="relative hidden w-full overflow-hidden p-8 lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:p-12"
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
        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-black/5 opacity-20 blur-3xl lg:h-96 lg:w-96" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-black/5 opacity-15 blur-3xl lg:h-[500px] lg:w-[500px]" />

        {/* Branding Content Container */}
        <div 
          className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center text-center"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.8s ease, transform 0.8s ease',
          }}
        >
          {/* Top — Logo */}
          <div className="mb-6 flex flex-col items-center gap-3 lg:mb-10 lg:gap-4">
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 lg:h-32 lg:w-32">
              <Image 
                src="/black.png" 
                alt="Ments Logo" 
                fill
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-black sm:text-4xl lg:text-5xl">
              Ments
            </h1>
          </div>

          {/* Tagline */}
          <div className="mb-8 space-y-2 lg:mb-12 lg:space-y-3">
            <h2 className="text-lg font-bold text-black sm:text-xl lg:text-2xl">
              Ecosystem Management Hub
            </h2>
            <p className="mx-auto max-w-sm text-xs leading-relaxed text-black/70 sm:text-sm lg:max-w-md lg:text-base">
              The unified platform for facilitators to nurture startups and for entrepreneurs to scale their businesses through structured support and resources.
            </p>
          </div>

          {/* Feature cards grid */}
          <div className="grid w-full grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
            {[
              {
                icon: Users,
                title: 'Network',
                desc: 'Orchestrate cohorts and experts.',
                delay: 200,
              },
              {
                icon: Shield,
                title: 'Programs',
                desc: 'Track milestones and quality.',
                delay: 350,
              },
              {
                icon: TrendingUp,
                title: 'Insights',
                desc: 'Monitor growth and readiness.',
                delay: 500,
              },
              {
                icon: Zap,
                title: 'Ops Tools',
                desc: 'Centralize jobs and resources.',
                delay: 650,
              },
            ].map(({ icon: Icon, title, desc, delay }) => (
              <div
                key={title}
                className="group flex flex-col items-center gap-2 rounded-xl bg-black/[0.04] p-3 text-center backdrop-blur-sm transition-all duration-300 hover:bg-black/[0.07] sm:p-4 lg:gap-3 lg:rounded-2xl lg:p-6"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(10px)',
                  transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms, background-color 0.2s ease`,
                }}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/10 sm:h-10 sm:w-10 lg:h-12 lg:w-12 lg:rounded-xl">
                  <Icon className="h-4 w-4 text-black sm:h-5 sm:w-5 lg:h-6 lg:w-6" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-black sm:text-xs lg:text-sm">{title}</p>
                  <p className="mt-0.5 text-[9px] leading-tight text-black/60 sm:text-[10px] lg:mt-1 lg:text-[11px]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom — Footer */}
        <div
          className="relative z-10 mt-auto hidden pt-8 lg:block"
          style={{
            opacity: mounted ? 1 : 0,
            transition: 'opacity 0.6s ease 0.7s',
          }}
        >
          <div className="flex items-center gap-2 text-[10px] text-black/40 uppercase tracking-widest">
            <div className="h-px flex-1 bg-black/10" />
            <span>Empowering Entrepreneurs</span>
            <div className="h-px flex-1 bg-black/10" />
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="relative flex flex-1 flex-col items-center justify-center bg-background px-6 py-12 lg:w-1/2 lg:px-12">
        {/* Logo — visible on all screens on this side */}
        <div
          className="mb-8 flex flex-col items-center gap-4"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
          }}
        >
          <Image 
            src="/green.png" 
            alt="Ments Logo" 
            width={64} 
            height={64} 
            className="h-16 w-16 object-contain"
          />
          <span className="text-2xl font-black tracking-tighter text-foreground lg:hidden">Ments</span>
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
          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-muted">
              Sign in to manage your ecosystem
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
              <>
                <svg viewBox="0 0 24 24" className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>{loading ? 'Redirecting...' : 'Continue with Google'}</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="mt-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-card-border" />
            <span className="text-xs text-muted/60">AUTHORIZED ACCESS ONLY</span>
            <div className="h-px flex-1 bg-card-border" />
          </div>

          {/* Info text */}
          <p className="mt-6 text-center text-xs leading-relaxed text-muted/70">
            Access is restricted to verified organizations and startups.
            <br />
            Please use your registered workspace account.
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

      {/* Static Background Pattern */}
      <div className="absolute inset-0 z-[-1] opacity-[0.03] dark:opacity-[0.05]" 
        style={{ 
          backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
