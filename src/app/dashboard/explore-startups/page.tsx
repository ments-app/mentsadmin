'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import {
  Compass, Plus, Upload, FileText, X, CheckCircle,
  Trash2, Rocket, Search, Globe, Mail, Phone, User, MapPin,
  ArrowUpDown, LayoutGrid, List, SlidersHorizontal,
} from 'lucide-react';
import {
  getExploreStartups,
  addExploreStartup,
  bulkAddExploreStartups,
  deleteExploreStartup,
  type ExploreStartupEntry,
  type BulkStartupResult,
} from '@/actions/facilitator-explore-startups';
import { format } from 'date-fns';

// ─── CSV helpers ──────────────────────────────────────────────────
const CSV_HEADERS = ['Startup Name','Email','Mobile','Website','Contact Person','Address','Sector'] as const;
const HEADER_KEY_MAP: Record<string, string> = {
  'startup name':'startup_name','email':'email','mobile':'mobile','website':'website',
  'contact person':'contact_person','address':'address','sector':'sector',
};

function parseCSV(text: string): { rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { rows: [] };
  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const rawHeaders = lines[0].split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const headerMap: Record<number, string> = {};
  rawHeaders.forEach((h, i) => { const key = HEADER_KEY_MAP[h.toLowerCase()]; if (key) headerMap[i] = key; });
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
    const row: Record<string, string> = {};
    for (const [colIdx, key] of Object.entries(headerMap)) { const val = cells[Number(colIdx)] ?? ''; if (val) row[key] = val; }
    if (row.startup_name) rows.push(row);
  }
  return { rows };
}

type SortField = 'startup_name' | 'sector' | 'created_at';
type SortDir = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

const ITEMS_PER_PAGE = 24;

