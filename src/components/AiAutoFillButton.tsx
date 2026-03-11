'use client';

import { useState } from 'react';
import { Zap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type AiAutoFillButtonProps = {
  url: string;
  category?: string;
  onAutoFilled: (data: Record<string, unknown>) => void;
};

export default function AiAutoFillButton({ url, category, onAutoFilled }: AiAutoFillButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAutoFill() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, category }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Auto-fill failed');
        return;
      }
      if (json.data) {
        onAutoFilled(json.data);
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-2.5">
      <button
        type="button"
        onClick={handleAutoFill}
        disabled={loading || !url}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold',
          'border border-amber-500/25 bg-amber-500/8 text-amber-600 dark:text-amber-400',
          'shadow-[var(--shadow-sm)] transition-all duration-200',
          'hover:border-amber-500/40 hover:bg-amber-500/15 hover:shadow-amber-500/10',
          'active:scale-[0.97]',
          'disabled:cursor-not-allowed disabled:opacity-40'
        )}
      >
        {loading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Auto-filling...
          </>
        ) : (
          <>
            <Zap className="h-3.5 w-3.5" />
            Auto-fill from URL
          </>
        )}
      </button>
      {error && (
        <span className="text-xs font-medium text-danger">{error}</span>
      )}
    </div>
  );
}
