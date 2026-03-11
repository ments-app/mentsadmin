'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getMyProfile } from '@/actions/rbac';
import { getMyFacilitatorProfile } from '@/actions/rbac';
import { supabase } from '@/lib/supabase';
import { Clock, CheckCircle2, XCircle, ShieldAlert, RefreshCw } from 'lucide-react';

function PendingVerificationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlStatus = searchParams.get('status');

  const [profile, setProfile] = useState<{ verification_status: string; display_name: string | null } | null>(null);
  const [facilitatorProfile, setFacilitatorProfile] = useState<{ organisation_name: string; poc_name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [p, fp] = await Promise.all([getMyProfile(), getMyFacilitatorProfile()]);
      setProfile(p);
      setFacilitatorProfile(fp);
      setLoading(false);

      // If approved, redirect to facilitator dashboard
      if (p?.verification_status === 'approved') {
        router.push('/facilitator/dashboard');
      }
    }
    load();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const status = profile?.verification_status ?? urlStatus ?? 'pending';

  const statusConfig = {
    pending: {
      icon: Clock,
      iconColor: 'text-yellow-500',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      title: 'Verification Under Review',
      message: 'Your application is being reviewed by our team. This typically takes 2-3 business days.',
    },
    rejected: {
      icon: XCircle,
      iconColor: 'text-danger',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      title: 'Application Rejected',
      message: 'Unfortunately, your verification application was not approved. Please contact support for more information.',
    },
    suspended: {
      icon: ShieldAlert,
      iconColor: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      title: 'Account Suspended',
      message: 'Your account has been suspended. Please contact support if you believe this is a mistake.',
    },
    approved: {
      icon: CheckCircle2,
      iconColor: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      title: 'Verified!',
      message: 'Your account has been approved. Redirecting to your dashboard...',
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.pending;
  const Icon = config.icon;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-fade-in flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <RefreshCw className="animate-spin text-primary" size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className={`rounded-2xl border ${config.border} ${config.bg} p-8 text-center`}>
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-card-bg shadow-sm">
            <Icon size={32} className={config.iconColor} />
          </div>
          <h1 className="text-xl font-bold text-foreground">{config.title}</h1>
          <p className="mt-3 text-sm text-muted leading-relaxed">{config.message}</p>
        </div>

        {facilitatorProfile && (
          <div className="card-elevated mt-6 p-6">
            <h2 className="font-semibold text-foreground mb-4">Your Application</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-1">
                <dt className="text-muted">Organisation</dt>
                <dd className="text-foreground font-medium">{facilitatorProfile.organisation_name}</dd>
              </div>
              <div className="h-px bg-card-border" />
              <div className="flex justify-between items-center py-1">
                <dt className="text-muted">Point of Contact</dt>
                <dd className="text-foreground">{facilitatorProfile.poc_name}</dd>
              </div>
              <div className="h-px bg-card-border" />
              <div className="flex justify-between items-center py-1">
                <dt className="text-muted">Status</dt>
                <dd>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400' :
                    status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' :
                    'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                  }`}>
                    {status}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {status === 'pending' && (
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary w-full py-2.5"
            >
              <RefreshCw size={14} />
              Check Status
            </button>
          )}

          {status === 'approved' && (
            <button
              onClick={() => router.push('/facilitator/dashboard')}
              className="btn-primary w-full py-2.5"
            >
              Go to Dashboard
            </button>
          )}

          <button
            onClick={handleLogout}
            className="btn-ghost w-full justify-center py-2.5"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PendingVerificationPage() {
  return (
    <Suspense>
      <PendingVerificationContent />
    </Suspense>
  );
}
