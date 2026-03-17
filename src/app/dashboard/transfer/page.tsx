'use client';

import { useState, useEffect, useRef } from 'react';
import { searchStartupsForTransfer, transferStartupOwnership, searchUsers } from '@/actions/startups';
import { Search, ArrowRightLeft, AlertCircle, CheckCircle2, Rocket, User } from 'lucide-react';

type StartupResult = { id: string; brand_name: string; owner_email: string; owner_name: string };
type UserResult = { id: string; username: string; full_name: string; avatar_url: string | null; email: string };

export default function TransferStartupPage() {
  // ── Startup search ──
  const [startupQuery, setStartupQuery] = useState('');
  const [startupResults, setStartupResults] = useState<StartupResult[]>([]);
  const [selectedStartup, setSelectedStartup] = useState<StartupResult | null>(null);
  const [searchingStartup, setSearchingStartup] = useState(false);
  const [showStartupDropdown, setShowStartupDropdown] = useState(false);
  const startupRef = useRef<HTMLDivElement>(null);

  // ── New owner search ──
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [newOwner, setNewOwner] = useState<UserResult | null>(null);
  const [searchingUser, setSearchingUser] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  // ── Transfer state ──
  const [transferring, setTransferring] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState('');

  // ── Startup search debounce ──
  useEffect(() => {
    if (startupQuery.length < 2) {
      setStartupResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingStartup(true);
      try {
        const data = await searchStartupsForTransfer(startupQuery);
        setStartupResults(data);
        setShowStartupDropdown(true);
      } catch { /* ignore */ }
      setSearchingStartup(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [startupQuery]);

  // ── User search debounce ──
  useEffect(() => {
    if (userQuery.length < 2) {
      setUserResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingUser(true);
      try {
        const data = await searchUsers(userQuery);
        setUserResults(data);
        setShowUserDropdown(true);
      } catch { /* ignore */ }
      setSearchingUser(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [userQuery]);

  // ── Click outside to close dropdowns ──
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (startupRef.current && !startupRef.current.contains(e.target as Node)) {
        setShowStartupDropdown(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleTransfer() {
    if (!selectedStartup || !newOwner) return;
    setTransferring(true);
    setError('');
    setResult(null);
    try {
      const res = await transferStartupOwnership(selectedStartup.id, newOwner.email);
      setResult(res);
      // Reset form on success
      setSelectedStartup(null);
      setStartupQuery('');
      setNewOwner(null);
      setUserQuery('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed');
    }
    setTransferring(false);
  }

  return (
    <div className="animate-fade-in mx-auto max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Transfer Startup</h1>
            <p className="text-sm text-muted">Transfer startup ownership to a different user</p>
          </div>
        </div>
      </div>

      {/* Success message */}
      {result?.success && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/50 dark:text-emerald-400">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{result.message}</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-950/50 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* ── Step 1: Select Startup ── */}
        <div className="card-elevated rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">1</span>
            <h2 className="text-base font-semibold text-foreground">Select Startup</h2>
          </div>

          {selectedStartup ? (
            <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Rocket className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{selectedStartup.brand_name}</p>
                  <p className="text-xs text-muted">Owner: {selectedStartup.owner_name} ({selectedStartup.owner_email})</p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedStartup(null); setStartupQuery(''); }}
                className="text-xs font-medium text-primary hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            <div ref={startupRef} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type="text"
                  value={startupQuery}
                  onChange={(e) => setStartupQuery(e.target.value)}
                  placeholder="Search startup by name..."
                  className="w-full rounded-xl border border-card-border bg-background pl-10 pr-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {searchingStartup && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-card-border border-t-primary" />
                )}
              </div>

              {showStartupDropdown && startupResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border border-card-border bg-card-bg shadow-lg overflow-hidden">
                  {startupResults.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedStartup(s);
                        setStartupQuery(s.brand_name);
                        setShowStartupDropdown(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-card-border/30 transition-colors border-b border-card-border/50 last:border-0"
                    >
                      <Rocket className="h-4 w-4 text-muted shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{s.brand_name}</p>
                        <p className="text-xs text-muted truncate">{s.owner_name} &middot; {s.owner_email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {showStartupDropdown && startupQuery.length >= 2 && startupResults.length === 0 && !searchingStartup && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border border-card-border bg-card-bg shadow-lg p-4 text-center text-sm text-muted">
                  No startups found
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Step 2: New Owner ── */}
        <div className="card-elevated rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">2</span>
            <h2 className="text-base font-semibold text-foreground">New Owner</h2>
          </div>

          {newOwner ? (
            <div className="flex items-center justify-between rounded-xl border border-emerald-300/30 bg-emerald-50/50 p-4 dark:border-emerald-800/30 dark:bg-emerald-950/30">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                  <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{newOwner.full_name || newOwner.username}</p>
                  <p className="text-xs text-muted">{newOwner.email}</p>
                </div>
              </div>
              <button
                onClick={() => { setNewOwner(null); setUserQuery(''); }}
                className="text-xs font-medium text-primary hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            <div ref={userRef} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type="text"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full rounded-xl border border-card-border bg-background pl-10 pr-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {searchingUser && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-card-border border-t-primary" />
                )}
              </div>

              {showUserDropdown && userResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border border-card-border bg-card-bg shadow-lg overflow-hidden">
                  {userResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setNewOwner(u);
                        setUserQuery(u.full_name || u.email);
                        setShowUserDropdown(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-card-border/30 transition-colors border-b border-card-border/50 last:border-0"
                    >
                      {u.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{u.full_name || u.username}</p>
                        <p className="text-xs text-muted truncate">{u.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {showUserDropdown && userQuery.length >= 2 && userResults.length === 0 && !searchingUser && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border border-card-border bg-card-bg shadow-lg p-4 text-center text-sm text-muted">
                  No users found
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Step 3: Confirm Transfer ── */}
        {selectedStartup && newOwner && (
          <div className="card-elevated rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">3</span>
              <h2 className="text-base font-semibold text-foreground">Confirm Transfer</h2>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800/30 dark:bg-amber-950/30">
              <div className="flex items-center gap-4">
                <div className="text-center min-w-0 flex-1">
                  <p className="text-xs text-muted mb-1">From</p>
                  <p className="text-sm font-medium text-foreground truncate">{selectedStartup.owner_name}</p>
                  <p className="text-xs text-muted truncate">{selectedStartup.owner_email}</p>
                </div>
                <ArrowRightLeft className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div className="text-center min-w-0 flex-1">
                  <p className="text-xs text-muted mb-1">To</p>
                  <p className="text-sm font-medium text-foreground truncate">{newOwner.full_name || newOwner.username}</p>
                  <p className="text-xs text-muted truncate">{newOwner.email}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800/30 text-center">
                <p className="text-sm font-semibold text-foreground">&ldquo;{selectedStartup.brand_name}&rdquo;</p>
              </div>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              This will transfer ownership of the startup profile and all associated content (jobs, gigs, events, competitions) to the new owner.
              The new owner will be granted the <span className="font-medium">startup</span> role if they don&apos;t already have one.
            </p>

            <button
              onClick={handleTransfer}
              disabled={transferring}
              className="btn-primary w-full"
            >
              {transferring ? 'Transferring...' : 'Transfer Ownership'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
