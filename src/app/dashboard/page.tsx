import { createAdminClient } from '@/lib/supabase-server';
import StatsCard from '@/components/StatsCard';
import { Trophy, Briefcase, Zap, CalendarDays, Package, Users, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

async function getCounts() {
  const supabase = createAdminClient();

  const [competitions, jobs, gigs, events, resources, applications] = await Promise.all([
    supabase.from('competitions').select('id', { count: 'exact', head: true }),
    supabase.from('jobs').select('id', { count: 'exact', head: true }),
    supabase.from('gigs').select('id', { count: 'exact', head: true }),
    supabase.from('events').select('id', { count: 'exact', head: true }),
    supabase.from('resources').select('id', { count: 'exact', head: true }),
    supabase.from('applications').select('id', { count: 'exact', head: true }).neq('status', 'in_progress'),
  ]);

  return {
    competitions: competitions.count ?? 0,
    jobs: jobs.count ?? 0,
    gigs: gigs.count ?? 0,
    events: events.count ?? 0,
    resources: resources.count ?? 0,
    applications: applications.count ?? 0,
  };
}

async function getRecentApplications() {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('applications')
    .select('id, user_name, user_email, user_avatar_url, overall_score, ai_recommendation, status, submitted_at, job_id, gig_id')
    .neq('status', 'in_progress')
    .order('submitted_at', { ascending: false })
    .limit(5);

  if (!data || data.length === 0) return [];

  // Fetch job/gig titles for each application
  const jobIds = [...new Set(data.filter((a) => a.job_id).map((a) => a.job_id!))];
  const gigIds = [...new Set(data.filter((a) => a.gig_id).map((a) => a.gig_id!))];

  const [jobsRes, gigsRes] = await Promise.all([
    jobIds.length > 0
      ? supabase.from('jobs').select('id, title').in('id', jobIds)
      : { data: [] },
    gigIds.length > 0
      ? supabase.from('gigs').select('id, title').in('id', gigIds)
      : { data: [] },
  ]);

  const jobMap = new Map((jobsRes.data || []).map((j: { id: string; title: string }) => [j.id, j.title]));
  const gigMap = new Map((gigsRes.data || []).map((g: { id: string; title: string }) => [g.id, g.title]));

  return data.map((a) => ({
    ...a,
    position_title: a.job_id ? jobMap.get(a.job_id) || 'Unknown Job' : gigMap.get(a.gig_id!) || 'Unknown Gig',
    position_type: a.job_id ? 'job' as const : 'gig' as const,
  }));
}

const recColors: Record<string, string> = {
  strongly_recommend: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  recommend: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  maybe: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  not_recommend: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  pending: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const recLabels: Record<string, string> = {
  strongly_recommend: 'Strongly Recommend',
  recommend: 'Recommend',
  maybe: 'Maybe',
  not_recommend: 'Not Recommend',
  pending: 'Pending',
};

const quickActions = [
  { label: 'Create Job', href: '/dashboard/jobs/create', icon: Briefcase, color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950' },
  { label: 'Create Event', href: '/dashboard/events/create', icon: CalendarDays, color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950' },
  { label: 'Create Gig', href: '/dashboard/gigs/create', icon: Zap, color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950' },
  { label: 'Create Competition', href: '/dashboard/competitions/create', icon: Trophy, color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950' },
];

export default async function DashboardPage() {
  const [counts, recentApps] = await Promise.all([getCounts(), getRecentApplications()]);
  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <div className="space-y-8">
      {/* Page header with greeting */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back, Admin</h1>
        <p className="mt-1 text-sm text-muted">{today} &mdash; Here is an overview of your hub</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="animate-fade-in stagger-1">
          <StatsCard title="Competitions" count={counts.competitions} icon={Trophy} />
        </div>
        <div className="animate-fade-in stagger-2">
          <StatsCard title="Jobs" count={counts.jobs} icon={Briefcase} />
        </div>
        <div className="animate-fade-in stagger-3">
          <StatsCard title="Gigs" count={counts.gigs} icon={Zap} />
        </div>
        <div className="animate-fade-in stagger-4">
          <StatsCard title="Applications" count={counts.applications} icon={Users} />
        </div>
        <div className="animate-fade-in stagger-5">
          <StatsCard title="Events" count={counts.events} icon={CalendarDays} />
        </div>
        <div className="animate-fade-in stagger-6">
          <StatsCard title="Resources" count={counts.resources} icon={Package} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="animate-fade-in stagger-3">
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="card-elevated flex items-center gap-3 p-4 group"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${action.color}`}>
                <action.icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{action.label}</p>
              </div>
              <Plus size={16} className="text-muted opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Applications */}
      <div className="animate-fade-in stagger-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Recent Applications</h2>
          <Link
            href="/dashboard/applications"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
          >
            View All
            <ArrowRight size={14} />
          </Link>
        </div>

        {recentApps.length === 0 ? (
          <div className="card-elevated p-12 text-center">
            <Users size={40} className="mx-auto text-muted/40" />
            <p className="mt-3 text-sm text-muted">No applications yet</p>
          </div>
        ) : (
          <div className="card-elevated overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border bg-surface-hover/50">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Applicant</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Position</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Score</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Recommendation</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Date</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {recentApps.map((app) => {
                    const detailHref = app.position_type === 'job'
                      ? `/dashboard/jobs/${app.job_id}/applications/${app.id}`
                      : `/dashboard/gigs/${app.gig_id}/applications/${app.id}`;
                    return (
                      <tr key={app.id} className="hover:bg-surface-hover/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {app.user_avatar_url ? (
                              <img src={app.user_avatar_url} alt="" className="h-9 w-9 rounded-full object-cover ring-1 ring-card-border" />
                            ) : (
                              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                {(app.user_name || '?')[0].toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-foreground">{app.user_name || 'Unknown'}</p>
                              <p className="text-xs text-muted">{app.user_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-foreground text-xs">{app.position_title}</p>
                          <span className={`text-[10px] font-semibold uppercase ${app.position_type === 'job' ? 'text-blue-600' : 'text-purple-600'}`}>
                            {app.position_type}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-12 rounded-full bg-card-border overflow-hidden">
                              <div
                                className={`h-full rounded-full ${app.overall_score >= 75 ? 'bg-emerald-500' : app.overall_score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${app.overall_score}%` }}
                              />
                            </div>
                            <span className={`text-sm font-bold tabular-nums ${app.overall_score >= 75 ? 'text-emerald-600' : app.overall_score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                              {app.overall_score}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${recColors[app.ai_recommendation] || recColors.pending}`}>
                            {recLabels[app.ai_recommendation] || app.ai_recommendation}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-muted">
                          {app.submitted_at ? format(new Date(app.submitted_at), 'dd MMM yyyy') : '-'}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link href={detailHref} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover transition-colors">
                            View
                            <ArrowRight size={12} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
