'use client';

import { useEffect, useState, useRef } from 'react';
import {
  UserCog, UserPlus, Trash2, Mail, CheckCircle, Clock, X, Search,
} from 'lucide-react';
import {
  getMyTeamMembers,
  inviteTeamMember,
  removeTeamMember,
  type TeamMember,
} from '@/actions/facilitator-team';
import { format } from 'date-fns';

export default function FacilitatorTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    getMyTeamMembers()
      .then(setMembers)
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd() {
    const email = emailInput.trim();
    if (!email) return;
    setAddError('');
    setAddSuccess('');
    setAdding(true);
    try {
      await inviteTeamMember(email, nameInput.trim() || undefined);
      const refreshed = await getMyTeamMembers();
      setMembers(refreshed);
      setEmailInput('');
      setNameInput('');
      setAddSuccess(`${email} has been added. They can log in with this email to access your dashboard.`);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(member: TeamMember) {
    setRemovingId(member.id);
    try {
      await removeTeamMember(member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
    } catch (err) {
      console.error(err);
    } finally {
      setRemovingId(null);
    }
  }

  const activeCount = members.filter((m) => m.status === 'active').length;
  const pendingCount = members.filter((m) => m.status === 'pending').length;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Members</h1>
          <p className="mt-1 text-sm text-muted">
            Co-admins can log in and manage your facilitator dashboard on your behalf.
          </p>
        </div>
        <span className="mt-1 flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          <UserCog size={14} />
          {loading ? '—' : activeCount} active
        </span>
      </div>

      {/* Info banner */}
      <div className="mt-5 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
        <UserPlus size={18} className="mt-0.5 shrink-0 text-blue-500" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium">How co-admin access works</p>
          <p className="mt-0.5">
            Add a team member's email below. When they sign in with that email via Google,
            they will automatically get access to your facilitator dashboard — no approval needed.
            They can manage startups, post content, and access students, all under your organization.
          </p>
        </div>
      </div>

      {/* Add member form */}
      <div className="mt-6 rounded-lg border border-card-border p-4 space-y-3">
        <h2 className="text-base font-semibold text-foreground">Add Team Member</h2>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="email"
              value={emailInput}
              onChange={(e) => { setEmailInput(e.target.value); setAddError(''); setAddSuccess(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Email address"
              className="w-full rounded-lg border border-card-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Name (optional)"
            className="w-36 rounded-lg border border-card-border bg-background py-2 px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding || !emailInput.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            <UserPlus size={15} />
            {adding ? 'Adding...' : 'Add'}
          </button>
        </div>

        {addError && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger dark:bg-red-950">
            <X size={14} /> {addError}
          </div>
        )}
        {addSuccess && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
            <CheckCircle size={14} /> {addSuccess}
          </div>
        )}
      </div>

      {/* Members list */}
      <div className="mt-4 rounded-lg border border-card-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-card-border bg-card-bg">
          <h2 className="text-sm font-semibold text-foreground">
            Current Team{' '}
            {!loading && (
              <span className="font-normal text-muted">
                ({activeCount} active{pendingCount > 0 ? `, ${pendingCount} pending` : ''})
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-card-border" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <UserCog size={32} className="text-muted" />
            <p className="text-sm font-medium text-foreground">No team members yet</p>
            <p className="text-xs text-muted">
              Add emails above so others can co-manage your dashboard.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-card-border">
            {members.map((member) => (
              <li key={member.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {(member.display_name ?? member.email).charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  {member.display_name ? (
                    <>
                      <p className="text-sm font-medium text-foreground truncate">{member.display_name}</p>
                      <p className="text-xs text-muted truncate">{member.email}</p>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Mail size={13} className="shrink-0 text-muted" />
                      <p className="text-sm text-foreground truncate">{member.email}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted mt-0.5">
                    Added {format(new Date(member.invited_at), 'dd MMM yyyy')}
                  </p>
                </div>

                {/* Status badge */}
                {member.status === 'active' ? (
                  <span className="flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
                    <CheckCircle size={11} />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    <Clock size={11} />
                    Pending
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => handleRemove(member)}
                  disabled={removingId === member.id}
                  className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-red-50 hover:text-danger disabled:opacity-40 dark:hover:bg-red-950"
                  title="Remove from team"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