export default function SuperadminExploreStartupsPage() {
  const [startups, setStartups] = useState<ExploreStartupEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ startup_name:'',email:'',mobile:'',website:'',contact_person:'',address:'',sector:'' });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [bulkRows, setBulkRows] = useState<Record<string, string>[]>([]);
  const [bulkFileName, setBulkFileName] = useState('');
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkStartupResult | null>(null);
  const [bulkError, setBulkError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { getExploreStartups().then(setStartups).finally(() => setLoading(false)); }, []);

  const sectors = useMemo(() => {
    const set = new Set<string>();
    startups.forEach((s) => { if (s.sector) set.add(s.sector); });
    return Array.from(set).sort();
  }, [startups]);

  const filteredAndSorted = useMemo(() => {
    let list = [...startups];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((s) => s.startup_name.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.contact_person?.toLowerCase().includes(q) || s.sector?.toLowerCase().includes(q) || s.address?.toLowerCase().includes(q));
    }
    if (sectorFilter !== 'all') list = list.filter((s) => s.sector === sectorFilter);
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'startup_name') cmp = a.startup_name.localeCompare(b.startup_name);
      else if (sortField === 'sector') cmp = (a.sector ?? '').localeCompare(b.sector ?? '');
      else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [startups, searchQuery, sectorFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE));
  const paginated = filteredAndSorted.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  useEffect(() => { setPage(1); }, [searchQuery, sectorFilter, sortField, sortDir]);

  function updateForm(field: string, value: string) { setForm((p) => ({ ...p, [field]: value })); setAddError(''); setAddSuccess(''); }

  async function handleAdd() {
    if (!form.startup_name.trim()) { setAddError('Startup Name is required'); return; }
    setAdding(true); setAddError(''); setAddSuccess('');
    try {
      await addExploreStartup(form);
      const refreshed = await getExploreStartups(); setStartups(refreshed);
      setForm({ startup_name:'',email:'',mobile:'',website:'',contact_person:'',address:'',sector:'' });
      setAddSuccess('Startup added successfully.');
    } catch (err) { setAddError(err instanceof Error ? err.message : 'Failed'); }
    finally { setAdding(false); }
  }

  function processFile(file: File) {
    setBulkResult(null); setBulkError('');
    const reader = new FileReader();
    reader.onload = (e) => { const { rows } = parseCSV(e.target?.result as string); setBulkRows(rows); setBulkFileName(file.name); };
    reader.readAsText(file);
  }
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) { const file = e.target.files?.[0]; if (file) processFile(file); e.target.value = ''; }
  function handleDragOver(e: React.DragEvent) { e.preventDefault(); setIsDragging(true); }
  function handleDragLeave() { setIsDragging(false); }
  function handleDrop(e: React.DragEvent) { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files[0]; if (file) processFile(file); }
  function clearBulk() { setBulkRows([]); setBulkFileName(''); setBulkResult(null); setBulkError(''); }

  async function handleBulkUpload() {
    if (bulkRows.length === 0) return;
    setBulkUploading(true); setBulkError(''); setBulkResult(null);
    try {
      const result = await bulkAddExploreStartups(bulkRows.map((r) => ({ startup_name: r.startup_name ?? '', email: r.email, mobile: r.mobile, website: r.website, contact_person: r.contact_person, address: r.address, sector: r.sector })));
      setBulkResult(result); const refreshed = await getExploreStartups(); setStartups(refreshed); setBulkRows([]); setBulkFileName('');
    } catch (err) { setBulkError(err instanceof Error ? err.message : 'Bulk upload failed'); }
    finally { setBulkUploading(false); }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try { await deleteExploreStartup(id); setStartups((p) => p.filter((s) => s.id !== id)); } catch (err) { console.error(err); }
    finally { setDeletingId(null); }
  }

  function downloadSampleCSV() {
    const csv = `${CSV_HEADERS.join(',')}\nAcme Corp,acme@example.com,9876543210,https://acme.com,John Doe,"123 Main St, City",Technology`;
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'explore_startups_sample.csv'; a.click(); URL.revokeObjectURL(url);
  }

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Explore Startup</h1>
          <p className="mt-1 text-sm text-muted">Add and manage startups. Facilitators can view this data in read-only mode.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Rocket size={14} /> {loading ? '—' : startups.length}
          </span>
          <button type="button" onClick={() => { setShowAddForm(!showAddForm); setAddError(''); setAddSuccess(''); }}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover">
            <Plus size={15} /> {showAddForm ? 'Close' : 'Add New'}
          </button>
        </div>
      </div>

      {/* ── Add Single Startup ────────────────────────────────────── */}
      {showAddForm && (
        <div className="mt-4 rounded-xl border border-card-border bg-card-bg p-5 space-y-4 animate-fade-in">
          <h2 className="text-base font-semibold text-foreground">Add Startup</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { key:'startup_name', label:'Startup Name *', placeholder:'Startup name', type:'text' },
              { key:'email', label:'Email', placeholder:'startup@example.com', type:'email' },
              { key:'mobile', label:'Mobile', placeholder:'Phone number', type:'text' },
              { key:'website', label:'Website', placeholder:'https://example.com', type:'text' },
              { key:'contact_person', label:'Contact Person', placeholder:'Contact name', type:'text' },
              { key:'sector', label:'Sector', placeholder:'e.g. Technology', type:'text' },
            ].map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-xs font-medium text-muted">{f.label}</label>
                <input value={(form as any)[f.key]} onChange={(e) => updateForm(f.key, e.target.value)} placeholder={f.placeholder} type={f.type}
                  className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
            ))}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="mb-1 block text-xs font-medium text-muted">Address</label>
              <input value={form.address} onChange={(e) => updateForm('address', e.target.value)} placeholder="Full address"
                className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          {addError && <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger dark:bg-red-950"><X size={14} /> {addError}</div>}
          {addSuccess && <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300"><CheckCircle size={14} /> {addSuccess}</div>}
          <button type="button" onClick={handleAdd} disabled={adding || !form.startup_name.trim()}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50">
            <Plus size={15} /> {adding ? 'Adding...' : 'Add Startup'}
          </button>
        </div>
      )}

      {/* ── Bulk Upload ──────────────────────────────────────────── */}
      <div className="mt-4 rounded-xl border border-card-border bg-card-bg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Bulk Upload</h2>
          <div className="flex items-center gap-2">
            <button type="button" onClick={downloadSampleCSV} className="text-xs text-primary hover:underline">Download Sample CSV</button>
            {bulkRows.length > 0 && <button type="button" onClick={clearBulk} className="text-xs text-muted hover:text-foreground">Clear</button>}
          </div>
        </div>
        {bulkRows.length === 0 && !bulkResult && (
          <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-card-border hover:border-primary/50 hover:bg-surface-hover'}`}>
            <Upload size={24} className={isDragging ? 'text-primary' : 'text-muted'} />
            <p className="text-sm font-medium text-foreground">Drop your CSV here, or <span className="text-primary">browse</span></p>
            <p className="text-xs text-muted">.csv file with startup details</p>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFileChange} className="hidden" />
        {bulkRows.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-card-border bg-background px-3 py-2">
              <FileText size={15} className="shrink-0 text-muted" />
              <span className="flex-1 truncate text-sm text-foreground">{bulkFileName}</span>
              <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300"><CheckCircle size={11} /> {bulkRows.length} found</span>
              <button type="button" onClick={clearBulk} className="text-muted hover:text-foreground"><X size={14} /></button>
            </div>
            <div className="max-h-52 overflow-auto rounded-lg border border-card-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card-bg"><tr>{CSV_HEADERS.map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-medium text-muted whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-card-border">
                  {bulkRows.slice(0, 10).map((row, i) => <tr key={i} className="hover:bg-surface-hover">
                    <td className="px-3 py-1.5 text-foreground">{row.startup_name ?? ''}</td><td className="px-3 py-1.5 text-muted">{row.email ?? ''}</td>
                    <td className="px-3 py-1.5 text-muted">{row.mobile ?? ''}</td><td className="px-3 py-1.5 text-muted">{row.website ?? ''}</td>
                    <td className="px-3 py-1.5 text-muted">{row.contact_person ?? ''}</td><td className="px-3 py-1.5 text-muted">{row.address ?? ''}</td>
                    <td className="px-3 py-1.5 text-muted">{row.sector ?? ''}</td>
                  </tr>)}
                </tbody>
              </table>
              {bulkRows.length > 10 && <div className="px-3 py-1.5 text-xs text-muted border-t border-card-border">+ {bulkRows.length - 10} more...</div>}
            </div>
            {bulkError && <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger dark:bg-red-950"><X size={14} /> {bulkError}</div>}
            <button type="button" onClick={handleBulkUpload} disabled={bulkUploading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">
              <Upload size={15} /> {bulkUploading ? 'Uploading...' : `Add ${bulkRows.length} startup${bulkRows.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        )}
        {bulkResult && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">Upload complete</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-green-700 dark:text-green-300">
              <span><span className="font-semibold">{bulkResult.added}</span> added</span>
              {bulkResult.skipped > 0 && <span><span className="font-semibold">{bulkResult.skipped}</span> duplicates</span>}
              {bulkResult.invalid > 0 && <span><span className="font-semibold">{bulkResult.invalid}</span> invalid</span>}
            </div>
          </div>
        )}
      </div>

      {/* ── Filters & Search ──────────────────────────────────────── */}
      <div className="mt-6 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name, email, contact, sector, address..."
              className="w-full rounded-xl border border-card-border bg-card-bg py-2.5 pl-10 pr-4 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            {searchQuery && <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"><X size={14} /></button>}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${showFilters ? 'border-primary bg-primary/10 text-primary' : 'border-card-border bg-card-bg text-muted hover:text-foreground'}`}>
              <SlidersHorizontal size={14} /> Filters
              {sectorFilter !== 'all' && <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">1</span>}
            </button>
            <div className="relative">
              <button type="button" onClick={() => toggleSort(sortField)}
                className="flex items-center gap-1.5 rounded-xl border border-card-border bg-card-bg px-3 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">
                <ArrowUpDown size={14} /> {sortField === 'startup_name' ? 'Name' : sortField === 'sector' ? 'Sector' : 'Date'}
                <span className="text-[10px]">{sortDir === 'asc' ? '↑' : '↓'}</span>
              </button>
            </div>
            <div className="flex rounded-xl border border-card-border bg-card-bg overflow-hidden">
              <button type="button" onClick={() => setViewMode('grid')} className={`flex items-center justify-center p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted hover:text-foreground'}`}><LayoutGrid size={16} /></button>
              <button type="button" onClick={() => setViewMode('list')} className={`flex items-center justify-center p-2 transition-colors ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-muted hover:text-foreground'}`}><List size={16} /></button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-card-border bg-card-bg p-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted whitespace-nowrap">Sector:</label>
              <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)}
                className="rounded-lg border border-card-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary">
                <option value="all">All Sectors</option>
                {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted whitespace-nowrap">Sort by:</label>
              <select value={sortField} onChange={(e) => setSortField(e.target.value as SortField)}
                className="rounded-lg border border-card-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary">
                <option value="created_at">Date Added</option>
                <option value="startup_name">Name</option>
                <option value="sector">Sector</option>
              </select>
              <button type="button" onClick={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')}
                className="rounded-lg border border-card-border bg-background px-2 py-1.5 text-sm text-muted hover:text-foreground">
                {sortDir === 'asc' ? '↑ Asc' : '↓ Desc'}
              </button>
            </div>
            {(sectorFilter !== 'all' || searchQuery) && (
              <button type="button" onClick={() => { setSectorFilter('all'); setSearchQuery(''); }} className="ml-auto text-xs text-primary hover:underline">Clear all filters</button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted">
          <span>
            Showing {filteredAndSorted.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filteredAndSorted.length)} of {filteredAndSorted.length} startups
            {sectorFilter !== 'all' && <span className="ml-1 text-primary">in {sectorFilter}</span>}
          </span>
          {sectors.length > 0 && !showFilters && (
            <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto">
              <button type="button" onClick={() => setSectorFilter('all')} className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${sectorFilter === 'all' ? 'bg-primary text-white' : 'bg-card-bg border border-card-border text-muted hover:text-foreground'}`}>All</button>
              {sectors.slice(0, 8).map((s) => (
                <button key={s} type="button" onClick={() => setSectorFilter(sectorFilter === s ? 'all' : s)}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${sectorFilter === s ? 'bg-primary text-white' : 'bg-card-bg border border-card-border text-muted hover:text-foreground'}`}>{s}</button>
              ))}
              {sectors.length > 8 && <span className="text-[10px] text-muted">+{sectors.length - 8} more</span>}
            </div>
          )}
        </div>
      </div>

      {/* ── Cards / List ──────────────────────────────────────────── */}
      <div className="mt-4">
        {loading ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}>
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className={`animate-pulse rounded-xl border border-card-border bg-card-bg ${viewMode === 'grid' ? 'h-48' : 'h-20'}`} />)}
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card-bg border border-card-border"><Compass size={28} className="text-muted" /></div>
            <p className="text-sm font-medium text-foreground">{searchQuery || sectorFilter !== 'all' ? 'No startups match your filters' : 'No startups added yet'}</p>
            <p className="text-xs text-muted max-w-sm">{searchQuery || sectorFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Add startups above to get started.'}</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((s) => (
              <div key={s.id} className="group relative rounded-xl border border-card-border bg-card-bg p-4 transition-all duration-200 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5">
                <button type="button" onClick={() => handleDelete(s.id)} disabled={deletingId === s.id}
                  className="absolute right-3 top-3 rounded-lg p-1.5 text-muted opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-danger disabled:opacity-40 dark:hover:bg-red-950">
                  <Trash2 size={14} />
                </button>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">{s.startup_name.charAt(0).toUpperCase()}</div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-foreground truncate">{s.startup_name}</h3>
                    {s.sector && <span className="mt-0.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{s.sector}</span>}
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  {s.contact_person && <div className="flex items-center gap-2 text-xs text-muted"><User size={12} className="shrink-0" /><span className="truncate">{s.contact_person}</span></div>}
                  {s.email && <div className="flex items-center gap-2 text-xs text-muted"><Mail size={12} className="shrink-0" /><span className="truncate">{s.email}</span></div>}
                  {s.mobile && <div className="flex items-center gap-2 text-xs text-muted"><Phone size={12} className="shrink-0" /><span>{s.mobile}</span></div>}
                  {s.website && <div className="flex items-center gap-2 text-xs text-muted"><Globe size={12} className="shrink-0" /><span className="truncate text-primary">{s.website.replace(/^https?:\/\//, '')}</span></div>}
                  {s.address && <div className="flex items-center gap-2 text-xs text-muted"><MapPin size={12} className="shrink-0" /><span className="truncate">{s.address}</span></div>}
                </div>
                <div className="mt-3 pt-2.5 border-t border-card-border/60">
                  <span className="text-[10px] text-muted">{format(new Date(s.created_at), 'dd MMM yyyy')}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-card-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-card-bg border-b border-card-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted cursor-pointer hover:text-foreground" onClick={() => toggleSort('startup_name')}>
                      <span className="flex items-center gap-1">Startup Name {sortField === 'startup_name' && <span className="text-primary">{sortDir === 'asc' ? '↑' : '↓'}</span>}</span>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted">Mobile</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted">Contact Person</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted cursor-pointer hover:text-foreground" onClick={() => toggleSort('sector')}>
                      <span className="flex items-center gap-1">Sector {sortField === 'sector' && <span className="text-primary">{sortDir === 'asc' ? '↑' : '↓'}</span>}</span>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted">Address</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted cursor-pointer hover:text-foreground" onClick={() => toggleSort('created_at')}>
                      <span className="flex items-center gap-1">Added {sortField === 'created_at' && <span className="text-primary">{sortDir === 'asc' ? '↑' : '↓'}</span>}</span>
                    </th>
                    <th className="w-10 px-3 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {paginated.map((s) => (
                    <tr key={s.id} className="hover:bg-card-bg/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">{s.startup_name.charAt(0).toUpperCase()}</div>
                          <span className="font-medium text-foreground">{s.startup_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{s.email ?? '—'}</td>
                      <td className="px-4 py-3 text-muted">{s.mobile ?? '—'}</td>
                      <td className="px-4 py-3 text-muted">{s.contact_person ?? '—'}</td>
                      <td className="px-4 py-3">{s.sector ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{s.sector}</span> : <span className="text-muted">—</span>}</td>
                      <td className="px-4 py-3 text-muted max-w-[200px] truncate">{s.address ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">{format(new Date(s.created_at), 'dd MMM yyyy')}</td>
                      <td className="px-3 py-3">
                        <button type="button" onClick={() => handleDelete(s.id)} disabled={deletingId === s.id}
                          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-red-50 hover:text-danger disabled:opacity-40 dark:hover:bg-red-950"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Pagination ────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="rounded-lg border border-card-border bg-card-bg px-3 py-1.5 text-sm text-muted hover:text-foreground disabled:opacity-40 transition-colors">Previous</button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) pageNum = i + 1;
              else if (page <= 4) pageNum = i + 1;
              else if (page >= totalPages - 3) pageNum = totalPages - 6 + i;
              else pageNum = page - 3 + i;
              return (
                <button key={pageNum} type="button" onClick={() => setPage(pageNum)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${page === pageNum ? 'bg-primary text-white' : 'text-muted hover:bg-card-bg hover:text-foreground'}`}>{pageNum}</button>
              );
            })}
          </div>
          <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="rounded-lg border border-card-border bg-card-bg px-3 py-1.5 text-sm text-muted hover:text-foreground disabled:opacity-40 transition-colors">Next</button>
        </div>
      )}
    </div>
  );
}
