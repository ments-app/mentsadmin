'use client';

import { useState } from 'react';
import { Sparkles, Loader2, RotateCcw } from 'lucide-react';

type AiFieldButtonProps = {
  field: string;
  type: 'job' | 'gig' | 'resource';
  context: Record<string, string>;
  onGenerated: (text: string) => void;
  disabled?: boolean;
};

export default function AiFieldButton({
  field,
  type,
  context,
  onGenerated,
  disabled,
}: AiFieldButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function generate() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, type, context }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Generation failed');
        return;
      }
      if (json.text) {
        onGenerated(json.text);
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
        onClick={generate}
        disabled={loading || disabled}
        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/30 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300 transition-all hover:from-violet-500/20 hover:to-fuchsia-500/20 hover:border-violet-500/50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-3.5 w-3.5" />
            Generate with AI
          </>
        )}
      </button>
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  );
}
