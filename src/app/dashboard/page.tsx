import { createAdminClient } from '@/lib/supabase-server';
import StatsCard from '@/components/StatsCard';
import { Trophy, Briefcase, Zap, CalendarDays, Package, Users } from 'lucide-react';
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

export default async function DashboardPage() {
  const [counts, recentApps] = await Promise.all([getCounts(), getRecentApplications()]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="mt-1 text-muted">Overview of your hub content</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <StatsCard title="Competitions" count={counts.competitions} icon={Trophy} />
        <StatsCard title="Jobs" count={counts.jobs} icon={Briefcase} />
        <StatsCard title="Gigs" count={counts.gigs} icon={Zap} />
        <StatsCard title="Applications" count={counts.applications} icon={Users} />
        <StatsCard title="Events" count={counts.events} icon={CalendarDays} />
        <StatsCard title="Resources" count={counts.resources} icon={Package} />
      </div>

      {/* Recent Applications */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Recent Applications</h2>
          <Link
            href="/dashboard/applications"
            className="text-sm font-medium text-primary hover:underline"
          >
            View All
          </Link>
        </div>

        {recentApps.length === 0 ? (
          <div className="rounded-xl border border-card-border bg-card-bg p-8 text-center text-muted">
            No applications yet
          </div>
        ) : (
          <div className="rounded-xl border border-card-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border bg-card-border/10">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Applicant</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Position</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Score</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Recommendation</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Date</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApps.map((app) => {
                    const detailHref = app.position_type === 'job'
                      ? `/dashboard/jobs/${app.job_id}/applications/${app.id}`
                      : `/dashboard/gigs/${app.gig_id}/applications/${app.id}`;
                    return (
                      <tr key={app.id} className="border-b border-card-border last:border-0 hover:bg-card-border/5 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {app.user_avatar_url ? (
                              <img src={app.user_avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                {(app.user_name || '?')[0].toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-foreground">{app.user_name || 'Unknown'}</p>
                              <p className="text-xs text-muted">{app.user_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground text-xs">{app.position_title}</p>
                          <span className={`text-[10px] font-semibold uppercase ${app.position_type === 'job' ? 'text-blue-600' : 'text-purple-600'}`}>
                            {app.position_type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-bold ${app.overall_score >= 75 ? 'text-emerald-600' : app.overall_score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                            {app.overall_score}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded ${recColors[app.ai_recommendation] || recColors.pending}`}>
                            {recLabels[app.ai_recommendation] || app.ai_recommendation}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted">
                          {app.submitted_at ? format(new Date(app.submitted_at), 'dd MMM yyyy') : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={detailHref} className="text-xs font-medium text-primary hover:underline">
                            View
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
