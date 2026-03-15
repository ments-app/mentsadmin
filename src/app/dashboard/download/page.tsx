'use client';

import { useEffect, useState } from 'react';
import { Download, RefreshCw, Copy, Check, FileJson } from 'lucide-react';
import { getStartupRankings, type StartupRankingEntry } from '@/actions/startups';

export default function DownloadPage() {
  const [rankings, setRankings] = useState<StartupRankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getStartupRankings();
      setRankings(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const jsonString = JSON.stringify(rankings, null, 2);

  function handleDownload() {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `startup-rankings-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Download</h1>
          <p className="mt-1 text-sm text-muted">
            Startup rankings export &mdash;{' '}
            {loading ? 'Loading...' : `${rankings.length} published startups`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="btn-ghost gap-2"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={handleCopy}
            disabled={loading || rankings.length === 0}
            className="btn-secondary gap-2"
          >
            {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
            {copied ? 'Copied!' : 'Copy JSON'}
          </button>
          <button
            onClick={handleDownload}
            disabled={loading || rankings.length === 0}
            className="btn-primary gap-2"
          >
            <Download size={15} />
            Download JSON
          </button>
        </div>
      </div>

      {/* Stats row */}
      {!loading && rankings.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total Startups', value: rankings.length },
            { label: 'Total Upvotes', value: rankings.reduce((sum, r) => sum + r.total_upvotes, 0) },
            { label: 'With Upvotes', value: rankings.filter((r) => r.total_upvotes > 0).length },
          ].map((stat) => (
            <div key={stat.label} className="card-elevated rounded-xl px-5 py-4">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="mt-0.5 text-xs text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* JSON Preview */}
      <div className="card-elevated rounded-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-card-border bg-background/50 px-5 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <FileJson size={16} className="text-primary" />
            startup-rankings.json
          </div>
          <span className="text-xs text-muted">
            {loading ? '…' : `${(new TextEncoder().encode(jsonString).length / 1024).toFixed(1)} KB`}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <RefreshCw size={24} className="animate-spin text-muted" />
          </div>
        ) : rankings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <FileJson size={48} className="mb-4 text-muted/30" />
            <p className="text-base font-medium text-foreground">No published startups</p>
            <p className="mt-1 text-sm text-muted">Publish startup profiles to see them here</p>
          </div>
        ) : (
          <pre className="max-h-[60vh] overflow-auto p-5 text-xs leading-relaxed text-foreground/80 font-mono">
            {jsonString}
          </pre>
        )}
      </div>
    </div>
  );
}
