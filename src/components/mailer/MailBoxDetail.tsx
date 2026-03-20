'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Mail, X } from 'lucide-react';
import { getMailBox, addEmailsToBox, removeEmailFromBox, updateMailBox } from '@/actions/mailer';
import type { MailBox, MailBoxEmail } from '@/lib/types';
import Link from 'next/link';

interface Props {
  boxId: string;
  role: 'facilitator' | 'startup';
}

export default function MailBoxDetail({ boxId, role }: Props) {
  const router = useRouter();
  const basePath = `/${role}/mailer`;

  const [box, setBox] = useState<MailBox | null>(null);
  const [emails, setEmails] = useState<MailBoxEmail[]>([]);
  const [loading, setLoading] = useState(true);

  // Add emails
  const [showAdd, setShowAdd] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [addResult, setAddResult] = useState<string | null>(null);

  // Edit name
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Search
  const [search, setSearch] = useState('');

  const fetchBox = async () => {
    try {
      const data = await getMailBox(boxId);
      setBox(data.box);
      setEmails(data.emails);
      setNameInput(data.box.name);
      setDescInput(data.box.description ?? '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBox();
  }, [boxId]);

  const handleAddEmails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setAdding(true);
    setAddResult(null);
    try {
      // Parse emails: comma, newline, or space separated
      const parsed = emailInput
        .split(/[\n,;\s]+/)
        .map((e) => e.trim())
        .filter(Boolean);

      const count = await addEmailsToBox(boxId, parsed);
      setAddResult(`Added ${count} email${count === 1 ? '' : 's'}`);
      setEmailInput('');
      fetchBox();
    } catch (err) {
      setAddResult(err instanceof Error ? err.message : 'Failed to add');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (emailId: string) => {
    try {
      await removeEmailFromBox(boxId, emailId);
      setEmails((prev) => prev.filter((e) => e.id !== emailId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    setSaving(true);
    try {
      await updateMailBox(boxId, { name: nameInput.trim(), description: descInput.trim() });
      setBox((prev) => prev ? { ...prev, name: nameInput.trim(), description: descInput.trim() || null } : prev);
      setEditingName(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const filtered = search
    ? emails.filter((e) => e.email.toLowerCase().includes(search.toLowerCase()))
    : emails;

  if (loading) {
    return (
      <div className="animate-fade-in max-w-3xl mx-auto">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-card-border/50" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-card-border/30" />
          ))}
        </div>
      </div>
    );
  }

  if (!box) {
    return (
      <div className="text-center py-20 text-muted">
        Mail box not found.
        <br />
        <Link href={basePath} className="text-primary hover:underline mt-2 inline-block">Go back</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <Link href={basePath} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors mb-4">
        <ArrowLeft size={15} />
        Back to Mailer
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          {editingName ? (
            <div className="space-y-2">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="text-2xl font-semibold bg-transparent border-b-2 border-primary outline-none text-foreground w-full"
              />
              <input
                type="text"
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                placeholder="Description (optional)"
                className="text-sm bg-transparent border-b border-card-border outline-none text-muted w-full"
              />
              <div className="flex gap-2">
                <button onClick={handleSaveName} disabled={saving} className="btn-primary !py-1.5 !px-3 !text-xs">
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setEditingName(false)} className="btn-secondary !py-1.5 !px-3 !text-xs">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h1
                className="text-2xl font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                onClick={() => setEditingName(true)}
                title="Click to edit"
              >
                {box.name}
              </h1>
              {box.description && <p className="text-sm text-muted mt-0.5">{box.description}</p>}
              <p className="text-xs text-muted mt-1">{emails.length} email{emails.length === 1 ? '' : 's'}</p>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={15} />
          Add Emails
        </button>
      </div>

      {/* Search */}
      {emails.length > 5 && (
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emails..."
            className="w-full rounded-xl border border-card-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      )}

      {/* Email List */}
      {emails.length === 0 ? (
        <div className="text-center py-16">
          <Mail size={36} className="mx-auto text-muted/30 mb-3" />
          <p className="text-muted">No emails in this box yet.</p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-3 text-sm text-primary hover:underline"
          >
            Add emails
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-card-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-card-border/10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Added</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {filtered.map((email, i) => (
                <tr key={email.id} className="hover:bg-card-border/5 transition-colors">
                  <td className="px-4 py-3 text-muted">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{email.email}</td>
                  <td className="px-4 py-3 text-muted text-xs">
                    {new Date(email.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRemove(email.id)}
                      className="text-muted hover:text-red-500 transition-colors"
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Emails Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Add Emails</h2>
              <button onClick={() => { setShowAdd(false); setAddResult(null); }} className="text-muted hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-muted mb-3">
              Paste emails separated by commas, newlines, or spaces.
            </p>
            <form onSubmit={handleAddEmails} className="space-y-4">
              <textarea
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder={"john@example.com, jane@example.com\nalice@example.com"}
                rows={6}
                className="w-full rounded-xl border border-card-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-y"
              />
              {addResult && (
                <p className="text-sm text-primary font-medium">{addResult}</p>
              )}
              <div className="flex gap-3">
                <button type="submit" disabled={adding} className="btn-primary flex-1">
                  {adding ? 'Adding...' : 'Add Emails'}
                </button>
                <button type="button" onClick={() => { setShowAdd(false); setAddResult(null); }} className="btn-secondary flex-1">
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
