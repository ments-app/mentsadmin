'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllApplications, getApplicationStats, getPositionTitles } from '@/actions/applications';
import type { Application } from '@/lib/types';
import { format } from 'date-fns';
import { Users, TrendingUp, CheckCircle, XCircle, Search, Inbox } from 'lucide-react';

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
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-foreground w-8 text-right">{value}</span>
    </div>
  );
}

export default function ApplicationsPage() {
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<Application[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    avgScore: number;
    scoreDistribution: Record<string, number>;
    recommendations: Record<string, number>;
    statusCounts: Record<string, number>;
  } | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('submitted_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [jobTitles, setJobTitles] = useState<Record<string, string>>({});
  const [gigTitles, setGigTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      getAllApplications(),
      getApplicationStats(),
    ]).then(async ([a, s]) => {
      setApps(a);
      setStats(s);

      const jobIds = [...new Set(a.filter((x) => x.job_id).map((x) => x.job_id!))];
      const gigIds = [...new Set(a.filter((x) => x.gig_id).map((x) => x.gig_id!))];

      if (jobIds.length > 0 || gigIds.length > 0) {
        const titles = await getPositionTitles(jobIds, gigIds);
        setJobTitles(titles.jobs);
        setGigTitles(titles.gigs);
      }

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
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  function SortHeader({ label, sortField }: { label: string; sortField: SortKey }) {
    const active = sortKey === sortField;
    return (
      <button
        onClick={() => handleSort(sortField)}
        className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1 ${active ? 'text-primary' : 'text-muted'} hover:text-foreground transition-colors`}
      >
        {label}
        {active && <span className="text-[10px]">{sortAsc ? '\u2191' : '\u2193'}</span>}
      </button>
    );
  }

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-card-border/50" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-card-border/50" />)}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-card-border/50" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Applications</h1>
        <p className="mt-1 text-sm text-muted">All applications across jobs and gigs</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card-elevated rounded-xl p-5" style={{ animationDelay: '0ms' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted mb-1">Total Applications</p>
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="rounded-xl bg-primary/10 p-3">
                <Users size={20} className="text-primary" />
              </div>
            </div>
          </div>
          <div className="card-elevated rounded-xl p-5" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted mb-1">Average Score</p>
                <p className={`text-3xl font-bold ${stats.avgScore >= 75 ? 'text-emerald-600' : stats.avgScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{stats.avgScore}</p>
              </div>
              <div className="rounded-xl bg-primary/10 p-3">
                <TrendingUp size={20} className="text-primary" />
              </div>
            </div>
          </div>
          <div className="card-elevated rounded-xl p-5" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted mb-1">Shortlisted</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.statusCounts.shortlisted || 0}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/30 p-3">
                <CheckCircle size={20} className="text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="card-elevated rounded-xl p-5" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted mb-1">Rejected</p>
                <p className="text-3xl font-bold text-red-600">{stats.statusCounts.rejected || 0}</p>
              </div>
              <div className="rounded-xl bg-red-50 dark:bg-red-900/30 p-3">
                <XCircle size={20} className="text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Score Distribution & Recommendations */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card-elevated rounded-xl p-5" style={{ animationDelay: '200ms' }}>
            <h3 className="text-sm font-semibold text-foreground mb-4">Score Distribution</h3>
            <div className="space-y-3">
              {Object.entries(stats.scoreDistribution).map(([range, count]) => (
                <div key={range} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted w-14">{range}</span>
                  <div className="flex-1 h-6 rounded-lg bg-card-border/20 overflow-hidden">
                    <div
                      className={`h-full rounded-lg transition-all ${range === '76-100' ? 'bg-emerald-500' : range === '51-75' ? 'bg-blue-500' : range === '26-50' ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: stats.total > 0 ? `${(count / stats.total) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-xs font-bold text-foreground w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card-elevated rounded-xl p-5" style={{ animationDelay: '250ms' }}>
            <h3 className="text-sm font-semibold text-foreground mb-4">AI Recommendations</h3>
            <div className="space-y-3">
              {Object.entries(stats.recommendations).map(([rec, count]) => (
                <div key={rec} className="flex items-center justify-between">
                  <span className={`text-xs font-medium px-3 py-1.5 rounded-lg ${recColors[rec]}`}>{recLabels[rec]}</span>
                  <span className="text-sm font-bold text-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search by name, email, or position..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-card-border bg-card-bg pl-10 pr-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'submitted', 'reviewed', 'shortlisted', 'rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${filter === f ? 'bg-primary text-white shadow-sm' : 'bg-card-bg border border-card-border text-muted hover:text-foreground hover:border-muted/40'}`}
            >
              {f === 'all' ? `All (${stats?.total || 0})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${stats?.statusCounts[f] || 0})`}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      {filtered.length === 0 ? (
        <div className="card-elevated rounded-xl py-16 text-center">
          <Inbox size={48} className="mx-auto mb-4 text-muted/30" />
          <p className="text-base font-medium text-foreground">No applications found</p>
          <p className="mt-1 text-sm text-muted">
            {search ? 'Try a different search term' : 'Applications will appear here when candidates apply'}
          </p>
        </div>
      ) : (
        <div className="card-elevated overflow-hidden rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-background/50">
                  <th className="px-5 py-3.5 text-left"><SortHeader label="Applicant" sortField="user_name" /></th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Position</th>
                  <th className="px-5 py-3.5 text-left"><SortHeader label="Match" sortField="match_score" /></th>
                  <th className="px-5 py-3.5 text-left"><SortHeader label="Interview" sortField="interview_score" /></th>
                  <th className="px-5 py-3.5 text-left"><SortHeader label="Overall" sortField="overall_score" /></th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Recommendation</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Tab Switches</th>
                  <th className="px-5 py-3.5 text-left"><SortHeader label="Applied" sortField="submitted_at" /></th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted">Action</th>
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
                    <tr key={app.id} className="border-b border-card-border last:border-0 group transition-colors hover:bg-primary/[0.02]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {app.user_avatar_url ? (
                            <img src={app.user_avatar_url} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-card-border" />
                          ) : (
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary ring-2 ring-card-border">
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
                        <p className="font-medium text-foreground text-xs truncate max-w-[160px]">{posTitle}</p>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${posType === 'job' ? 'text-blue-600' : 'text-purple-600'}`}>
                          {posType}
                        </span>
                      </td>
                      <td className="px-5 py-4 min-w-[120px]"><ScoreBar value={app.match_score} /></td>
                      <td className="px-5 py-4 min-w-[120px]"><ScoreBar value={app.interview_score} /></td>
                      <td className="px-5 py-4">
                        <span className={`text-sm font-bold ${app.overall_score >= 75 ? 'text-emerald-600' : app.overall_score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                          {app.overall_score}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg whitespace-nowrap ${recColors[app.ai_recommendation] || recColors.pending}`}>
                          {recLabels[app.ai_recommendation] || app.ai_recommendation}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg capitalize ${statusColors[app.status]}`}>
                          {app.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center justify-center h-7 w-7 rounded-lg text-xs font-bold ${app.tab_switch_count > 3 ? 'bg-red-50 text-red-600 dark:bg-red-900/30' : app.tab_switch_count > 0 ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30'}`}>
                          {app.tab_switch_count}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-muted whitespace-nowrap">
                        {app.submitted_at ? format(new Date(app.submitted_at), 'dd MMM yyyy') : '-'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={detailHref}
                          className="btn-ghost !text-xs !py-1.5 !px-3 text-primary"
                        >
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
