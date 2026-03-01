'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getFacilitatorApplications, getFacilitatorJobs, getFacilitatorGigs } from '@/actions/facilitators';
import type { Application } from '@/lib/types';
import { format } from 'date-fns';
import { Users, TrendingUp, CheckCircle, XCircle, Search } from 'lucide-react';

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

const statusColors: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  reviewed: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  shortlisted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  in_progress: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

type SortKey = 'submitted_at' | 'overall_score' | 'match_score' | 'interview_score' | 'user_name';

function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = value >= 75 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-card-border/30">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-foreground w-8 text-right">{value}</span>
    </div>
  );
}

function computeStats(apps: Application[]) {
  const submitted = apps.filter((a) => a.status !== 'in_progress');
  const total = submitted.length;
  const avgScore = total > 0
    ? Math.round(submitted.reduce((s, a) => s + a.overall_score, 0) / total)
    : 0;
  const scoreDistribution = {
    '0-25': submitted.filter((a) => a.overall_score <= 25).length,
    '26-50': submitted.filter((a) => a.overall_score > 25 && a.overall_score <= 50).length,
    '51-75': submitted.filter((a) => a.overall_score > 50 && a.overall_score <= 75).length,
    '76-100': submitted.filter((a) => a.overall_score > 75).length,
  };
  const recommendations = {
    strongly_recommend: submitted.filter((a) => a.ai_recommendation === 'strongly_recommend').length,
    recommend: submitted.filter((a) => a.ai_recommendation === 'recommend').length,
    maybe: submitted.filter((a) => a.ai_recommendation === 'maybe').length,
    not_recommend: submitted.filter((a) => a.ai_recommendation === 'not_recommend').length,
  };
  const statusCounts = {
    submitted: submitted.filter((a) => a.status === 'submitted').length,
    reviewed: submitted.filter((a) => a.status === 'reviewed').length,
    shortlisted: submitted.filter((a) => a.status === 'shortlisted').length,
    rejected: submitted.filter((a) => a.status === 'rejected').length,
  };
  return { total, avgScore, scoreDistribution, recommendations, statusCounts };
}

