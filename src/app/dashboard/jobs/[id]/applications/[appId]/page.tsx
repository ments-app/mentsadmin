'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getApplication, updateApplicationStatus } from '@/actions/applications';
import type { Application } from '@/lib/types';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';

const recColors: Record<string, string> = {
  strongly_recommend: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
  recommend: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  maybe: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700',
  not_recommend: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-300 dark:border-red-700',
  pending: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700',
};

const recLabels: Record<string, string> = {
  strongly_recommend: 'Strongly Recommend',
  recommend: 'Recommend',
  maybe: 'Maybe',
  not_recommend: 'Not Recommend',
  pending: 'Pending',
};

function ScoreCircle({ value, label, size = 'md' }: { value: number; label: string; size?: 'sm' | 'md' }) {
  const color = value >= 75 ? 'text-emerald-600 border-emerald-400' : value >= 50 ? 'text-amber-600 border-amber-400' : 'text-red-600 border-red-400';
  const bg = value >= 75 ? 'bg-emerald-50 dark:bg-emerald-900/20' : value >= 50 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-red-50 dark:bg-red-900/20';
  const sz = size === 'md' ? 'h-20 w-20' : 'h-14 w-14';
  const textSz = size === 'md' ? 'text-2xl' : 'text-lg';
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`${sz} rounded-full border-2 ${color} ${bg} flex flex-col items-center justify-center shadow-sm`}>
        <span className={`${textSz} font-black ${color}`}>{value}</span>
      </div>
      <span className="text-xs font-medium text-muted">{label}</span>
    </div>
  );
}

