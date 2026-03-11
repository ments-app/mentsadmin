'use client';

import { TriangleAlert } from 'lucide-react';

interface DeleteConfirmModalProps {
  open: boolean;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function DeleteConfirmModal({
  open,
  title,
  onConfirm,
  onCancel,
  loading,
}: DeleteConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="glass fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="animate-scale-in card-elevated w-full max-w-sm p-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10">
            <TriangleAlert size={24} className="text-danger" />
          </div>

          <h3 className="mt-4 text-lg font-semibold text-foreground">
            Delete Confirmation
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Are you sure you want to delete{' '}
            <strong className="font-semibold text-foreground">{title}</strong>?
            This action cannot be undone.
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="btn-danger flex-1"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
