'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

// This page is a transient redirect target.
// The middleware reads the role from admin_profiles and redirects
// to the appropriate dashboard. This page simply shows a spinner.
export default function ResolvingPage() {
  const router = useRouter();

  useEffect(() => {
    // Fallback: if middleware doesn't redirect, push to root after 3s
    const t = setTimeout(() => router.push('/'), 3000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="animate-fade-in text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <RefreshCw className="animate-spin text-primary" size={28} />
        </div>
        <p className="text-sm font-medium text-foreground">Loading your dashboard...</p>
        <p className="mt-1 text-xs text-muted">This should only take a moment</p>
      </div>
    </div>
  );
}
