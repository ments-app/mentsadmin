'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Mail, Inbox, X } from 'lucide-react';
import { getMailBoxes, createMailBox, deleteMailBox } from '@/actions/mailer';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';

interface Props {
  role: 'facilitator' | 'startup';
}

export default function MailBoxList({ role }: Props) {
  const basePath = `/${role}/mailer`;

  const [boxes, setBoxes] = useState<Awaited<ReturnType<typeof getMailBoxes>>>([]);
  const [loading, setLoading] = useState(true);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBoxes = async () => {
    try {
      const data = await getMailBoxes();
      setBoxes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoxes();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    setCreating(true);
    try {
      await createMailBox({ name: createName.trim(), description: createDesc.trim() });
      setShowCreate(false);
      setCreateName('');
      setCreateDesc('');
      fetchBoxes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create box');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMailBox(deleteTarget.id);
      setDeleteTarget(null);
      fetchBoxes();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Mailer</h1>
          <p className="mt-1 text-sm text-muted">Manage email groups and send campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`${basePath}/compose`} className="btn-primary flex items-center gap-2">
            <Mail size={15} />
            Compose
          </Link>
          <button onClick={() => setShowCreate(true)} className="btn-secondary flex items-center gap-2">
            <Plus size={15} />
            New Box
          </button>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex gap-2 mb-6">
        <Link href={`${basePath}/history`} className="text-sm text-primary hover:underline">
          View Sent History
        </Link>
      </div>

      {/* Boxes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-card-border/30" />
          ))}
        </div>
      ) : boxes.length === 0 ? (
        <div className="text-center py-20">
          <Inbox size={40} className="mx-auto text-muted/30 mb-3" />
          <p className="text-muted">No mail boxes yet. Create one to start organizing emails.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boxes.map((box) => (
            <div
              key={box.id}
              className="card-elevated rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <Link href={`${basePath}/${box.id}`} className="flex-1">
                <h3 className="font-semibold text-foreground text-base">{box.name}</h3>
                {box.description && (
                  <p className="text-xs text-muted mt-1 line-clamp-2">{box.description}</p>
                )}
                <div className="mt-3 flex items-center gap-1.5">
                  <Mail size={13} className="text-muted" />
                  <span className="text-sm font-medium text-foreground">{box.email_count}</span>
                  <span className="text-xs text-muted">emails</span>
                </div>
              </Link>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] text-muted">
                  {new Date(box.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => setDeleteTarget({ id: box.id, name: box.name })}
                  className="text-muted hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">New Mail Box</h2>
              <button onClick={() => setShowCreate(false)} className="text-muted hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Name *</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Batch 2024, Design Students..."
                  required
                  className="w-full rounded-xl border border-card-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Description</label>
                <input
                  type="text"
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder="Optional description..."
                  className="w-full rounded-xl border border-card-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={creating} className="btn-primary flex-1">
                  {creating ? 'Creating...' : 'Create Box'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        open={!!deleteTarget}
        title={deleteTarget?.name ?? ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
