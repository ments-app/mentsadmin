'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AlertCircle } from 'lucide-react';
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

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen w-full bg-black text-white font-sans">
      
      {/* Left Panel - Branding & Green Mesh Gradient */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-black p-16 lg:flex">
        {/* Fade-to-black blend on right edge */}
        <div className="absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-r from-transparent to-black pointer-events-none" />
        {/* Glow Effects - strictly Green/Black */}
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="absolute -left-[10%] top-[10%] h-[500px] w-[500px] rounded-full bg-[#00ffa2]/40 blur-[140px]" />
          <div className="absolute left-[30%] top-[40%] h-[600px] w-[600px] rounded-full bg-[#00ffa2]/20 blur-[160px]" />
          <div className="absolute -bottom-[10%] left-[20%] h-[400px] w-[400px] rounded-full bg-white/5 blur-[120px]" />
        </div>
        
        {/* Subtle noise texture */}
        <div className="absolute inset-0 z-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

        {/* Top Content - White Logo */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center">
            <Image 
              src="/black.svg" 
              alt="Ments" 
              width={48} 
              height={48} 
              className="brightness-0 invert" 
            />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">Ments Admin</span>
        </div>

        {/* Bottom Content */}
        <div className="relative z-10 mb-12 max-w-lg">
          <h1 className="text-5xl font-semibold leading-[1.15] text-white">
            Empower the next <br />
            <span className="text-[#00ffa2]">generation</span> of founders.
          </h1>
          <p className="mt-8 text-xl text-neutral-400 font-light leading-relaxed">
            The definitive operating system for incubators, accelerators, and E-Cells to orchestrate their ecosystem. Host events, manage startups, and empower founders with streamlined recruitment and job posting tools—all in one secure dashboard.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex w-full flex-col items-center justify-center px-8 lg:w-1/2 bg-black">
        <div className="w-full max-w-[400px]">
          
          {/* Mobile Logo */}
          <div className="mb-16 flex items-center justify-center gap-4 lg:hidden">
            <Image 
              src="/black.svg" 
              alt="Ments" 
              width={40} 
              height={40} 
              className="dark:brightness-0 dark:invert" 
            />
            <span className="text-2xl font-bold tracking-tight">Ments</span>
          </div>

          <div className="mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-white">Sign in</h2>
            <p className="mt-3 text-neutral-400">
              Access the administrative console to manage the platform.
            </p>
          </div>

          {error && (
            <div className="mb-8 flex items-start gap-3 rounded-lg border border-red-100 bg-red-50/50 p-4 text-sm text-red-600 dark:border-red-900/20 dark:bg-red-900/10 dark:text-red-400 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex w-full items-center justify-center gap-4 rounded-xl border-2 border-neutral-800 bg-neutral-900 px-6 py-4 text-lg font-bold text-white transition-all hover:bg-neutral-800 hover:border-neutral-700 active:scale-[0.99] disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-black dark:border-neutral-700 dark:border-t-white" />
              ) : (
                <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              Continue with Google
            </button>
          </div>

          <div className="mt-16 border-t border-neutral-800 pt-8">
            <p className="text-center text-sm text-neutral-500">
              This system is restricted to authorized Ments Hub administrators. <br />
              <a href="#" className="mt-3 inline-block font-semibold text-[#00ffa2] hover:underline">
                Contact Security Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-100 border-t-[#00ffa2] dark:border-neutral-900" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