export default function FacilitatorApplicationsPage() {
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<Application[]>([]);
  const [stats, setStats] = useState<ReturnType<typeof computeStats> | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('submitted_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [jobTitles, setJobTitles] = useState<Record<string, string>>({});
  const [gigTitles, setGigTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      getFacilitatorApplications(),
      getFacilitatorJobs(),
      getFacilitatorGigs(),
    ]).then(([appsData, jobsData, gigsData]) => {
      const appsTyped = appsData as Application[];
      setApps(appsTyped);
      setStats(computeStats(appsTyped));

      const jMap: Record<string, string> = {};
      (jobsData as any[]).forEach((j) => { jMap[j.id] = j.title; });
      setJobTitles(jMap);

      const gMap: Record<string, string> = {};
      (gigsData as any[]).forEach((g) => { gMap[g.id] = g.title; });
      setGigTitles(gMap);

      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = apps
    .filter((a) => {
      if (filter !== 'all' && a.status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = (a.user_name || '').toLowerCase();
        const email = (a.user_email || '').toLowerCase();
        const posTitle = a.job_id
          ? (jobTitles[a.job_id] || '').toLowerCase()
          : (gigTitles[a.gig_id!] || '').toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !posTitle.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'submitted_at') {
        cmp = new Date(a.submitted_at || 0).getTime() - new Date(b.submitted_at || 0).getTime();
      } else if (sortKey === 'user_name') {
        cmp = (a.user_name || '').localeCompare(b.user_name || '');
      } else {
        cmp = (a[sortKey] as number) - (b[sortKey] as number);
      }
      return sortAsc ? cmp : -cmp;
    });

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  }

  function SortHeader({ label, sortField }: { label: string; sortField: SortKey }) {
    const active = sortKey === sortField;
    return (
      <button
        onClick={() => handleSort(sortField)}
        className={`text-xs font-semibold flex items-center gap-1 ${active ? 'text-primary' : 'text-muted'} hover:text-foreground transition-colors`}
      >
        {label}
        {active && <span className="text-[10px]">{sortAsc ? '↑' : '↓'}</span>}
      </button>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-card-border" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-pulse rounded-lg bg-card-border" />)}
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-card-border" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Applications</h1>
        <p className="mt-1 text-muted">All applications across your jobs and gigs</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-card-border bg-card-bg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted mb-1">Total Applications</p>
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="rounded-lg bg-primary-light p-2.5">
                <Users size={20} className="text-primary" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-card-border bg-card-bg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted mb-1">Average Score</p>
                <p className={`text-3xl font-bold ${stats.avgScore >= 75 ? 'text-emerald-600' : stats.avgScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                  {stats.avgScore}
                </p>
              </div>
              <div className="rounded-lg bg-primary-light p-2.5">
                <TrendingUp size={20} className="text-primary" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-card-border bg-card-bg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted mb-1">Shortlisted</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.statusCounts.shortlisted || 0}</p>
              </div>
              <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-2.5">
                <CheckCircle size={20} className="text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-card-border bg-card-bg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted mb-1">Rejected</p>
                <p className="text-3xl font-bold text-red-600">{stats.statusCounts.rejected || 0}</p>
              </div>
              <div className="rounded-lg bg-red-100 dark:bg-red-900/30 p-2.5">
                <XCircle size={20} className="text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Score Distribution & Recommendations */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl border border-card-border bg-card-bg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Score Distribution</h3>
            <div className="space-y-2">
              {Object.entries(stats.scoreDistribution).map(([range, count]) => (
                <div key={range} className="flex items-center gap-3">
                  <span className="text-xs text-muted w-14">{range}</span>
                  <div className="flex-1 h-5 rounded bg-card-border/30">
                    <div
                      className={`h-full rounded ${range === '76-100' ? 'bg-emerald-500' : range === '51-75' ? 'bg-blue-500' : range === '26-50' ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: stats.total > 0 ? `${(count / stats.total) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-foreground w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-card-border bg-card-bg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">AI Recommendations</h3>
            <div className="space-y-2.5">
              {Object.entries(stats.recommendations).map(([rec, count]) => (
                <div key={rec} className="flex items-center justify-between">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded ${recColors[rec]}`}>{recLabels[rec]}</span>
                  <span className="text-sm font-bold text-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search by name, email, or position..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-card-border bg-background pl-9 pr-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'submitted', 'reviewed', 'shortlisted', 'rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-primary text-white' : 'bg-card-border/30 text-foreground hover:bg-card-border/50'}`}
            >
              {f === 'all'
                ? `All (${stats?.total || 0})`
                : `${f.charAt(0).toUpperCase() + f.slice(1)} (${stats?.statusCounts[f as keyof typeof stats.statusCounts] || 0})`}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-card-border bg-card-bg p-12 text-center">
          <Users size={40} className="mx-auto mb-3 text-muted/40" />
          <p className="text-muted font-medium">No applications found</p>
          <p className="text-xs text-muted mt-1">
            {search ? 'Try a different search term' : 'Applications will appear here when candidates apply'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-card-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-card-border/10">
                  <th className="px-4 py-3 text-left"><SortHeader label="Applicant" sortField="user_name" /></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Position</th>
                  <th className="px-4 py-3 text-left"><SortHeader label="Match" sortField="match_score" /></th>
                  <th className="px-4 py-3 text-left"><SortHeader label="Interview" sortField="interview_score" /></th>
                  <th className="px-4 py-3 text-left"><SortHeader label="Overall" sortField="overall_score" /></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Recommendation</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Tab Switches</th>
                  <th className="px-4 py-3 text-left"><SortHeader label="Applied" sortField="submitted_at" /></th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => {
                  const posTitle = app.job_id
                    ? jobTitles[app.job_id] || 'Job'
                    : gigTitles[app.gig_id!] || 'Gig';
                  const posType = app.job_id ? 'job' : 'gig';
                  const detailHref = app.job_id
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
                        <p className="font-medium text-foreground text-xs truncate max-w-[160px]">{posTitle}</p>
                        <span className={`text-[10px] font-semibold uppercase ${posType === 'job' ? 'text-blue-600' : 'text-purple-600'}`}>
                          {posType}
                        </span>
                      </td>
                      <td className="px-4 py-3 min-w-[120px]"><ScoreBar value={app.match_score} /></td>
                      <td className="px-4 py-3 min-w-[120px]"><ScoreBar value={app.interview_score} /></td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-bold ${app.overall_score >= 75 ? 'text-emerald-600' : app.overall_score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                          {app.overall_score}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${recColors[app.ai_recommendation] || recColors.pending}`}>
                          {recLabels[app.ai_recommendation] || app.ai_recommendation}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${statusColors[app.status]}`}>
                          {app.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${app.tab_switch_count > 3 ? 'text-red-600' : app.tab_switch_count > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {app.tab_switch_count}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
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
  );
}
