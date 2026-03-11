'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getGig } from '@/actions/gigs';
import { getGigApplications, getApplicationStats } from '@/actions/applications';
import type { Application, Gig } from '@/lib/types';
import { format } from 'date-fns';
import { Users, ArrowLeft } from 'lucide-react';

const recColors: Record<string, string> = {
  strongly_recommend: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  recommend: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  maybe: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  not_recommend: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
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
  submitted: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  reviewed: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  shortlisted: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  rejected: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  in_progress: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

function ScoreBar({ value }: { value: number }) {
  const pct = Math.min(100, value);
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

export default function GigApplicationsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [gig, setGig] = useState<Gig | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [stats, setStats] = useState<{ total: number; avgScore: number; scoreDistribution: Record<string, number>; recommendations: Record<string, number>; statusCounts: Record<string, number> } | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    Promise.all([
      getGig(id),
      getGigApplications(id),
      getApplicationStats(undefined, id),
    ]).then(([g, a, s]) => {
      setGig(g);
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
        <div className="h-8 w-64 animate-pulse rounded-lg bg-card-border/50" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-card-border/50" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <button onClick={() => router.back()} className="btn-ghost mb-2 flex items-center gap-1.5 text-sm">
          <ArrowLeft size={14} />
          Back to Gig
        </button>
        <h1 className="text-2xl font-semibold text-foreground">Applications</h1>
        <p className="mt-1 text-sm text-muted">{gig?.title}{gig?.company ? ` -- ${gig.company}` : ''}</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card-elevated rounded-xl p-5">
            <p className="text-xs font-medium text-muted mb-1">Total Applications</p>
            <p className="text-3xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="card-elevated rounded-xl p-5">
            <p className="text-xs font-medium text-muted mb-1">Average Score</p>
            <p className={`text-3xl font-bold ${stats.avgScore >= 75 ? 'text-emerald-600' : stats.avgScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{stats.avgScore}</p>
          </div>
          <div className="card-elevated rounded-xl p-5">
            <p className="text-xs font-medium text-muted mb-1">Shortlisted</p>
            <p className="text-3xl font-bold text-emerald-600">{stats.statusCounts.shortlisted || 0}</p>
          </div>
          <div className="card-elevated rounded-xl p-5">
            <p className="text-xs font-medium text-muted mb-1">Rejected</p>
            <p className="text-3xl font-bold text-red-600">{stats.statusCounts.rejected || 0}</p>
          </div>
        </div>
      )}

      {/* Score Distribution & Recommendations */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card-elevated rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Score Distribution</h3>
            <div className="space-y-3">
              {Object.entries(stats.scoreDistribution).map(([range, count]) => (
                <div key={range} className="flex items-center gap-3">
                  <span className="text-xs text-muted w-14 font-medium">{range}</span>
                  <div className="flex-1 h-5 rounded-lg bg-card-border/20">
                    <div className={`h-full rounded-lg transition-all ${range === '76-100' ? 'bg-emerald-500' : range === '51-75' ? 'bg-blue-500' : range === '26-50' ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: stats.total > 0 ? `${(count / stats.total) * 100}%` : '0%' }} />
                  </div>
                  <span className="text-xs font-semibold text-foreground w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card-elevated rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">AI Recommendations</h3>
            <div className="space-y-3">
              {Object.entries(stats.recommendations).map(([rec, count]) => (
                <div key={rec} className="flex items-center justify-between">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${recColors[rec]}`}>{recLabels[rec]}</span>
                  <span className="text-sm font-bold text-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'submitted', 'reviewed', 'shortlisted', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${filter === f ? 'bg-primary text-white shadow-sm' : 'bg-card-border/20 text-foreground hover:bg-card-border/40'}`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card-elevated rounded-xl flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/20 mb-4">
            <Users size={24} className="text-indigo-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No applications found</h3>
          <p className="mt-1 text-sm text-muted">There are no applications matching your current filter.</p>
        </div>
      ) : (
        <div className="card-elevated rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-card-border/5">
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Applicant</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Match</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Interview</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Overall</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Recommendation</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Applied</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-card-border/5 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        {app.user_avatar_url ? (
                          <img src={app.user_avatar_url} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-card-border" />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 ring-2 ring-card-border">
                            {(app.user_name || '?')[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">{app.user_name || 'Unknown'}</p>
                          <p className="text-xs text-muted">{app.user_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 min-w-[120px]"><ScoreBar value={app.match_score} /></td>
                    <td className="px-4 py-3.5 min-w-[120px]"><ScoreBar value={app.interview_score} /></td>
                    <td className="px-4 py-3.5">
                      <span className={`text-sm font-bold ${app.overall_score >= 75 ? 'text-emerald-600' : app.overall_score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{app.overall_score}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${recColors[app.ai_recommendation]}`}>{recLabels[app.ai_recommendation] || app.ai_recommendation}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${statusColors[app.status]}`}>{app.status.replace('_', ' ')}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted">{app.submitted_at ? format(new Date(app.submitted_at), 'dd MMM yyyy') : '-'}</td>
                    <td className="px-4 py-3.5 text-right">
                      <Link href={`/dashboard/gigs/${id}/applications/${app.id}`} className="btn-ghost text-xs">View</Link>
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