export default function ApplicantDetailPage() {
  const { id: jobId, appId } = useParams<{ id: string; appId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState<Application | null>(null);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    getApplication(appId).then((a) => {
      setApp(a);
      setNotes(a.admin_notes || '');
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [appId]);

  async function handleStatusChange(newStatus: string) {
    if (!app) return;
    setSaving(true);
    try {
      await updateApplicationStatus(app.id, newStatus, notes);
      setApp({ ...app, status: newStatus as Application['status'], admin_notes: notes });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function saveNotes() {
    if (!app) return;
    setSaving(true);
    try {
      await updateApplicationStatus(app.id, app.status, notes);
      setApp({ ...app, admin_notes: notes });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6 max-w-3xl mx-auto">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-card-border" />
        <div className="h-32 animate-pulse rounded-xl bg-card-border" />
        <div className="h-64 animate-pulse rounded-xl bg-card-border" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="animate-fade-in text-center py-20">
        <p className="text-muted">Application not found</p>
      </div>
    );
  }

  const questions = app.ai_questions || [];
  const bd = app.match_breakdown || { skills: 0, experience: 0, level: 0, overall: 0 };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors mb-4">
        <ArrowLeft size={15} />
        Back to Applications
      </button>

      {/* Candidate Header */}
      <div className="card-elevated rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4">
          {app.user_avatar_url ? (
            <img src={app.user_avatar_url} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-card-border shadow-sm" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary ring-2 ring-primary/20">
              {(app.user_name || '?')[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-foreground">{app.user_name || 'Unknown'}</h1>
            <p className="text-sm text-muted">{app.user_email}</p>
            {app.user_tagline && <p className="text-xs text-muted mt-0.5">{app.user_tagline}</p>}
            {app.user_city && <p className="text-xs text-muted">{app.user_city}</p>}
          </div>
          <div className="text-right shrink-0">
            <span className={`inline-block text-xs font-semibold px-3 py-1.5 rounded-lg border ${recColors[app.ai_recommendation]}`}>
              {recLabels[app.ai_recommendation]}
            </span>
            {app.tab_switch_count > 0 && (
              <p className={`text-xs mt-2 ${app.tab_switch_count > 3 ? 'text-red-600 font-semibold' : 'text-amber-600'}`}>
                {app.tab_switch_count} tab switch{app.tab_switch_count > 1 ? 'es' : ''}
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-card-border flex items-center gap-4 text-xs text-muted">
          {app.submitted_at && <span>Applied: {format(new Date(app.submitted_at), 'dd MMM yyyy, HH:mm')}</span>}
          {app.time_spent_seconds > 0 && <span>Time: {Math.round(app.time_spent_seconds / 60)} min</span>}
        </div>
      </div>

      {/* Scores */}
      <div className="card-elevated rounded-xl p-6 mb-6">
        <h2 className="text-base font-semibold text-foreground mb-5">Scores</h2>
        <div className="flex items-center justify-around">
          <ScoreCircle value={app.match_score} label="Profile Match" />
          <ScoreCircle value={app.interview_score} label="Interview" />
          <ScoreCircle value={app.overall_score} label="Overall" size="md" />
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-5 border-t border-card-border">
          {[
            { label: 'Skills', val: bd.skills },
            { label: 'Experience', val: bd.experience },
            { label: 'Level Fit', val: bd.level },
            { label: 'Overall Fit', val: bd.overall },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="h-2.5 rounded-full bg-card-border/30 mb-2">
                <div className={`h-full rounded-full transition-all ${item.val >= 75 ? 'bg-emerald-500' : item.val >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${item.val}%` }} />
              </div>
              <span className="text-xs text-muted">{item.label}: <span className="font-semibold text-foreground">{item.val}</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* Profile Summary */}
      {app.profile_summary && (
        <div className="card-elevated rounded-xl p-6 mb-6">
          <h2 className="text-base font-semibold text-foreground mb-3">Profile Summary</h2>
          <p className="text-sm text-muted leading-relaxed">{app.profile_summary}</p>
        </div>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {app.strengths.length > 0 && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10 p-5">
            <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-3">Strengths</h3>
            <ul className="space-y-2">
              {app.strengths.map((s, i) => (
                <li key={i} className="text-xs text-foreground flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5 font-bold">+</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {app.weaknesses.length > 0 && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-5">
            <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-3">Weaknesses / Gaps</h3>
            <ul className="space-y-2">
              {app.weaknesses.map((w, i) => (
                <li key={i} className="text-xs text-foreground flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5 font-bold">-</span> {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Interview Q&A */}
      <div className="card-elevated rounded-xl p-6 mb-6">
        <h2 className="text-base font-semibold text-foreground mb-5">Interview Questions & Answers</h2>
        <div className="space-y-5">
          {questions.map((q, i) => {
            const sColor = q.score >= 8 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : q.score >= 5 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
            return (
              <div key={q.id} className="border border-card-border rounded-xl p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">Q{i + 1}</span>
                    <span className="text-xs text-muted uppercase font-medium">{q.type.replace('_', ' ')}</span>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sColor}`}>{q.score}/10</span>
                </div>
                <p className="text-sm font-medium text-foreground mb-3">{q.question}</p>
                <div className="bg-card-bg/50 border border-card-border/50 rounded-xl p-4 mb-3">
                  <p className="text-sm text-foreground leading-relaxed">{q.answer || <em className="text-muted">No answer</em>}</p>
                </div>
                {q.feedback && (
                  <p className="text-xs text-muted italic bg-primary/5 rounded-lg px-3 py-2">AI Feedback: {q.feedback}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Summary & Recommendation */}
      {(app.ai_summary || app.hire_suggestion) && (
        <div className="card-elevated rounded-xl p-6 mb-6">
          <h2 className="text-base font-semibold text-foreground mb-4">AI Evaluation</h2>
          {app.ai_summary && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Summary</h3>
              <p className="text-sm text-foreground leading-relaxed">{app.ai_summary}</p>
            </div>
          )}
          {app.hire_suggestion && (
            <div className="pt-3 border-t border-card-border">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Hire Suggestion</h3>
              <p className="text-sm text-foreground leading-relaxed">{app.hire_suggestion}</p>
            </div>
          )}
        </div>
      )}

      {/* Admin Actions */}
      <div className="card-elevated rounded-xl p-6 mb-8">
        <h2 className="text-base font-semibold text-foreground mb-4">Admin Actions</h2>

        <div className="mb-5">
          <label className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 block">Status</label>
          <div className="flex flex-wrap gap-2">
            {['submitted', 'reviewed', 'shortlisted', 'rejected'].map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={saving || app.status === s}
                className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  app.status === s
                    ? 'bg-primary text-white shadow-sm'
                    : 'border border-card-border text-foreground hover:bg-card-border/30 hover:border-primary/30'
                } disabled:opacity-50`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 block">Admin Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-card-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="Add private notes about this applicant..."
          />
          <button
            onClick={saveNotes}
            disabled={saving}
            className="btn-primary mt-3 !text-xs"
          >
            {saving ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      </div>
    </div>
  );
}
