import { createAdminClient } from '@/lib/supabase-server';
import StatsCard from '@/components/StatsCard';
import { Trophy, Briefcase, Zap, CalendarDays, Package } from 'lucide-react';

async function getCounts() {
  const supabase = createAdminClient();

  const [competitions, jobs, gigs, events, resources] = await Promise.all([
    supabase.from('competitions').select('id', { count: 'exact', head: true }),
    supabase.from('jobs').select('id', { count: 'exact', head: true }),
    supabase.from('gigs').select('id', { count: 'exact', head: true }),
    supabase.from('events').select('id', { count: 'exact', head: true }),
    supabase.from('resources').select('id', { count: 'exact', head: true }),
  ]);

  return {
    competitions: competitions.count ?? 0,
    jobs: jobs.count ?? 0,
    gigs: gigs.count ?? 0,
    events: events.count ?? 0,
    resources: resources.count ?? 0,
  };
}

export default async function DashboardPage() {
  const counts = await getCounts();

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="mt-1 text-muted">Overview of your hub content</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatsCard title="Competitions" count={counts.competitions} icon={Trophy} />
        <StatsCard title="Jobs" count={counts.jobs} icon={Briefcase} />
        <StatsCard title="Gigs" count={counts.gigs} icon={Zap} />
        <StatsCard title="Events" count={counts.events} icon={CalendarDays} />
        <StatsCard title="Resources" count={counts.resources} icon={Package} />
      </div>
    </div>
  );
}
