'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getGig } from '@/actions/gigs';
import { getGigApplications, getApplicationStats } from '@/actions/applications';
import type { Application, Gig } from '@/lib/types';
import { format } from 'date-fns';

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

function ScoreBar({ value }: { value: number }) {
  const pct = Math.min(100, value);
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
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-card-border" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-pulse rounded-lg bg-card-border" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => router.back()} className="text-sm text-primary hover:underline mb-1">&larr; Back to Gig</button>
          <h1 className="text-2xl font-bold text-foreground">Applications</h1>
          <p className="text-sm text-muted">{gig?.title}{gig?.company ? ` — ${gig.company}` : ''}</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg border border-card-border bg-background p-4">
            <p className="text-xs text-muted mb-1">Total Applications</p>
            <p className="text-3xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-card-border bg-background p-4">
            <p className="text-xs text-muted mb-1">Average Score</p>
            <p className={`text-3xl font-bold ${stats.avgScore >= 75 ? 'text-emerald-600' : stats.avgScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{stats.avgScore}</p>
          </div>
          <div className="rounded-lg border border-card-border bg-background p-4">
            <p className="text-xs text-muted mb-1">Shortlisted</p>
            <p className="text-3xl font-bold text-emerald-600">{stats.statusCounts.shortlisted || 0}</p>
          </div>
          <div className="rounded-lg border border-card-border bg-background p-4">
            <p className="text-xs text-muted mb-1">Rejected</p>
            <p className="text-3xl font-bold text-red-600">{stats.statusCounts.rejected || 0}</p>
          </div>
        </div>
      )}

      {/* Score Distribution & Recommendations */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg border border-card-border bg-background p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Score Distribution</h3>
            <div className="space-y-2">
              {Object.entries(stats.scoreDistribution).map(([range, count]) => (
                <div key={range} className="flex items-center gap-3">
                  <span className="text-xs text-muted w-12">{range}</span>
                  <div className="flex-1 h-4 rounded bg-card-border/30">
                    <div className={`h-full rounded ${range === '76-100' ? 'bg-emerald-500' : range === '51-75' ? 'bg-blue-500' : range === '26-50' ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: stats.total > 0 ? `${(count / stats.total) * 100}%` : '0%' }} />
                  </div>
                  <span className="text-xs font-semibold text-foreground w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-card-border bg-background p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">AI Recommendations</h3>
            <div className="space-y-2">
              {Object.entries(stats.recommendations).map(([rec, count]) => (
                <div key={rec} className="flex items-center justify-between">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${recColors[rec]}`}>{recLabels[rec]}</span>
                  <span className="text-sm font-bold text-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['all', 'submitted', 'reviewed', 'shortlisted', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-primary text-white' : 'bg-card-border/30 text-foreground hover:bg-card-border/50'}`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-card-border bg-background p-8 text-center text-muted">No applications found</div>
      ) : (
        <div className="rounded-lg border border-card-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-card-border/10">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Applicant</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Match</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Interview</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Overall</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Recommendation</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Applied</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => (
                  <tr key={app.id} className="border-b border-card-border hover:bg-card-border/5 transition-colors">
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
                    <td className="px-4 py-3"><ScoreBar value={app.match_score} /></td>
                    <td className="px-4 py-3"><ScoreBar value={app.interview_score} /></td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${app.overall_score >= 75 ? 'text-emerald-600' : app.overall_score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{app.overall_score}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${recColors[app.ai_recommendation]}`}>{recLabels[app.ai_recommendation] || app.ai_recommendation}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${statusColors[app.status]}`}>{app.status.replace('_', ' ')}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{app.submitted_at ? format(new Date(app.submitted_at), 'dd MMM yyyy') : '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/dashboard/gigs/${id}/applications/${app.id}`} className="text-xs font-medium text-primary hover:underline">View</Link>
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
