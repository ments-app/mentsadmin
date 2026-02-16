'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, AlertCircle, CheckCircle, X } from 'lucide-react';
import { bulkCreateResources } from '@/actions/resources';
import { supabase } from '@/lib/supabase';

const VALID_CATEGORIES = ['govt_scheme', 'accelerator_incubator', 'company_offer', 'tool', 'bank_offer', 'scheme'];

// CSV column names mapped to their purpose
const EXPECTED_COLUMNS = [
  'Name', 'Location', 'Website', 'Summary Information', 'Recent Investments',
  'Sectors', 'Average Startup Age at Investment', 'Average No of Founders',
  'Average age of Founders', 'Companies Invested',
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
  location: string;
  recent_investments: string;
  sectors: string;
  avg_startup_age: string;
  avg_num_founders: string;
  avg_founder_age: string;
  companies_invested: string;
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
    errors,
  };
}

export default function ImportResourcesPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [fileName, setFileName] = useState('');

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
        metadata: {
          location: r.location || undefined,
          recent_investments: r.recent_investments || undefined,
          sectors: r.sectors || undefined,
          avg_startup_age: r.avg_startup_age || undefined,
          avg_num_founders: r.avg_num_founders || undefined,
          avg_founder_age: r.avg_founder_age || undefined,
          companies_invested: r.companies_invested || undefined,
        },
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
        Upload a CSV file to bulk-create resources. Expected columns: {EXPECTED_COLUMNS.join(', ')}
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

          <div className="mt-3 overflow-x-auto rounded-lg border border-card-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-card-border/30">
                  <th className="px-3 py-2 text-left font-medium text-muted">#</th>
                  <th className="px-3 py-2 text-left font-medium text-muted">Name</th>
                  <th className="px-3 py-2 text-left font-medium text-muted">Location</th>
                  <th className="px-3 py-2 text-left font-medium text-muted">Website</th>
                  <th className="px-3 py-2 text-left font-medium text-muted">Sectors</th>
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
                    <td className="px-3 py-2 text-foreground max-w-[120px] truncate">{row.location || '—'}</td>
                    <td className="px-3 py-2 text-foreground max-w-[160px] truncate">{row.url || '—'}</td>
                    <td className="px-3 py-2 text-foreground max-w-[150px] truncate">{row.sectors || '—'}</td>
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
              disabled={importing || validCount === 0}
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
