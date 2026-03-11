'use client';

import { useState } from 'react';
import { Sparkles, Loader2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/cn';

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
      const raw = await res.text();
      let json: { text?: string; error?: string } = {};
      try { json = JSON.parse(raw); } catch { /* non-JSON response */ }

      if (!res.ok) {
        setError(json.error || `Server error (${res.status})`);
        return;
      }
      if (json.text) {
        onGenerated(json.text);
      }
    } catch {
      setError('Request failed — check dev server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-2.5">
      <button
        type="button"
        onClick={generate}
        disabled={loading || disabled}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold',
          'border border-input-focus/25 bg-input-focus/8 text-input-focus',
          'shadow-[var(--shadow-sm)] transition-all duration-200',
          'hover:border-input-focus/40 hover:bg-input-focus/15 hover:shadow-input-focus/10',
          'active:scale-[0.97]',
          'disabled:cursor-not-allowed disabled:opacity-40'
        )}
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
        <span className="text-xs font-medium text-danger">{error}</span>
      )}
    </div>
  );
}
