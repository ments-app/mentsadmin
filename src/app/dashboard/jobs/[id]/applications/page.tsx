'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getJob } from '@/actions/jobs';
import { getJobApplications, getApplicationStats, updateApplicationStatus } from '@/actions/applications';
import type { Application, Job } from '@/lib/types';
import { format } from 'date-fns';
import { ArrowLeft, Users, TrendingUp, CheckCircle, XCircle } from 'lucide-react';

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

function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = value >= 75 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-card-border/30">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-foreground w-8 text-right">{value}</span>
    </div>
  );
}

export default function JobApplicationsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Job | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [stats, setStats] = useState<{ total: number; avgScore: number; scoreDistribution: Record<string, number>; recommendations: Record<string, number>; statusCounts: Record<string, number> } | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    Promise.all([
      getJob(id),
      getJobApplications(id),
      getApplicationStats(id),
    ]).then(([j, a, s]) => {
      setJob(j);
      setApps(a);
      setStats(s);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const filtered = filter === 'all'
    ? apps.filter((a) => a.status !== 'in_progress')
    : apps.filter((a) => a.status === filter);

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-card-border" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-card-border" />)}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-card-border" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors mb-4">
        <ArrowLeft size={15} />
        Back to Job
      </button>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Applications</h1>
        <p className="mt-1 text-sm text-muted">{job?.title} at {job?.company}</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card-elevated rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <Users size={18} className="text-primary" />
              </div>
              <p className="text-xs font-medium text-muted uppercase tracking-wide">Total</p>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="card-elevated rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2">
                <TrendingUp size={18} className="text-blue-600" />
              </div>
              <p className="text-xs font-medium text-muted uppercase tracking-wide">Avg Score</p>
            </div>
            <p className={`text-3xl font-bold ${stats.avgScore >= 75 ? 'text-emerald-600' : stats.avgScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{stats.avgScore}</p>
          </div>
          <div className="card-elevated rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-2">
                <CheckCircle size={18} className="text-emerald-600" />
              </div>
              <p className="text-xs font-medium text-muted uppercase tracking-wide">Shortlisted</p>
            </div>
            <p className="text-3xl font-bold text-emerald-600">{stats.statusCounts.shortlisted || 0}</p>
          </div>
          <div className="card-elevated rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-lg bg-red-100 dark:bg-red-900/30 p-2">
                <XCircle size={18} className="text-red-600" />
              </div>
              <p className="text-xs font-medium text-muted uppercase tracking-wide">Rejected</p>
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.statusCounts.rejected || 0}</p>
          </div>
        </div>
      )}

      {/* Score Distribution & Recommendations */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="card-elevated rounded-xl p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Score Distribution</h3>
            <div className="space-y-3">
              {Object.entries(stats.scoreDistribution).map(([range, count]) => (
                <div key={range} className="flex items-center gap-3">
                  <span className="text-xs text-muted w-14 font-medium">{range}</span>
                  <div className="flex-1 h-5 rounded-lg bg-card-border/20 overflow-hidden">
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
          <div className="card-elevated rounded-xl p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">AI Recommendations</h3>
            <div className="space-y-3">
              {Object.entries(stats.recommendations).map(([rec, count]) => (
                <div key={rec} className="flex items-center justify-between">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${recColors[rec]}`}>{recLabels[rec]}</span>
                  <span className="text-sm font-bold text-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'submitted', 'reviewed', 'shortlisted', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
              filter === f
                ? 'bg-primary text-white shadow-sm'
                : 'bg-card-bg border border-card-border text-muted hover:text-foreground hover:border-primary/30'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Applications Table */}
      {filtered.length === 0 ? (
        <div className="card-elevated rounded-xl py-16 text-center">
          <Users size={40} className="mx-auto text-muted/30 mb-3" />
          <p className="text-sm text-muted">No applications found</p>
        </div>
      ) : (
        <div className="card-elevated rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-card-bg/50">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">Applicant</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">Match</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">Interview</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">Overall</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">Recommendation</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">Tab Switches</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">Applied</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-muted uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-primary/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {app.user_avatar_url ? (
                          <img src={app.user_avatar_url} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-card-border" />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary ring-2 ring-primary/20">
                            {(app.user_name || '?')[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">{app.user_name || 'Unknown'}</p>
                          <p className="text-xs text-muted">{app.user_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 min-w-[120px]"><ScoreBar value={app.match_score} /></td>
                    <td className="px-5 py-4 min-w-[120px]"><ScoreBar value={app.interview_score} /></td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-bold ${app.overall_score >= 75 ? 'text-emerald-600' : app.overall_score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                        {app.overall_score}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${recColors[app.ai_recommendation]}`}>
                        {recLabels[app.ai_recommendation] || app.ai_recommendation}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[app.status]}`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold ${app.tab_switch_count > 3 ? 'text-red-600' : app.tab_switch_count > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {app.tab_switch_count}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted">
                      {app.submitted_at ? format(new Date(app.submitted_at), 'dd MMM yyyy') : '-'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/dashboard/jobs/${id}/applications/${app.id}`}
                        className="text-xs font-medium text-primary hover:text-primary/80 transition-colors bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
