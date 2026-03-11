'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Star, Users } from 'lucide-react';
import { format } from 'date-fns';
import DataTable, { type Column } from '@/components/DataTable';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { getStartupCompetitions, deleteStartupCompetition } from '@/actions/startup-portal';
import type { Competition } from '@/lib/types';

type CompetitionWithCount = Competition & { participant_count: number };

const domainLabels: Record<string, string> = {
  hackathon: 'Hackathon',
  case_study: 'Case Study',
  quiz: 'Quiz',
  design: 'Design',
  coding: 'Coding',
  business_plan: 'Biz Plan',
  research: 'Research',
  marketing: 'Marketing',
  other: 'Other',
};

const columns: Column<CompetitionWithCount>[] = [
  {
    key: 'title',
    label: 'Title',
    render: (item) => (
      <div className="flex items-center gap-2">
        {item.is_featured && <Star size={13} className="text-amber-500 fill-amber-500 shrink-0" />}
        <span className="font-medium">{item.title}</span>
      </div>
    ),
  },
  {
    key: 'domain',
    label: 'Domain',
    render: (item) =>
      item.domain ? (
        <span className="rounded-full bg-violet-100 dark:bg-violet-900/40 px-2 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-300">
          {domainLabels[item.domain] ?? item.domain}
        </span>
      ) : '--',
  },
  {
    key: 'participation_type',
    label: 'Type',
    render: (item) => (
      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${item.participation_type === 'team' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
        {item.participation_type === 'team' ? `Team (${item.team_size_min}--${item.team_size_max})` : 'Individual'}
      </span>
    ),
  },
  {
    key: 'is_active',
    label: 'Status',
    render: (item) => (
      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${item.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
        {item.is_active ? 'Active' : 'Inactive'}
      </span>
    ),
  },
  {
    key: 'participant_count',
    label: 'Registrations',
    render: (item) => (
      <div className="flex items-center gap-1 text-sm">
        <Users size={13} className="text-muted" />
        {item.participant_count}
      </div>
    ),
  },
  {
    key: 'deadline',
    label: 'Deadline',
    render: (item) => item.deadline ? format(new Date(item.deadline), 'dd MMM yyyy') : '--',
  },
  {
    key: 'prize_pool',
    label: 'Prize',
    render: (item) => item.prize_pool || '--',
  },
];

export default function StartupCompetitionsPage() {
  const [competitions, setCompetitions] = useState<CompetitionWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<CompetitionWithCount | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getStartupCompetitions().then((data: any[]) => {
      setCompetitions(data.map((c) => ({ ...c, participant_count: c.participant_count ?? 0 })));
      setLoading(false);
    });
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteStartupCompetition(deleteTarget.id);
      setCompetitions((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Competitions</h1>
          <p className="mt-1 text-sm text-muted">Competitions organized by your startup</p>
        </div>
        <Link href="/startup/competitions/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Add Competition
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={competitions}
        loading={loading}
        editHref={(item) => `/startup/competitions/${item.id}`}
        onDelete={setDeleteTarget}
        emptyMessage="No competitions yet. Create your first one!"
      />

      <DeleteConfirmModal
        open={!!deleteTarget}
        title={deleteTarget?.title ?? ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
