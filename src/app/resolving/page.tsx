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
      <div className="text-center">
        <RefreshCw className="mx-auto animate-spin text-primary" size={32} />
        <p className="mt-4 text-sm text-muted">Loading your dashboard...</p>
      </div>
    </div>
  );
}
