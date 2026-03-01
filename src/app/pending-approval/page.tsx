'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMyProfile } from '@/actions/rbac';
import { supabase } from '@/lib/supabase';
import { Clock, CheckCircle2, XCircle, ShieldAlert, RefreshCw } from 'lucide-react';

function PendingApprovalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlStatus = searchParams.get('status');

  const [status, setStatus] = useState<string>(urlStatus ?? 'pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const profile = await getMyProfile();
      if (profile) {
        setStatus(profile.verification_status);
        if (profile.verification_status === 'approved') {
          router.push('/startup/dashboard');
        }
      }
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const statusConfig = {
    pending: {
      icon: Clock,
      iconColor: 'text-yellow-500',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      title: 'Awaiting Facilitator Approval',
      message:
        'Your startup account is pending review by a facilitator. Once approved, you\'ll have full access to post jobs, events, and more.',
    },
    rejected: {
      icon: XCircle,
      iconColor: 'text-danger',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      title: 'Approval Rejected',
      message: 'Your startup application was rejected. Please contact the facilitator or support for details.',
    },
    suspended: {
      icon: ShieldAlert,
      iconColor: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      title: 'Account Suspended',
      message: 'Your startup account has been suspended. Contact your facilitator or support for help.',
    },
    approved: {
      icon: CheckCircle2,
      iconColor: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      title: 'Approved!',
      message: 'Your startup is verified. Redirecting to your dashboard...',
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.pending;
  const Icon = config.icon;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <RefreshCw className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className={`rounded-xl border ${config.border} ${config.bg} p-8 text-center`}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-card-bg shadow-sm">
            <Icon size={32} className={config.iconColor} />
          </div>
          <h1 className="text-xl font-bold text-foreground">{config.title}</h1>
          <p className="mt-2 text-sm text-muted">{config.message}</p>
        </div>

        <div className="mt-6 rounded-xl border border-card-border bg-card-bg p-6">
          <h2 className="font-semibold text-foreground mb-3">What you get after approval</h2>
          <ul className="space-y-2 text-sm text-muted">
            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-500 shrink-0" /> Post Jobs & Gigs</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-500 shrink-0" /> Host Events & Competitions</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-500 shrink-0" /> View Applicants for your posts</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-500 shrink-0" /> Startup Dashboard Analytics</li>
          </ul>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {status === 'pending' && (
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 w-full rounded-lg border border-card-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-card-border/20"
            >
              <RefreshCw size={14} />
              Check Status
            </button>
          )}
          {status === 'approved' && (
            <button
              onClick={() => router.push('/startup/dashboard')}
              className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-white"
            >
              Go to Dashboard
            </button>
          )}
          <button
            onClick={handleLogout}
            className="w-full rounded-lg border border-card-border bg-background px-4 py-2.5 text-sm font-medium text-muted hover:text-foreground"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PendingApprovalPage() {
  return (
    <Suspense>
      <PendingApprovalContent />
    </Suspense>
  );
}
