'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, AlertCircle, CheckCircle, X, Sparkles, Loader2 } from 'lucide-react';
import { bulkCreateResources } from '@/actions/resources';
import { supabase } from '@/lib/supabase';
import { CATEGORY_METADATA_FIELDS } from '@/lib/category-metadata';

const VALID_CATEGORIES = ['govt_scheme', 'accelerator_incubator', 'company_offer', 'tool', 'bank_offer', 'scheme'];

// CSV column names mapped to their purpose
const EXPECTED_COLUMNS = [
  'Name', 'Location', 'Website', 'Summary Information', 'Recent Investments',
  'Sectors', 'Average Startup Age at Investment', 'Average No of Founders',
  'Average age of Founders', 'Companies Invested',
  // New category-specific columns
  'discount_value', 'promo_code', 'valid_until', 'terms',
  'pricing_model', 'platform', 'features',
  'interest_rate', 'loan_range', 'repayment_period', 'collateral_required',
];

type ParsedRow = {
  title: string;
  description: string;
  url: string;
  logo_url: string;
  category: string;
  provider: string;
  eligibility: string;
  deadline: string;
  tags: string[];
  // Scheme metadata
  location: string;
  recent_investments: string;
  sectors: string;
  avg_startup_age: string;
  avg_num_founders: string;
  avg_founder_age: string;
  companies_invested: string;
  // Company offer metadata
  discount_value: string;
  promo_code: string;
  valid_until: string;
  terms: string;
  // Tool metadata
  pricing_model: string;
  platform: string;
  features: string;
  // Bank offer metadata
  interest_rate: string;
  loan_range: string;
  repayment_period: string;
  collateral_required: string;
  errors: string[];
};

function detectDelimiter(text: string): string {
  // Check the first line to detect delimiter
  const firstLine = text.split(/\r?\n/)[0] || '';
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  return tabCount > commaCount ? '\t' : ',';
}

function parseCSV(text: string): string[][] {
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        row.push(current.trim());
        current = '';
      } else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
        row.push(current.trim());
        current = '';
        if (row.some(cell => cell !== '')) rows.push(row);
        row = [];
        if (ch === '\r') i++;
      } else {
        current += ch;
      }
    }
  }
  // Last row
  row.push(current.trim());
  if (row.some(cell => cell !== '')) rows.push(row);

  return rows;
}

function mapRow(headers: string[], values: string[]): ParsedRow {
  const get = (name: string) => {
    const idx = headers.findIndex(h => h.toLowerCase().trim() === name.toLowerCase().trim());
    return idx >= 0 ? (values[idx] || '').trim() : '';
  };

  const title = get('Name') || get('title');
  const errors: string[] = [];
  if (!title) errors.push('Title/Name is required');

  return {
    title,
    description: get('Summary Information') || get('description'),
    url: get('Website') || get('url'),
    logo_url: get('logo_url'),
    category: get('category') || 'scheme',
    provider: get('provider'),
    eligibility: get('eligibility'),
    deadline: get('deadline'),
    tags: (get('tags') || '').split(',').map(t => t.trim()).filter(Boolean),
    location: get('Location'),
    recent_investments: get('Recent Investments'),
    sectors: get('Sectors'),
    avg_startup_age: get('Average Startup Age at Investment') || get('avg_startup_age'),
    avg_num_founders: get('Average No of Founders') || get('avg_num_founders'),
    avg_founder_age: get('Average age of Founders') || get('avg_founder_age'),
    companies_invested: get('Companies Invested') || get('companies_invested'),
    // Company offer
    discount_value: get('discount_value'),
    promo_code: get('promo_code'),
    valid_until: get('valid_until'),
    terms: get('terms'),
    // Tool
    pricing_model: get('pricing_model'),
    platform: get('platform'),
    features: get('features'),
    // Bank offer
    interest_rate: get('interest_rate'),
    loan_range: get('loan_range'),
    repayment_period: get('repayment_period'),
    collateral_required: get('collateral_required'),
    errors,
  };
}

