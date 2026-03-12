'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AlertCircle, Shield, Users, TrendingUp, Zap, Command, ArrowRight } from 'lucide-react';

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12 selection:bg-primary/20 selection:text-foreground transition-colors duration-500">
      {/* Background Mesh Gradient Effects */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div 
          className="absolute -top-[25%] -left-[10%] h-[70%] w-[70%] rounded-full bg-primary/10 blur-[120px] transition-all duration-1000 ease-in-out dark:bg-primary/5" 
          style={{ opacity: mounted ? 0.6 : 0 }}
        />
        <div 
          className="absolute -bottom-[20%] -right-[10%] h-[60%] w-[60%] rounded-full bg-indigo-500/10 blur-[120px] transition-all duration-1000 ease-in-out dark:bg-indigo-500/5" 
          style={{ opacity: mounted ? 0.4 : 0 }}
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay" />
      </div>

      {/* Main Content Container */}
      <div 
        className="relative z-10 w-full max-w-[440px] transition-all duration-1000 ease-out"
        style={{ 
          opacity: mounted ? 1 : 0, 
          transform: mounted ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.98)' 
        }}
      >
        {/* Logo Section */}
        <div className="mb-10 flex flex-col items-center">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-[0_0_40px_rgba(0,255,162,0.3)] transition-transform duration-500 hover:scale-105 active:scale-95">
            <Command className="h-9 w-9 text-slate-950" strokeWidth={2.5} />
            <div className="absolute -inset-1 animate-pulse rounded-2xl bg-primary/20 blur-sm" />
          </div>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Ments<span className="text-primary">.</span>
          </h1>
          <p className="mt-3 text-center text-[15px] font-medium text-muted/80">
            Administrative Console
          </p>
        </div>

        {/* Card Section */}
        <div className="glass overflow-hidden rounded-[24px] border border-card-border bg-card-bg/40 p-1 shadow-2xl transition-all duration-300 hover:border-primary/20 hover:shadow-primary/5">
          <div className="bg-card-bg/60 px-8 py-10 sm:px-10">
            {/* Header */}
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Welcome back
              </h2>
              <p className="mt-2 text-[14px] text-muted leading-relaxed">
                Log in to manage your platform ecosystem.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="animate-scale-in mb-8 flex items-start gap-3 rounded-xl border border-danger/20 bg-danger/5 p-4 transition-all">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                <p className="text-[13px] font-medium leading-relaxed text-danger">
                  {error}
                </p>
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-card-border bg-white px-6 py-4 text-[15px] font-bold text-[#1F1F1F] shadow-sm transition-all hover:bg-neutral-50 hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 dark:bg-[#1A1A1A] dark:text-white dark:hover:bg-[#222]"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="h-5 w-5 transition-transform group-hover:scale-110" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>{loading ? 'Authenticating...' : 'Sign in with Google'}</span>
                </>
              )}
            </button>

            {/* Features Row - Subtle Icons */}
            <div className="mt-10 grid grid-cols-4 gap-4 border-t border-card-border/50 pt-10">
              {[
                { icon: Users, label: 'Users' },
                { icon: Shield, label: 'Trust' },
                { icon: TrendingUp, label: 'Growth' },
                { icon: Zap, label: 'Fast' },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 group cursor-default">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 border border-primary/10 transition-colors group-hover:bg-primary/10 group-hover:border-primary/20">
                    <item.icon className="h-5 w-5 text-primary/60 transition-colors group-hover:text-primary" />
                  </div>
                  <span className="text-[10px] font-bold tracking-wider text-muted/60 uppercase group-hover:text-muted transition-colors">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-10 flex items-center justify-between px-2 text-xs font-medium text-muted/50 transition-all duration-700 delay-700">
          <p>&copy; 2024 Ments Hub</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-primary transition-colors hover:underline underline-offset-4">Security Policy</a>
            <a href="#" className="hover:text-primary transition-colors hover:underline underline-offset-4 flex items-center gap-1">
              Need Help? <ArrowRight className="h-3 w-3" />
            </a>
          </div>
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
