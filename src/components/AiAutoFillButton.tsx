'use client';

import { useState } from 'react';
import { Zap, Loader2 } from 'lucide-react';

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
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleAutoFill}
        disabled={loading || !url}
        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 transition-all hover:from-amber-500/20 hover:to-orange-500/20 hover:border-amber-500/50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
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
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  );
}