function buildMetadataForRow(row: ParsedRow): Record<string, string> {
  const cat = VALID_CATEGORIES.includes(row.category) ? row.category : 'scheme';
  const fields = CATEGORY_METADATA_FIELDS[cat];
  if (!fields) return {};

  const metadata: Record<string, string> = {};
  for (const field of fields) {
    const val = (row as Record<string, unknown>)[field.key];
    if (typeof val === 'string' && val) {
      metadata[field.key] = val;
    }
  }
  return metadata;
}

export default function ImportResourcesPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [fileName, setFileName] = useState('');
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceProgress, setEnhanceProgress] = useState({ current: 0, total: 0 });

  function handleFile(file: File) {
    setResult(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length < 2) {
        setRows([]);
        setResult({ success: false, message: 'CSV must have a header row and at least one data row.' });
        return;
      }
      const headers = parsed[0];
      const dataRows = parsed.slice(1).map(values => mapRow(headers, values));
      setRows(dataRows);
    };
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.tsv') || file.type === 'text/csv' || file.type === 'text/tab-separated-values')) {
      handleFile(file);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  const hasErrors = rows.some(r => r.errors.length > 0);
  const validCount = rows.filter(r => r.errors.length === 0).length;

  async function handleEnhanceAll() {
    const rowsToEnhance = rows.filter(r => r.url && (!r.description || !r.eligibility));
    if (rowsToEnhance.length === 0) {
      setResult({ success: false, message: 'No rows with URLs and missing fields to enhance.' });
      return;
    }

    setEnhancing(true);
    setEnhanceProgress({ current: 0, total: rowsToEnhance.length });

    const updated = [...rows];
    let enhanced = 0;

    for (let i = 0; i < updated.length; i++) {
      const row = updated[i];
      if (!row.url || (row.description && row.eligibility)) continue;

      try {
        const res = await fetch('/api/ai/autofill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: row.url, category: row.category }),
        });
        const json = await res.json();

        if (res.ok && json.data) {
          const data = json.data as Record<string, unknown>;
          if (!row.description && data.description) updated[i] = { ...updated[i], description: data.description as string };
          if (!row.eligibility && data.eligibility) updated[i] = { ...updated[i], eligibility: data.eligibility as string };
          if (!row.provider && data.provider) updated[i] = { ...updated[i], provider: data.provider as string };
          if (data.category && VALID_CATEGORIES.includes(data.category as string)) {
            updated[i] = { ...updated[i], category: data.category as string };
          }
          if (data.tags && Array.isArray(data.tags) && updated[i].tags.length === 0) {
            updated[i] = { ...updated[i], tags: data.tags as string[] };
          }
          // Fill metadata fields
          if (data.metadata && typeof data.metadata === 'object') {
            const meta = data.metadata as Record<string, string>;
            for (const [k, v] of Object.entries(meta)) {
              if (v && !(updated[i] as Record<string, unknown>)[k]) {
                (updated[i] as Record<string, unknown>)[k] = v;
              }
            }
          }
        }
      } catch {
        // Skip failed rows silently
      }

      enhanced++;
      setEnhanceProgress({ current: enhanced, total: rowsToEnhance.length });
    }

    setRows(updated);
    setEnhancing(false);
    setResult({ success: true, message: `Enhanced ${enhanced} rows with AI.` });
  }

  async function handleImport() {
    setImporting(true);
    setResult(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const validRows = rows.filter(r => r.errors.length === 0).map(r => ({
        title: r.title,
        description: r.description || undefined,
        url: r.url || undefined,
        logo_url: r.logo_url || undefined,
        category: VALID_CATEGORIES.includes(r.category) ? r.category : 'scheme',
        provider: r.provider || undefined,
        eligibility: r.eligibility || undefined,
        deadline: r.deadline || undefined,
        tags: r.tags.length > 0 ? r.tags : undefined,
        metadata: buildMetadataForRow(r),
      }));

      await bulkCreateResources(validRows, user.id);
      setResult({ success: true, message: `Successfully imported ${validRows.length} resources.` });
      setRows([]);
      setFileName('');
    } catch (err) {
      setResult({ success: false, message: err instanceof Error ? err.message : 'Import failed' });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-foreground">Import Resources (CSV)</h1>
      <p className="mt-1 text-muted">
        Upload a CSV file to bulk-create resources. Expected columns: {EXPECTED_COLUMNS.slice(0, 10).join(', ')}, ...
      </p>

      {/* Result banner */}
      {result && (
        <div className={`mt-4 flex items-center gap-2 rounded-lg p-3 text-sm ${
          result.success
            ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
            : 'bg-red-50 text-danger dark:bg-red-950'
        }`}>
          {result.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {result.message}
        </div>
      )}

      {/* Drop zone */}
      <div
        className={`mt-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors ${
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-card-border hover:border-primary/40'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <Upload size={32} className="text-muted" />
        <p className="mt-3 text-sm text-muted">
          Drag & drop a CSV file here, or{' '}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-primary underline hover:text-primary-hover"
          >
            browse
          </button>
        </p>
        {fileName && <p className="mt-2 text-xs text-foreground font-medium">{fileName}</p>}
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.tsv,text/csv,text/tab-separated-values"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {/* Preview table */}
      {rows.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground font-medium">
              {rows.length} rows parsed &middot; {validCount} valid
              {hasErrors && <span className="text-danger"> &middot; {rows.length - validCount} with errors</span>}
            </p>
            <button
              type="button"
              onClick={() => { setRows([]); setFileName(''); }}
              className="flex items-center gap-1 text-sm text-muted hover:text-foreground"
            >
              <X size={14} /> Clear
            </button>
          </div>

          {/* Enhance with AI */}
          <div className="mt-3">
            <button
              type="button"
              disabled={enhancing || importing}
              onClick={handleEnhanceAll}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 px-4 py-2 text-sm font-semibold text-amber-700 dark:text-amber-300 transition-all hover:from-amber-500/20 hover:to-orange-500/20 hover:border-amber-500/50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {enhancing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enhancing {enhanceProgress.current}/{enhanceProgress.total}...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Enhance All with AI
                </>
              )}
            </button>
            {enhancing && (
              <div className="mt-2 h-2 w-full rounded-full bg-card-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                  style={{ width: `${enhanceProgress.total > 0 ? (enhanceProgress.current / enhanceProgress.total) * 100 : 0}%` }}
                />
              </div>
            )}
          </div>

          <div className="mt-3 overflow-x-auto rounded-lg border border-card-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-card-border/30">
                  <th className="px-3 py-2 text-left font-medium text-muted">#</th>
                  <th className="px-3 py-2 text-left font-medium text-muted">Name</th>
                  <th className="px-3 py-2 text-left font-medium text-muted">Description</th>
                  <th className="px-3 py-2 text-left font-medium text-muted">Website</th>
                  <th className="px-3 py-2 text-left font-medium text-muted">Provider</th>
                  <th className="px-3 py-2 text-left font-medium text-muted">Category</th>
                  <th className="px-3 py-2 text-left font-medium text-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-t border-card-border ${row.errors.length > 0 ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`}
                  >
                    <td className="px-3 py-2 text-muted">{i + 1}</td>
                    <td className="px-3 py-2 text-foreground max-w-[200px] truncate">{row.title || '—'}</td>
                    <td className="px-3 py-2 text-foreground max-w-[200px] truncate">{row.description ? row.description.slice(0, 60) + '...' : '—'}</td>
                    <td className="px-3 py-2 text-foreground max-w-[160px] truncate">{row.url || '—'}</td>
                    <td className="px-3 py-2 text-foreground max-w-[120px] truncate">{row.provider || '—'}</td>
                    <td className="px-3 py-2">
                      <span className="inline-block rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium capitalize text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                        {row.category}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {row.errors.length > 0 ? (
                        <span className="text-danger" title={row.errors.join(', ')}>
                          <AlertCircle size={14} />
                        </span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400">
                          <CheckCircle size={14} />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              disabled={importing || validCount === 0 || enhancing}
              onClick={handleImport}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {importing ? 'Importing...' : `Import ${validCount} Resources`}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard/resources')}
              className="rounded-lg border border-card-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card-border/30"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
