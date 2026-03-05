'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Users, Globe, Search, X, UserPlus, Trash2, Mail, CheckCircle,
  Upload, FileText, AlertCircle,
} from 'lucide-react';
import {
  getMyStudentEmails,
  addStudentEmail,
  removeStudentEmail,
  searchPlatformUsers,
  bulkAddStudentEmails,
  type StudentEmailEntry,
  type BulkAddResult,
} from '@/actions/facilitator-students';
import { format } from 'date-fns';

type SearchResult = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
};

// ─── CSV parser ───────────────────────────────────────────────────────────────
function parseEmailsFromText(text: string): { valid: string[]; invalidCount: number } {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const seen = new Set<string>();
  const valid: string[] = [];
  let invalidCount = 0;

  // Split on newlines first, then commas within each line (proper CSV handling)
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const cells = line.split(',');
    for (const cell of cells) {
      const val = cell.trim().replace(/^["']|["']$/g, ''); // strip surrounding quotes
      if (!val) continue;
      if (!EMAIL_RE.test(val)) { invalidCount++; continue; }
      const lower = val.toLowerCase();
      if (seen.has(lower)) continue;
      seen.add(lower);
      valid.push(lower);
    }
  }

  return { valid, invalidCount };
}

export default function FacilitatorStudentsPage() {
  // ── Single-add state ────────────────────────────────────────────────────────
  const [students, setStudents] = useState<StudentEmailEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Bulk-upload state ───────────────────────────────────────────────────────
  const [bulkEmails, setBulkEmails] = useState<string[]>([]);
  const [bulkInvalidCount, setBulkInvalidCount] = useState(0);
  const [bulkFileName, setBulkFileName] = useState('');
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkAddResult | null>(null);
  const [bulkError, setBulkError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getMyStudentEmails()
      .then(setStudents)
      .finally(() => setLoading(false));
  }, []);

  // close autocomplete on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Single-add handlers ─────────────────────────────────────────────────────
  function handleInputChange(value: string) {
    setEmailInput(value);
    setAddError('');
    setAddSuccess('');

    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (value.trim().length >= 2) {
      setSearching(true);
      setShowDropdown(true);
      searchTimer.current = setTimeout(async () => {
        try {
          const results = await searchPlatformUsers(value.trim());
          setSearchResults(results);
        } catch {
          setSearchResults([]);
        } finally {
          setSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
      setSearching(false);
    }
  }

  function selectUser(user: SearchResult) {
    setEmailInput(user.email);
    setShowDropdown(false);
    setSearchResults([]);
  }

  async function handleAdd() {
    const email = emailInput.trim();
    if (!email) return;
    setAddError('');
    setAddSuccess('');
    setAdding(true);
    try {
      const { invited } = await addStudentEmail(email);
      const refreshed = await getMyStudentEmails();
      setStudents(refreshed);
      setEmailInput('');
      setAddSuccess(
        invited
          ? `${email} added and invited to join Ments.`
          : `${email} added to your access list.`
      );
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add email');
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(email: string) {
    setRemovingEmail(email);
    try {
      await removeStudentEmail(email);
      setStudents((prev) => prev.filter((s) => s.email !== email));
    } catch (err) {
      console.error(err);
    } finally {
      setRemovingEmail(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); setShowDropdown(false); handleAdd(); }
    if (e.key === 'Escape') setShowDropdown(false);
  }

  // ── Bulk-upload handlers ────────────────────────────────────────────────────
  function processFile(file: File) {
    setBulkResult(null);
    setBulkError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { valid, invalidCount } = parseEmailsFromText(text);
      setBulkEmails(valid);
      setBulkInvalidCount(invalidCount);
      setBulkFileName(file.name);
    };
    reader.readAsText(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = ''; // reset so re-upload of same file fires
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function clearBulk() {
    setBulkEmails([]);
    setBulkInvalidCount(0);
    setBulkFileName('');
    setBulkResult(null);
    setBulkError('');
  }

  async function handleBulkUpload() {
    if (bulkEmails.length === 0) return;
    setBulkUploading(true);
    setBulkError('');
    setBulkResult(null);
    try {
      const result = await bulkAddStudentEmails(bulkEmails);
      setBulkResult(result);
      const refreshed = await getMyStudentEmails();
      setStudents(refreshed);
      setBulkEmails([]);
      setBulkFileName('');
      setBulkInvalidCount(0);
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'Bulk upload failed');
    } finally {
      setBulkUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Student Access List</h1>
          <p className="mt-1 text-sm text-muted">
            Posts marked "Students Only" are visible exclusively to emails in this list.
          </p>
        </div>
        <span className="mt-1 flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          <Users size={14} />
          {loading ? '—' : students.length} students
        </span>
      </div>

      {/* Info banner */}
      <div className="mt-5 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
        <Globe size={18} className="mt-0.5 shrink-0 text-blue-500" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium">How visibility works</p>
          <p className="mt-0.5">
            When you create a job, gig, event, or competition and set it to "Students Only",
            only users whose email is in this list will be able to see it on the platform.
            Anyone not on this list (including the general public) will not see those posts.
          </p>
        </div>
      </div>

      {/* ── Add single student ────────────────────────────────────────────── */}
      <div className="mt-6 rounded-lg border border-card-border p-4 space-y-3">
        <h2 className="text-base font-semibold text-foreground">Add Student</h2>
        <p className="text-sm text-muted">
          Search by name or email to find existing Ments users, or type any email address directly.
          Students not yet on Ments will receive an invite email.
        </p>

        <div className="relative" ref={dropdownRef}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="email"
                value={emailInput}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => emailInput.trim().length >= 2 && setShowDropdown(true)}
                placeholder="Search or type email address..."
                className="w-full rounded-lg border border-card-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
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

          {/* Autocomplete dropdown */}
          {showDropdown && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-card-border bg-background shadow-lg">
              {searching ? (
                <div className="px-3 py-3 text-sm text-muted">Searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => selectUser(user)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-card-border/30 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                        {(user.full_name ?? user.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.full_name ?? user.email}
                      </p>
                      {user.full_name && (
                        <p className="text-xs text-muted truncate">{user.email}</p>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-3 text-sm text-muted">
                  No users found — you can still add any email address.
                </div>
              )}
            </div>
          )}
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

      {/* ── Bulk upload ───────────────────────────────────────────────────── */}
      <div className="mt-4 rounded-lg border border-card-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Bulk Upload</h2>
            <p className="text-sm text-muted">Upload a CSV or TXT file — one email per line, or comma-separated.</p>
          </div>
          {bulkEmails.length > 0 && (
            <button
              type="button"
              onClick={clearBulk}
              className="text-xs text-muted hover:text-foreground transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Drop zone (only when no file loaded) */}
        {bulkEmails.length === 0 && !bulkResult && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-card-border hover:border-primary/50 hover:bg-card-bg'
            }`}
          >
            <Upload size={24} className={isDragging ? 'text-primary' : 'text-muted'} />
            <div>
              <p className="text-sm font-medium text-foreground">
                Drop your CSV here, or <span className="text-primary">browse</span>
              </p>
              <p className="mt-0.5 text-xs text-muted">.csv or .txt — emails one per line or comma-separated</p>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt,text/csv,text/plain"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Preview after file parsed */}
        {bulkEmails.length > 0 && (
          <div className="space-y-3">
            {/* File name + stats */}
            <div className="flex items-center gap-2 rounded-lg border border-card-border bg-card-bg px-3 py-2">
              <FileText size={15} className="shrink-0 text-muted" />
              <span className="flex-1 truncate text-sm text-foreground">{bulkFileName}</span>
              <button
                type="button"
                onClick={clearBulk}
                className="shrink-0 text-muted hover:text-foreground transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
                <CheckCircle size={11} />
                {bulkEmails.length} valid email{bulkEmails.length !== 1 ? 's' : ''}
              </span>
              {bulkInvalidCount > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  <AlertCircle size={11} />
                  {bulkInvalidCount} invalid / skipped
                </span>
              )}
            </div>

            {/* Preview list (first 8) */}
            <div className="max-h-40 overflow-y-auto rounded-lg border border-card-border divide-y divide-card-border text-sm">
              {bulkEmails.slice(0, 8).map((email) => (
                <div key={email} className="flex items-center gap-2 px-3 py-1.5">
                  <Mail size={12} className="shrink-0 text-muted" />
                  <span className="truncate text-foreground">{email}</span>
                </div>
              ))}
              {bulkEmails.length > 8 && (
                <div className="px-3 py-1.5 text-xs text-muted">
                  + {bulkEmails.length - 8} more…
                </div>
              )}
            </div>

            {bulkError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger dark:bg-red-950">
                <X size={14} /> {bulkError}
              </div>
            )}

            <button
              type="button"
              onClick={handleBulkUpload}
              disabled={bulkUploading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              <Upload size={15} />
              {bulkUploading ? 'Uploading…' : `Add ${bulkEmails.length} student${bulkEmails.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        )}

        {/* Result summary */}
        {bulkResult && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">Upload complete</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-green-700 dark:text-green-300">
              <span><span className="font-semibold">{bulkResult.added}</span> added</span>
              {bulkResult.invited > 0 && (
                <span><span className="font-semibold">{bulkResult.invited}</span> invited to Ments</span>
              )}
              {bulkResult.skipped > 0 && (
                <span><span className="font-semibold">{bulkResult.skipped}</span> already in list</span>
              )}
              {bulkResult.invalid > 0 && (
                <span><span className="font-semibold">{bulkResult.invalid}</span> invalid</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Student list ──────────────────────────────────────────────────── */}
      <div className="mt-4 rounded-lg border border-card-border overflow-hidden">
        <div className="px-4 py-3 border-b border-card-border bg-card-bg">
          <h2 className="text-sm font-semibold text-foreground">
            Current Access List{' '}
            {!loading && <span className="font-normal text-muted">({students.length})</span>}
          </h2>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-card-border" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Users size={32} className="text-muted" />
            <p className="text-sm font-medium text-foreground">No students added yet</p>
            <p className="text-xs text-muted">
              Add student emails above to control who can see your restricted posts.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-card-border">
            {students.map((student) => (
              <li key={student.email} className="flex items-center gap-3 px-4 py-3">
                {student.user?.avatar_url ? (
                  <img
                    src={student.user.avatar_url}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {student.email.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  {student.user?.display_name ? (
                    <>
                      <p className="text-sm font-medium text-foreground truncate">
                        {student.user.display_name}
                      </p>
                      <p className="text-xs text-muted truncate">{student.email}</p>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Mail size={13} className="shrink-0 text-muted" />
                      <p className="text-sm text-foreground truncate">{student.email}</p>
                      <span className="ml-1 shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        Not registered
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-muted mt-0.5">
                    Added {format(new Date(student.added_at), 'dd MMM yyyy')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(student.email)}
                  disabled={removingEmail === student.email}
                  className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-red-50 hover:text-danger disabled:opacity-40 dark:hover:bg-red-950"
                  title="Remove from access list"
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
