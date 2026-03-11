import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Users, Rocket, ShieldCheck, ClipboardList, Trophy, MessageSquare,
  Package, Layers, AlertCircle, UserX, Clock, Briefcase, Zap,
  TrendingUp, TrendingDown, Minus, MapPin, Star, BarChart3,
} from 'lucide-react';
import {
  getPlatformOverview,
  getUserGrowthByDay,
  getApplicationVelocity,
  getContentStats,
  getApplicationFunnel,
  getFacilitatorStats,
  getStartupStats,
  getRecentAuditActivity,
  getTopOpportunities,
  getUserSegmentation,
  getSkillsDemand,
  getGeographicDistribution,
  getContentPipelineHealth,
  getPlatformPulse,
} from '@/actions/analytics';

// ─── Micro-components ─────────────────────────────────────────

function MiniStatCard({
  title,
  count,
  icon: Icon,
  colorClass = 'text-primary',
}: {
  title: string;
  count: number;
  icon: LucideIcon;
  colorClass?: string;
}) {
  return (
    <div className="card-elevated rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-muted leading-tight uppercase tracking-wider">{title}</span>
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${colorClass === 'text-primary' ? 'bg-primary/10' : 'bg-current/10'}`}>
          <Icon size={13} className={colorClass} />
        </div>
      </div>
      <p className={`text-xl font-bold ${colorClass}`}>{count.toLocaleString()}</p>
    </div>
  );
}

function PeriodSwitcher({ current }: { current: number }) {
  return (
    <div className="flex gap-1 rounded-xl border border-card-border bg-card-bg p-1">
      {[7, 30, 90].map((v) => (
        <Link
          key={v}
          href={`/dashboard/analytics?period=${v}`}
          className={[
            'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all',
            current === v ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-foreground hover:bg-card-border/30',
          ].join(' ')}
        >
          {v}d
        </Link>
      ))}
    </div>
  );
}

function DistBar({
  label,
  count,
  total,
  colorClass = 'bg-primary',
}: {
  label: string;
  count: number;
  total: number;
  colorClass?: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-foreground truncate max-w-[65%] capitalize font-medium">{label || '--'}</span>
        <span className="text-muted shrink-0">
          {count} <span className="opacity-60">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 bg-card-border/40 rounded-full overflow-hidden">
        <div className={`h-full ${colorClass} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SortedBars({
  data,
  maxItems = 6,
  colorClass = 'bg-primary',
}: {
  data: Record<string, number>;
  maxItems?: number;
  colorClass?: string;
}) {
  const entries = Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxItems);
  const total = entries.reduce((s, [, c]) => s + c, 0);
  if (entries.length === 0) return <p className="text-xs text-muted">No data</p>;
  return (
    <div className="space-y-2.5">
      {entries.map(([label, count]) => (
        <DistBar key={label} label={label} count={count} total={total || 1} colorClass={colorClass} />
      ))}
    </div>
  );
}

function GrowthBars({
  data,
  colorClass = 'bg-primary',
}: {
  data: { date: string; count: number }[];
  colorClass?: string;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  if (data.length === 0)
    return (
      <div className="h-24 flex items-center">
        <p className="text-xs text-muted">No data</p>
      </div>
    );
  return (
    <div className="flex items-end gap-px h-24 w-full">
      {data.map((d, i) => {
        const heightPct = d.count > 0 ? Math.max((d.count / max) * 100, 4) : 1;
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center justify-end"
            title={`${d.date}: ${d.count}`}
          >
            <div
              className={`w-full rounded-t-sm ${d.count > 0 ? colorClass : 'bg-card-border/40'} transition-all hover:opacity-80`}
              style={{ height: `${heightPct}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

function SectionCard({
  title,
  children,
  className = '',
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`card-elevated rounded-xl p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
      {children}
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const colorClass = value >= 75 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-muted font-medium">{label}</span>
        <span className="font-bold text-foreground">{value}</span>
      </div>
      <div className="h-2 bg-card-border/40 rounded-full overflow-hidden">
        <div className={`h-full ${colorClass} rounded-full transition-all`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

function GrowthBadge({ pct }: { pct: number }) {
  if (pct > 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full dark:bg-emerald-900/30 dark:text-emerald-400">
        <TrendingUp size={9} />+{pct}%
      </span>
    );
  if (pct < 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full dark:bg-red-900/30 dark:text-red-400">
        <TrendingDown size={9} />{pct}%
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-muted bg-card-border/40 px-2 py-0.5 rounded-full">
      <Minus size={9} />0%
    </span>
  );
}

function ActiveRateRing({ pct }: { pct: number }) {
  const color = pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500';
  return (
    <span className={`text-sm font-bold ${color}`}>{pct}%</span>
  );
}

const ACTION_BADGE_COLORS: Record<string, string> = {
  approve: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  reject: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  create: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  update: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  delete: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  claim: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
};

function actionBadgeClass(actionType: string): string {
  const key = Object.keys(ACTION_BADGE_COLORS).find((k) => actionType.startsWith(k));
  return key ? ACTION_BADGE_COLORS[key] : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
}

const AI_REC_COLOR: Record<string, string> = {
  'Strongly Recommend': 'bg-emerald-500',
  Recommend: 'bg-blue-500',
  Maybe: 'bg-amber-500',
  'Not Recommend': 'bg-red-500',
  Pending: 'bg-gray-400',
};

// ─── Page ─────────────────────────────────────────────────────

type Props = { searchParams: Promise<{ period?: string }> };

export default async function AnalyticsPage({ searchParams }: Props) {
  const params = await searchParams;
  const raw = params.period ?? '30';
  const period = ['7', '30', '90'].includes(raw) ? Number(raw) : 30;

  const [
    overview, growth, appVelocity, content, funnel,
    facilitatorStats, startupStats, auditLog, topOpps,
    userSeg, skills, geo, pipeline, pulse,
  ] = await Promise.all([
    getPlatformOverview(),
    getUserGrowthByDay(period),
    getApplicationVelocity(period),
    getContentStats(),
    getApplicationFunnel(),
    getFacilitatorStats(),
    getStartupStats(),
    getRecentAuditActivity(12),
    getTopOpportunities(),
    getUserSegmentation(),
    getSkillsDemand(20),
    getGeographicDistribution(),
    getContentPipelineHealth(),
    getPlatformPulse(period),
  ]);

  const totalContent =
    overview.jobs + overview.gigs + overview.events + overview.competitions + overview.resources;

  const newUsersInPeriod = growth.reduce((s, d) => s + d.count, 0);
  const newAppsInPeriod = appVelocity.reduce((s, d) => s + d.count, 0);

  return (
    <div className="animate-fade-in space-y-6">
      {/* ── 1. Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <BarChart3 size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Platform Analytics</h1>
            <p className="text-sm text-muted">
              Deep intelligence across users, content, applications, and growth -- last {period} days
            </p>
          </div>
        </div>
        <PeriodSwitcher current={period} />
      </div>

      {/* ── 2. Platform Pulse (period-over-period growth) ── */}
      <div>
        <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">
          Period-over-Period Growth
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* User Growth */}
          <div className="card-elevated rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-medium text-muted mb-1">New Users</p>
                <p className="text-2xl font-bold text-foreground">{pulse.users.current}</p>
              </div>
              <GrowthBadge pct={pulse.users.growth} />
            </div>
            <p className="text-[10px] text-muted">
              vs {pulse.users.prev} prev period -- {overview.users.toLocaleString()} total
            </p>
          </div>

          {/* Application Growth */}
          <div className="card-elevated rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-medium text-muted mb-1">Applications</p>
                <p className="text-2xl font-bold text-foreground">{pulse.applications.current}</p>
              </div>
              <GrowthBadge pct={pulse.applications.growth} />
            </div>
            <p className="text-[10px] text-muted">
              vs {pulse.applications.prev} prev period -- {overview.applications.toLocaleString()} total
            </p>
          </div>

          {/* Content Posted */}
          <div className="card-elevated rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-medium text-muted mb-1">Content Posted</p>
                <p className="text-2xl font-bold text-foreground">{pulse.contentPosted.current}</p>
              </div>
              <GrowthBadge pct={pulse.contentPosted.growth} />
            </div>
            <p className="text-[10px] text-muted">
              vs {pulse.contentPosted.prev} prev -- jobs + gigs
            </p>
          </div>

          {/* Total Capital Raised */}
          <div className="rounded-xl border-2 border-primary/20 bg-primary/[0.03] p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-medium text-muted mb-1">Capital Raised (Platform)</p>
                <p className="text-2xl font-bold text-primary">
                  {pulse.totalRaisedAcrossPlatform > 0
                    ? `₹${(pulse.totalRaisedAcrossPlatform / 10000000).toFixed(1)}Cr`
                    : '--'}
                </p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Star size={14} className="text-primary" />
              </div>
            </div>
            <p className="text-[10px] text-muted">
              Avg {pulse.avgApplicationsPerJob} apps/job -- {pulse.avgApplicationsPerGig} apps/gig
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. KPI Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <MiniStatCard title="Total Users" count={overview.users} icon={Users} />
        <MiniStatCard title="Startups" count={overview.startups} icon={Rocket} />
        <MiniStatCard title="Facilitators" count={overview.facilitators} icon={ShieldCheck} />
        <MiniStatCard title="Applications" count={overview.applications} icon={ClipboardList} />
        <MiniStatCard title="Comp. Entries" count={overview.competitionEntries} icon={Trophy} />
        <MiniStatCard title="Active Posts" count={overview.activePosts} icon={MessageSquare} />
        <MiniStatCard title="Resources" count={overview.resources} icon={Package} />
        <MiniStatCard title="Total Content" count={totalContent} icon={Layers} />
      </div>

      {/* ── 4. Velocity Charts (User Growth + Application Velocity) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title={`User Signups — Last ${period} Days`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xl font-bold text-primary">{newUsersInPeriod}</span>
              <span className="text-xs text-muted ml-1.5">new users</span>
            </div>
            <GrowthBadge pct={pulse.users.growth} />
          </div>
          <GrowthBars data={growth} colorClass="bg-primary" />
          <div className="flex justify-between text-[10px] text-muted mt-1.5">
            <span>{growth[0]?.date ?? ''}</span>
            <span>{growth[growth.length - 1]?.date ?? ''}</span>
          </div>
        </SectionCard>

        <SectionCard title={`Application Velocity — Last ${period} Days`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xl font-bold text-blue-600">{newAppsInPeriod}</span>
              <span className="text-xs text-muted ml-1.5">submissions</span>
            </div>
            <GrowthBadge pct={pulse.applications.growth} />
          </div>
          <GrowthBars data={appVelocity} colorClass="bg-blue-500" />
          <div className="flex justify-between text-[10px] text-muted mt-1.5">
            <span>{appVelocity[0]?.date ?? ''}</span>
            <span>{appVelocity[appVelocity.length - 1]?.date ?? ''}</span>
          </div>
        </SectionCard>
      </div>

      {/* ── 5. User Intelligence ── */}
      <div className="card-elevated rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">User Intelligence</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          <div className="rounded-xl bg-card-border/20 p-4 text-center">
            <p className="text-xl font-bold text-foreground">{userSeg.total.toLocaleString()}</p>
            <p className="text-[10px] font-medium text-muted mt-1">Total Users</p>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-200/50 p-4 text-center dark:bg-emerald-900/20 dark:border-emerald-800/40">
            <p className="text-xl font-bold text-emerald-600">{userSeg.verified.toLocaleString()}</p>
            <p className="text-[10px] font-medium text-muted mt-1">Verified ({userSeg.verificationRate}%)</p>
          </div>
          <div className="rounded-xl bg-blue-50 border border-blue-200/50 p-4 text-center dark:bg-blue-900/20 dark:border-blue-800/40">
            <p className="text-xl font-bold text-blue-600">{userSeg.newThisWeek}</p>
            <p className="text-[10px] font-medium text-muted mt-1">New This Week</p>
          </div>
          <div className="rounded-xl bg-violet-50 border border-violet-200/50 p-4 text-center dark:bg-violet-900/20 dark:border-violet-800/40">
            <p className="text-xl font-bold text-violet-600">{userSeg.newThisMonth}</p>
            <p className="text-[10px] font-medium text-muted mt-1">New This Month</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-muted mb-3">User Type Distribution</p>
            <SortedBars data={userSeg.byUserType} colorClass="bg-blue-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted mb-3">Account Health Metrics</p>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted font-medium">Verification Rate</span>
                  <span className="font-bold text-emerald-600">{userSeg.verificationRate}%</span>
                </div>
                <div className="h-2 bg-card-border/40 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${userSeg.verificationRate}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted font-medium">Suspension Rate</span>
                  <span className={`font-bold ${userSeg.suspensionRate > 5 ? 'text-red-600' : 'text-muted'}`}>
                    {userSeg.suspensionRate}%
                  </span>
                </div>
                <div className="h-2 bg-card-border/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${userSeg.suspensionRate > 5 ? 'bg-red-500' : 'bg-amber-400'}`}
                    style={{ width: `${Math.min(userSeg.suspensionRate * 5, 100)}%` }}
                  />
                </div>
              </div>
              <div className="pt-1">
                <p className="text-xs text-muted">
                  <span className="font-bold text-foreground">{userSeg.suspended}</span> suspended ·&nbsp;
                  <span className="font-bold text-foreground">
                    {userSeg.total - userSeg.verified}
                  </span> unverified ·&nbsp;
                  <span className="font-bold text-foreground">
                    {funnel.unique_applicants}
                  </span> have applied
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 6. Facilitator + Startup Ecosystem ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Facilitator Ecosystem">
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted mb-3">Verification Status</p>
            <SortedBars data={facilitatorStats.byVerificationStatus} maxItems={5} />
          </div>
          <div className="flex gap-6 mb-4 pt-3 border-t border-card-border">
            <div>
              <p className="text-lg font-bold text-foreground">{facilitatorStats.total}</p>
              <p className="text-xs text-muted">Total</p>
            </div>
            <div>
              <p className="text-lg font-bold text-primary">{facilitatorStats.totalStudents}</p>
              <p className="text-xs text-muted">Total Students</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">
                {facilitatorStats.total > 0
                  ? Math.round(facilitatorStats.totalStudents / facilitatorStats.total)
                  : 0}
              </p>
              <p className="text-xs text-muted">Avg Students</p>
            </div>
          </div>
          {facilitatorStats.topByStudents.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted mb-3">Top Facilitators</p>
              <div className="space-y-1">
                {facilitatorStats.topByStudents.map((f, i) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between text-xs py-2 border-b border-card-border/50 last:border-0 transition-colors hover:bg-primary/[0.03] rounded-lg px-2 -mx-2"
                  >
                    <span className="flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-card-border/40 text-[10px] font-bold text-muted">{i + 1}</span>
                      <span className="text-foreground truncate max-w-[140px] font-medium">{f.name}</span>
                    </span>
                    <span className="flex gap-3 text-muted shrink-0">
                      <span>{f.studentCount} students</span>
                      <span>{f.startupCount} startups</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Startup Ecosystem">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl bg-primary/[0.04] border border-primary/15 p-3 text-center">
              <p className="text-lg font-bold text-primary">{startupStats.published}</p>
              <p className="text-[10px] font-medium text-muted">Published</p>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-200/50 p-3 text-center dark:bg-amber-900/20 dark:border-amber-800/40">
              <p className="text-lg font-bold text-amber-600">{startupStats.featured}</p>
              <p className="text-[10px] font-medium text-muted">Featured</p>
            </div>
            <div className="rounded-xl bg-blue-50 border border-blue-200/50 p-3 text-center dark:bg-blue-900/20 dark:border-blue-800/40">
              <p className="text-lg font-bold text-blue-600">{startupStats.activelyRaising}</p>
              <p className="text-[10px] font-medium text-muted">Raising</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-muted mb-3">Stage Distribution</p>
              <SortedBars data={startupStats.byStage} maxItems={6} colorClass="bg-violet-500" />
            </div>
            <div>
              {startupStats.topCategories.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-muted mb-3">Top Categories</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {startupStats.topCategories.map(({ category, count }) => (
                      <span
                        key={category}
                        className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold"
                      >
                        {category} ({count})
                      </span>
                    ))}
                  </div>
                </>
              )}
              <div className="flex gap-4 pt-2">
                {startupStats.avgTotalRaised > 0 && (
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {(startupStats.avgTotalRaised / 100000).toFixed(1)}L
                    </p>
                    <p className="text-[10px] text-muted">Avg Raised</p>
                  </div>
                )}
                {startupStats.avgInvestorCount > 0 && (
                  <div>
                    <p className="text-sm font-bold text-foreground">{startupStats.avgInvestorCount}</p>
                    <p className="text-[10px] text-muted">Avg Investors</p>
                  </div>
                )}
                {startupStats.topCities[0] && (
                  <div>
                    <p className="text-sm font-bold text-foreground">{startupStats.topCities[0].city}</p>
                    <p className="text-[10px] text-muted">Top City</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ── 7. Application Analytics ── */}
      <div className="card-elevated rounded-xl p-5">
        <div className="flex items-center gap-3 mb-5">
          <h3 className="text-sm font-semibold text-foreground">Application Analytics</h3>
          <span className="rounded-md bg-card-border/40 px-2 py-0.5 text-xs font-medium text-muted">{funnel.total.toLocaleString()} submissions</span>
          <span className="rounded-md bg-card-border/40 px-2 py-0.5 text-xs font-medium text-muted">{funnel.unique_applicants} unique applicants</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
          {/* Status Funnel */}
          <div>
            <p className="text-xs font-semibold text-muted mb-3">Status Funnel</p>
            {funnel.funnel.length === 0 ? (
              <p className="text-xs text-muted">No data</p>
            ) : (
              <div className="space-y-2.5">
                {funnel.funnel.map((f) => (
                  <DistBar
                    key={f.status}
                    label={f.status}
                    count={f.count}
                    total={funnel.total || 1}
                    colorClass={
                      f.status === 'shortlisted' ? 'bg-emerald-500' :
                      f.status === 'reviewed' ? 'bg-blue-500' :
                      f.status === 'rejected' ? 'bg-red-500' : 'bg-primary'
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* AI Recommendations */}
          <div>
            <p className="text-xs font-semibold text-muted mb-3">AI Recommendations</p>
            {funnel.aiRecommendations.length === 0 ? (
              <p className="text-xs text-muted">No data</p>
            ) : (
              <div className="space-y-2.5">
                {funnel.aiRecommendations.map((r) => (
                  <DistBar
                    key={r.label}
                    label={r.label}
                    count={r.count}
                    total={funnel.total || 1}
                    colorClass={AI_REC_COLOR[r.label] ?? 'bg-gray-400'}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Score Averages + Integrity */}
          <div>
            <p className="text-xs font-semibold text-muted mb-3">Score Averages</p>
            <div className="space-y-3 mb-5">
              <ScoreBar label="Overall Score" value={funnel.avgScores.overall} />
              <ScoreBar label="Match Score" value={funnel.avgScores.match} />
              <ScoreBar label="Interview Score" value={funnel.avgScores.interview} />
            </div>
            <p className="text-xs font-semibold text-muted mb-2">Integrity Signals</p>
            <div className="flex gap-5">
              <div>
                <p className="text-lg font-bold text-foreground">{funnel.integrity.avgTabSwitches}</p>
                <p className="text-[10px] text-muted">Avg Tab Switches</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{funnel.integrity.avgTimeMinutes}m</p>
                <p className="text-[10px] text-muted">Avg Time</p>
              </div>
            </div>
          </div>
        </div>

        {/* Score Distribution */}
        {funnel.scoreDistribution.length > 0 && (
          <div className="pt-4 border-t border-card-border">
            <p className="text-xs font-semibold text-muted mb-3">Score Distribution (Overall)</p>
            <div className="grid grid-cols-4 gap-3">
              {funnel.scoreDistribution.map(({ bucket, count }) => {
                const pct = funnel.total > 0 ? Math.round((count / funnel.total) * 100) : 0;
                const color = bucket === '76–100' ? 'bg-emerald-500' :
                              bucket === '51–75' ? 'bg-blue-500' :
                              bucket === '26–50' ? 'bg-amber-500' : 'bg-red-500';
                const textColor = bucket === '76–100' ? 'text-emerald-600' :
                                  bucket === '51–75' ? 'text-blue-600' :
                                  bucket === '26–50' ? 'text-amber-600' : 'text-red-600';
                return (
                  <div key={bucket} className="text-center rounded-xl bg-card-border/20 p-3">
                    <div className={`text-lg font-bold ${textColor}`}>{pct}%</div>
                    <div className="h-2 bg-card-border/40 rounded-full overflow-hidden my-1.5">
                      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-[10px] text-muted font-medium">{bucket}</div>
                    <div className="text-[10px] text-foreground font-bold">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 8. Content Pipeline Health ── */}
      <div className="card-elevated rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Content Pipeline Health</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {[
            { label: 'Jobs', item: pipeline.jobs, color: 'text-blue-600' },
            { label: 'Gigs', item: pipeline.gigs, color: 'text-violet-600' },
            { label: 'Events', item: pipeline.events, color: 'text-amber-600' },
            { label: 'Competitions', item: pipeline.competitions, color: 'text-emerald-600' },
          ].map(({ label, item, color }) => (
            <div key={label} className="rounded-xl border border-card-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted">{label}</span>
                <ActiveRateRing pct={item.activeRate} />
              </div>
              <div className="h-2 bg-card-border/40 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    item.activeRate >= 75 ? 'bg-emerald-500' :
                    item.activeRate >= 50 ? 'bg-amber-500' : 'bg-red-400'
                  }`}
                  style={{ width: `${item.activeRate}%` }}
                />
              </div>
              <p className="text-[10px] text-muted">
                <span className={`font-bold ${color}`}>{item.active}</span> active / {item.total} total
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-card-border">
          <div>
            <p className="text-xs font-semibold text-muted mb-2">Expiring in Next 7 Days</p>
            <div className="flex gap-3">
              {pipeline.expiringSoon.jobs > 0 && (
                <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${pipeline.expiringSoon.jobs > 5 ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-card-border/30 text-muted'}`}>
                  <span className="font-bold">{pipeline.expiringSoon.jobs}</span> jobs
                </span>
              )}
              {pipeline.expiringSoon.gigs > 0 && (
                <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${pipeline.expiringSoon.gigs > 5 ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-card-border/30 text-muted'}`}>
                  <span className="font-bold">{pipeline.expiringSoon.gigs}</span> gigs
                </span>
              )}
              {pipeline.expiringSoon.competitions > 0 && (
                <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${pipeline.expiringSoon.competitions > 3 ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-card-border/30 text-muted'}`}>
                  <span className="font-bold">{pipeline.expiringSoon.competitions}</span> competitions
                </span>
              )}
              {pipeline.expiringSoon.jobs === 0 && pipeline.expiringSoon.gigs === 0 && pipeline.expiringSoon.competitions === 0 && (
                <span className="text-xs text-muted">Nothing expiring soon</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted mb-2">Added in Last 7 Days</p>
            <div className="flex gap-3 text-xs">
              <span className="text-muted"><span className="font-bold text-foreground">{pipeline.recentlyAdded.jobs}</span> jobs</span>
              <span className="text-muted"><span className="font-bold text-foreground">{pipeline.recentlyAdded.gigs}</span> gigs</span>
              <span className="text-muted"><span className="font-bold text-foreground">{pipeline.recentlyAdded.events}</span> events</span>
              <span className="text-muted"><span className="font-bold text-foreground">{pipeline.recentlyAdded.competitions}</span> comps</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 9. Content Deep Dive ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SectionCard title="Jobs Breakdown">
          <div className="flex gap-4 mb-4">
            <div>
              <p className="text-lg font-bold text-foreground">{content.jobs.total}</p>
              <p className="text-xs text-muted">Total</p>
            </div>
            <div>
              <p className="text-lg font-bold text-primary">{content.jobs.active}</p>
              <p className="text-xs text-muted">Active</p>
            </div>
          </div>
          <p className="text-xs font-semibold text-muted mb-2">By Category</p>
          <SortedBars data={content.jobs.byCategory} colorClass="bg-blue-500" />
          <p className="text-xs font-semibold text-muted mt-4 mb-2">By Type</p>
          <SortedBars data={content.jobs.byType} maxItems={4} colorClass="bg-blue-400" />
          <p className="text-xs font-semibold text-muted mt-4 mb-2">By Work Mode</p>
          <SortedBars data={content.jobs.byWorkMode} maxItems={4} colorClass="bg-blue-300" />
        </SectionCard>

        <SectionCard title="Gigs Breakdown">
          <div className="flex gap-4 mb-4">
            <div>
              <p className="text-lg font-bold text-foreground">{content.gigs.total}</p>
              <p className="text-xs text-muted">Total</p>
            </div>
            <div>
              <p className="text-lg font-bold text-primary">{content.gigs.active}</p>
              <p className="text-xs text-muted">Active</p>
            </div>
          </div>
          <p className="text-xs font-semibold text-muted mb-2">By Category</p>
          <SortedBars data={content.gigs.byCategory} colorClass="bg-violet-500" />
          <p className="text-xs font-semibold text-muted mt-4 mb-2">By Payment Type</p>
          <SortedBars data={content.gigs.byPaymentType} maxItems={4} colorClass="bg-violet-400" />
          <p className="text-xs font-semibold text-muted mt-4 mb-2">By Visibility</p>
          <SortedBars data={content.gigs.byVisibility} maxItems={3} colorClass="bg-violet-300" />
        </SectionCard>

        <SectionCard title="Competitions Breakdown">
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="text-center rounded-xl bg-card-border/20 p-2.5">
              <p className="text-base font-bold text-foreground">{content.competitions.total}</p>
              <p className="text-[10px] font-medium text-muted">Total</p>
            </div>
            <div className="text-center rounded-xl bg-primary/[0.04] border border-primary/15 p-2.5">
              <p className="text-base font-bold text-primary">{content.competitions.active}</p>
              <p className="text-[10px] font-medium text-muted">Active</p>
            </div>
            <div className="text-center rounded-xl bg-amber-50 border border-amber-200/50 p-2.5 dark:bg-amber-900/20 dark:border-amber-800/40">
              <p className="text-base font-bold text-amber-600">{content.competitions.featured}</p>
              <p className="text-[10px] font-medium text-muted">Featured</p>
            </div>
            <div className="text-center rounded-xl bg-blue-50 border border-blue-200/50 p-2.5 dark:bg-blue-900/20 dark:border-blue-800/40">
              <p className="text-base font-bold text-blue-600">{content.competitions.external}</p>
              <p className="text-[10px] font-medium text-muted">External</p>
            </div>
          </div>
          <p className="text-xs font-semibold text-muted mb-2">By Domain</p>
          <SortedBars data={content.competitions.byDomain} colorClass="bg-emerald-500" />
          <p className="text-xs font-semibold text-muted mt-4 mb-2">By Participation</p>
          <SortedBars data={content.competitions.byParticipationType} maxItems={3} colorClass="bg-emerald-400" />
        </SectionCard>
      </div>

      {/* ── 10. Skills Demand ── */}
      {skills.length > 0 && (
        <SectionCard title="Skills in Demand (Active Jobs + Gigs)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tag cloud */}
            <div>
              <p className="text-xs font-semibold text-muted mb-3">Trending Skills</p>
              <div className="flex flex-wrap gap-2">
                {skills.slice(0, 20).map(({ skill, count }, i) => {
                  const maxCount = skills[0]?.count ?? 1;
                  const intensity = Math.round((count / maxCount) * 4);
                  const sizes = ['text-[10px]', 'text-xs', 'text-sm', 'text-base', 'text-lg'];
                  const opacities = ['opacity-40', 'opacity-60', 'opacity-75', 'opacity-90', 'opacity-100'];
                  return (
                    <span
                      key={skill}
                      className={`${sizes[intensity]} ${opacities[intensity]} font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary cursor-default transition-opacity hover:opacity-100`}
                      title={`${count} occurrences`}
                    >
                      {skill}
                    </span>
                  );
                })}
              </div>
            </div>
            {/* Top 10 as bars */}
            <div>
              <p className="text-xs font-semibold text-muted mb-3">Top 10 by Demand</p>
              <div className="space-y-2.5">
                {skills.slice(0, 10).map(({ skill, count }) => (
                  <DistBar
                    key={skill}
                    label={skill}
                    count={count}
                    total={skills[0]?.count ?? 1}
                    colorClass="bg-primary"
                  />
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── 11. Geographic Distribution ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {geo.startupCities.length > 0 && (
          <SectionCard title="Startup Cities">
            <div className="space-y-2">
              {geo.startupCities.map(({ city, count }, i) => (
                <div key={city} className="flex items-center justify-between text-xs py-2 border-b border-card-border/50 last:border-0 transition-colors hover:bg-primary/[0.03] rounded-lg px-2 -mx-2">
                  <span className="flex items-center gap-2">
                    <MapPin size={10} className="text-primary shrink-0" />
                    <span className="text-foreground truncate font-medium">{city}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <div className="h-2 w-16 bg-card-border/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.round((count / geo.startupCities[0].count) * 100)}%` }}
                      />
                    </div>
                    <span className="text-muted shrink-0 w-6 text-right font-semibold">{count}</span>
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {geo.jobLocations.length > 0 && (
          <SectionCard title="Job Locations">
            <div className="space-y-2">
              {geo.jobLocations.map(({ location, count }) => (
                <div key={location} className="flex items-center justify-between text-xs py-2 border-b border-card-border/50 last:border-0 transition-colors hover:bg-primary/[0.03] rounded-lg px-2 -mx-2">
                  <span className="flex items-center gap-2">
                    <MapPin size={10} className="text-blue-500 shrink-0" />
                    <span className="text-foreground truncate max-w-[140px] font-medium">{location}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <div className="h-2 w-16 bg-card-border/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${Math.round((count / geo.jobLocations[0].count) * 100)}%` }}
                      />
                    </div>
                    <span className="text-muted shrink-0 w-6 text-right font-semibold">{count}</span>
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {geo.gigLocations.length > 0 && (
          <SectionCard title="Gig Locations">
            <div className="space-y-2">
              {geo.gigLocations.map(({ location, count }) => (
                <div key={location} className="flex items-center justify-between text-xs py-2 border-b border-card-border/50 last:border-0 transition-colors hover:bg-primary/[0.03] rounded-lg px-2 -mx-2">
                  <span className="flex items-center gap-2">
                    <MapPin size={10} className="text-violet-500 shrink-0" />
                    <span className="text-foreground truncate max-w-[140px] font-medium">{location}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <div className="h-2 w-16 bg-card-border/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full transition-all"
                        style={{ width: `${Math.round((count / geo.gigLocations[0].count) * 100)}%` }}
                      />
                    </div>
                    <span className="text-muted shrink-0 w-6 text-right font-semibold">{count}</span>
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Content volume breakdown as fallback if geo empty */}
        {geo.startupCities.length === 0 && geo.jobLocations.length === 0 && geo.gigLocations.length === 0 && (
          <div className="md:col-span-3">
            <SectionCard title="Content Volume Breakdown">
              <div className="grid grid-cols-5 gap-3">
                {[
                  { label: 'Jobs', count: overview.jobs, color: 'bg-blue-500' },
                  { label: 'Gigs', count: overview.gigs, color: 'bg-violet-500' },
                  { label: 'Events', count: overview.events, color: 'bg-amber-500' },
                  { label: 'Competitions', count: overview.competitions, color: 'bg-emerald-500' },
                  { label: 'Resources', count: overview.resources, color: 'bg-rose-500' },
                ].map(({ label, count, color }) => (
                  <div key={label} className="text-center rounded-xl bg-card-border/20 p-3">
                    <p className="text-lg font-bold text-foreground">{count}</p>
                    <div className={`h-1.5 ${color} rounded-full my-1.5 mx-auto w-8`} />
                    <p className="text-[10px] font-medium text-muted">{label}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}
      </div>

      {/* ── 12. Platform Health ── */}
      <div>
        <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Platform Health</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-elevated rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
                <MessageSquare size={13} className="text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-muted">Posts Health</span>
            </div>
            <p className="text-xl font-bold text-foreground">{overview.activePosts.toLocaleString()}</p>
            <p className="text-xs text-muted mt-1">Active posts on platform</p>
          </div>

          <div
            className={`rounded-xl border-2 p-5 transition-colors ${
              overview.pendingReports > 10
                ? 'border-amber-400/60 bg-amber-50/50 dark:bg-amber-950/20'
                : 'card-elevated'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${overview.pendingReports > 10 ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-card-border/30'}`}>
                <AlertCircle
                  size={13}
                  className={overview.pendingReports > 10 ? 'text-amber-600' : 'text-muted'}
                />
              </div>
              <span className={`text-xs font-semibold ${overview.pendingReports > 10 ? 'text-amber-700 dark:text-amber-400' : 'text-muted'}`}>
                Pending Reports
              </span>
            </div>
            <p className={`text-xl font-bold ${overview.pendingReports > 10 ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'}`}>
              {overview.pendingReports}
            </p>
            {overview.pendingReports > 10 ? (
              <Link href="/dashboard/feed?tab=reports" className="text-xs text-amber-600 hover:underline mt-1 block font-semibold">
                Needs attention →
              </Link>
            ) : (
              <p className="text-xs text-muted mt-1">Post reports pending</p>
            )}
          </div>

          <div className="card-elevated rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/30">
                <UserX size={13} className="text-red-500" />
              </div>
              <span className="text-xs font-semibold text-muted">Suspended Users</span>
            </div>
            <p className="text-xl font-bold text-foreground">{overview.suspendedUsers}</p>
            <p className="text-xs text-muted mt-1">
              {userSeg.suspensionRate}% suspension rate
            </p>
          </div>

          <div
            className={`rounded-xl border-2 p-5 transition-colors ${
              overview.pendingFacilitators > 0
                ? 'border-amber-400/60 bg-amber-50/50 dark:bg-amber-950/20'
                : 'card-elevated'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${overview.pendingFacilitators > 0 ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-card-border/30'}`}>
                <Clock
                  size={13}
                  className={overview.pendingFacilitators > 0 ? 'text-amber-600' : 'text-muted'}
                />
              </div>
              <span className={`text-xs font-semibold ${overview.pendingFacilitators > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-muted'}`}>
                Pending Verifications
              </span>
            </div>
            <p className={`text-xl font-bold ${overview.pendingFacilitators > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'}`}>
              {overview.pendingFacilitators}
            </p>
            {overview.pendingFacilitators > 0 ? (
              <Link href="/dashboard/facilitators?filter=pending" className="text-xs text-amber-600 hover:underline mt-1 block font-semibold">
                Review now →
              </Link>
            ) : (
              <p className="text-xs text-muted mt-1">Facilitator approvals</p>
            )}
          </div>
        </div>
      </div>

      {/* ── 13. Top Jobs + Gigs by Applications ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Top Jobs by Applications">
          {topOpps.topJobs.length === 0 ? (
            <div className="py-6 text-center">
              <Briefcase size={32} className="mx-auto mb-2 text-muted/20" />
              <p className="text-xs text-muted">No application data yet</p>
            </div>
          ) : (
            <div>
              {topOpps.topJobs.map((job, i) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between text-xs py-2.5 border-b border-card-border/50 last:border-0 transition-colors hover:bg-primary/[0.03] rounded-lg px-2 -mx-2"
                >
                  <span className="flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-card-border/40 text-[10px] font-bold text-muted">{i + 1}</span>
                    <Link href={`/dashboard/jobs/${job.id}`} className="text-foreground hover:text-primary truncate max-w-[200px] font-medium">
                      {job.title}
                    </Link>
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0 ml-2">
                    <Briefcase size={11} className="text-blue-500" />
                    <span className="font-bold text-foreground">{job.applicationCount}</span>
                    <span className="text-muted">apps</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Top Gigs by Applications">
          {topOpps.topGigs.length === 0 ? (
            <div className="py-6 text-center">
              <Zap size={32} className="mx-auto mb-2 text-muted/20" />
              <p className="text-xs text-muted">No application data yet</p>
            </div>
          ) : (
            <div>
              {topOpps.topGigs.map((gig, i) => (
                <div
                  key={gig.id}
                  className="flex items-center justify-between text-xs py-2.5 border-b border-card-border/50 last:border-0 transition-colors hover:bg-primary/[0.03] rounded-lg px-2 -mx-2"
                >
                  <span className="flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-card-border/40 text-[10px] font-bold text-muted">{i + 1}</span>
                    <Link href={`/dashboard/gigs/${gig.id}`} className="text-foreground hover:text-primary truncate max-w-[200px] font-medium">
                      {gig.title}
                    </Link>
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0 ml-2">
                    <Zap size={11} className="text-violet-500" />
                    <span className="font-bold text-foreground">{gig.applicationCount}</span>
                    <span className="text-muted">apps</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── 14. Recent Audit Activity ── */}
      <SectionCard title="Recent Audit Activity">
        {auditLog.length === 0 ? (
          <div className="py-8 text-center">
            <Clock size={32} className="mx-auto mb-2 text-muted/20" />
            <p className="text-xs text-muted">No audit entries found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-card-border">
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Action</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Role</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Target</th>
                  <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Time</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.map((entry) => (
                  <tr key={entry.id} className="border-b border-card-border/50 last:border-0 transition-colors hover:bg-primary/[0.03]">
                    <td className="py-3 pr-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${actionBadgeClass(entry.action_type)}`}>
                        {entry.action_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-muted capitalize font-medium">{entry.actor_role ?? '--'}</td>
                    <td className="py-3 pr-4">
                      <span className="text-foreground capitalize font-medium">{entry.target_type ?? '--'}</span>
                      {entry.target_id && (
                        <span className="text-muted ml-1 font-mono text-[10px]">#{entry.target_id.slice(0, 6)}</span>
                      )}
                    </td>
                    <td className="py-3 text-right text-muted">
                      {entry.created_at ? format(new Date(entry.created_at), 'dd MMM, HH:mm') : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
