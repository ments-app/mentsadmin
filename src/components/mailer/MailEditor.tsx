'use client';

import { useRef, useImperativeHandle, forwardRef, useCallback, useState } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, List, ListOrdered, Link2, Minus,
  Heading1, Heading2, Heading3, AlignLeft, AlignCenter, AlignRight,
  Type, Palette, Image, Quote, Code, Undo2, Redo2, RemoveFormatting,
  Upload, X, Loader2, FolderOpen, Link as LinkIcon, Check, PaintBucket,
} from 'lucide-react';
import { uploadMailerImage, listMailerImages, type StorageImage } from '@/actions/upload';

export interface MailEditorRef {
  getHTML: () => string;
  setHTML: (html: string) => void;
}

// ─── Color Presets ────────────────────────────────────────────

const TEXT_COLORS = [
  '#000000', '#333333', '#555555', '#888888',
  '#dc2626', '#ea580c', '#d97706', '#65a30d',
  '#059669', '#0891b2', '#2563eb', '#7c3aed',
  '#c026d3', '#e11d48', '#ffffff',
];

const BG_COLORS = [
  'transparent', '#fef2f2', '#fff7ed', '#fefce8',
  '#f0fdf4', '#ecfdf5', '#f0f9ff', '#eff6ff',
  '#f5f3ff', '#fdf4ff', '#fce7f3', '#f1f5f9',
  '#fef9c3', '#d1fae5', '#dbeafe',
];

// Block / section background colors (solid + gradients)
const BLOCK_BG_COLORS = [
  { label: 'None', value: 'transparent', preview: 'transparent' },
  { label: 'White', value: '#ffffff', preview: '#ffffff' },
  { label: 'Light Gray', value: '#f8fafc', preview: '#f8fafc' },
  { label: 'Gray', value: '#f1f5f9', preview: '#f1f5f9' },
  { label: 'Red Light', value: '#fef2f2', preview: '#fef2f2' },
  { label: 'Orange Light', value: '#fff7ed', preview: '#fff7ed' },
  { label: 'Yellow Light', value: '#fefce8', preview: '#fefce8' },
  { label: 'Green Light', value: '#f0fdf4', preview: '#f0fdf4' },
  { label: 'Teal Light', value: '#ecfdf5', preview: '#ecfdf5' },
  { label: 'Blue Light', value: '#eff6ff', preview: '#eff6ff' },
  { label: 'Indigo Light', value: '#eef2ff', preview: '#eef2ff' },
  { label: 'Purple Light', value: '#f5f3ff', preview: '#f5f3ff' },
  { label: 'Pink Light', value: '#fdf4ff', preview: '#fdf4ff' },
  { label: 'Red', value: '#dc2626', preview: '#dc2626' },
  { label: 'Orange', value: '#ea580c', preview: '#ea580c' },
  { label: 'Green', value: '#059669', preview: '#059669' },
  { label: 'Blue', value: '#2563eb', preview: '#2563eb' },
  { label: 'Indigo', value: '#4f46e5', preview: '#4f46e5' },
  { label: 'Purple', value: '#7c3aed', preview: '#7c3aed' },
  { label: 'Dark', value: '#0f172a', preview: '#0f172a' },
  { label: 'Gradient Purple', value: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)', preview: 'linear-gradient(135deg,#667eea,#764ba2)' },
  { label: 'Gradient Blue', value: 'linear-gradient(135deg,#1d4ed8 0%,#7c3aed 100%)', preview: 'linear-gradient(135deg,#1d4ed8,#7c3aed)' },
  { label: 'Gradient Teal', value: 'linear-gradient(135deg,#059669 0%,#0d9488 100%)', preview: 'linear-gradient(135deg,#059669,#0d9488)' },
  { label: 'Gradient Red', value: 'linear-gradient(135deg,#dc2626 0%,#f97316 100%)', preview: 'linear-gradient(135deg,#dc2626,#f97316)' },
  { label: 'Gradient Pink', value: 'linear-gradient(135deg,#7c3aed 0%,#db2777 100%)', preview: 'linear-gradient(135deg,#7c3aed,#db2777)' },
  { label: 'Gradient Warm', value: 'linear-gradient(135deg,#f59e0b 0%,#f97316 100%)', preview: 'linear-gradient(135deg,#f59e0b,#f97316)' },
  { label: 'Gradient Ocean', value: 'linear-gradient(135deg,#06b6d4 0%,#3b82f6 100%)', preview: 'linear-gradient(135deg,#06b6d4,#3b82f6)' },
  { label: 'Gradient Rainbow', value: 'linear-gradient(135deg,#0ea5e9 0%,#6366f1 50%,#a855f7 100%)', preview: 'linear-gradient(135deg,#0ea5e9,#6366f1,#a855f7)' },
];

const FONT_SIZES = [
  { label: 'Small', value: '1' },
  { label: 'Normal', value: '3' },
  { label: 'Medium', value: '4' },
  { label: 'Large', value: '5' },
  { label: 'X-Large', value: '6' },
  { label: 'Huge', value: '7' },
];

// ─── Toolbar Button ──────────────────────────────────────────

function ToolbarBtn({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted hover:bg-card-border/30 hover:text-foreground'
      }`}
    >
      <Icon size={15} />
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-card-border/60" />;
}

// ─── Color Picker Dropdown ───────────────────────────────────

function ColorPicker({
  colors,
  label,
  onSelect,
  icon: Icon,
}: {
  colors: string[];
  label: string;
  onSelect: (color: string) => void;
  icon: React.ComponentType<{ size?: number }>;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  function handleOpen() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      let left = rect.left;
      if (left + 180 > window.innerWidth) left = window.innerWidth - 192;
      setPos({ top: rect.bottom + 6, left });
    }
    setOpen(!open);
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        title={label}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-card-border/30 hover:text-foreground transition-colors"
      >
        <Icon size={15} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[70] rounded-xl border border-card-border bg-background p-2 shadow-2xl"
            style={{ top: pos.top, left: pos.left }}
          >
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1.5 px-1">{label}</p>
            <div className="grid grid-cols-5 gap-1">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { onSelect(c); setOpen(false); }}
                  className="h-6 w-6 rounded-md border border-card-border/60 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c === 'transparent' ? undefined : c }}
                  title={c}
                >
                  {c === 'transparent' && (
                    <span className="text-[9px] text-muted leading-none">&#x2205;</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Font Size Dropdown ──────────────────────────────────────

function FontSizePicker({ onSelect }: { onSelect: (size: string) => void }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  function handleOpen() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, left: rect.left });
    }
    setOpen(!open);
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        title="Font Size"
        className="flex h-8 items-center gap-1 rounded-lg px-2 text-muted hover:bg-card-border/30 hover:text-foreground transition-colors text-xs font-medium"
      >
        <Type size={14} />
        <span className="hidden sm:inline">Size</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[70] rounded-xl border border-card-border bg-background py-1 shadow-2xl min-w-[120px]"
            style={{ top: pos.top, left: pos.left }}
          >
            {FONT_SIZES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => { onSelect(s.value); setOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-card-border/20 transition-colors text-foreground"
              >
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Font Family Picker ──────────────────────────────────────

type FontEntry = { label: string; value: string; category: string; google?: boolean };

const FONT_FAMILIES: FontEntry[] = [
  // ── Web-safe (work in ALL email clients) ──
  { label: 'Default', value: '', category: 'Web Safe' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif', category: 'Web Safe' },
  { label: 'Arial Black', value: '"Arial Black", Gadget, sans-serif', category: 'Web Safe' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif', category: 'Web Safe' },
  { label: 'Tahoma', value: 'Tahoma, Geneva, sans-serif', category: 'Web Safe' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif', category: 'Web Safe' },
  { label: 'Helvetica', value: 'Helvetica, Arial, sans-serif', category: 'Web Safe' },
  { label: 'Georgia', value: 'Georgia, serif', category: 'Web Safe' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif', category: 'Web Safe' },
  { label: 'Palatino', value: '"Palatino Linotype", "Book Antiqua", Palatino, serif', category: 'Web Safe' },
  { label: 'Garamond', value: 'Garamond, "Times New Roman", serif', category: 'Web Safe' },
  { label: 'Bookman', value: '"Bookman Old Style", serif', category: 'Web Safe' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace', category: 'Web Safe' },
  { label: 'Lucida Console', value: '"Lucida Console", Monaco, monospace', category: 'Web Safe' },
  { label: 'Lucida Sans', value: '"Lucida Sans Unicode", "Lucida Grande", sans-serif', category: 'Web Safe' },
  { label: 'Comic Sans', value: '"Comic Sans MS", cursive', category: 'Web Safe' },
  { label: 'Impact', value: 'Impact, Charcoal, sans-serif', category: 'Web Safe' },
  { label: 'Century Gothic', value: '"Century Gothic", CenturyGothic, sans-serif', category: 'Web Safe' },
  { label: 'Segoe UI', value: '"Segoe UI", Tahoma, Geneva, sans-serif', category: 'Web Safe' },
  { label: 'Calibri', value: 'Calibri, "Segoe UI", Arial, sans-serif', category: 'Web Safe' },
  { label: 'Cambria', value: 'Cambria, Georgia, serif', category: 'Web Safe' },
  { label: 'Candara', value: 'Candara, Calibri, sans-serif', category: 'Web Safe' },
  { label: 'Optima', value: 'Optima, "Segoe UI", sans-serif', category: 'Web Safe' },
  { label: 'Futura', value: 'Futura, "Trebuchet MS", sans-serif', category: 'Web Safe' },
  { label: 'Gill Sans', value: '"Gill Sans", "Gill Sans MT", Calibri, sans-serif', category: 'Web Safe' },

  // ── Google Fonts (work in Gmail, Apple Mail, Yahoo; fallback in Outlook) ──
  { label: 'Roboto', value: 'Roboto, Arial, sans-serif', category: 'Google Fonts', google: true },
  { label: 'Open Sans', value: '"Open Sans", Arial, sans-serif', category: 'Google Fonts', google: true },
  { label: 'Lato', value: 'Lato, Arial, sans-serif', category: 'Google Fonts', google: true },
  { label: 'Montserrat', value: 'Montserrat, Arial, sans-serif', category: 'Google Fonts', google: true },
  { label: 'Poppins', value: 'Poppins, Arial, sans-serif', category: 'Google Fonts', google: true },
  { label: 'Inter', value: 'Inter, Arial, sans-serif', category: 'Google Fonts', google: true },
  { label: 'Nunito', value: 'Nunito, Arial, sans-serif', category: 'Google Fonts', google: true },
  { label: 'Nunito Sans', value: '"Nunito Sans", Arial, sans-serif', category: 'Google Fonts', google: true },
  { label: 'Raleway', value: 'Raleway, Arial, sans-serif', category: 'Google Fonts', google: true },
  { label: 'Ubuntu', value: 'Ubuntu, Arial, sans-serif', category: 'Google Fonts', google: true },
  { label: 'Rubik', value: 'Rubik, Arial, sans-serif', category: 'Google Fonts', google: true },
  { label: 'Work Sans', value: '"Work Sans", Arial, sans-serif', category: 'Google Fonts', google: true },
  { label: 'Quicksand', value: 'Quicksand, Arial, sans-serif', category: 'Google Fonts', google: true },
  { label: 'Josefin Sans', value: '"Josefin Sans", Arial, sans-serif', category: 'Google Fonts', google: true },
  { label: 'DM Sans', value: '"DM Sans", Arial, sans-serif', category: 'Google Fonts', google: true },
  { label: 'Source Sans 3', value: '"Source Sans 3", Arial, sans-serif', category: 'Google Fonts', google: true },
  { label: 'Outfit', value: 'Outfit, Arial, sans-serif', category: 'Google Fonts', google: true },
  { label: 'Manrope', value: 'Manrope, Arial, sans-serif', category: 'Google Fonts', google: true },
  { label: 'Space Grotesk', value: '"Space Grotesk", Arial, sans-serif', category: 'Google Fonts', google: true },
  { label: 'Plus Jakarta Sans', value: '"Plus Jakarta Sans", Arial, sans-serif', category: 'Google Fonts', google: true },
  { label: 'Playfair Display', value: '"Playfair Display", Georgia, serif', category: 'Google Fonts', google: true },
  { label: 'Merriweather', value: 'Merriweather, Georgia, serif', category: 'Google Fonts', google: true },
  { label: 'Lora', value: 'Lora, Georgia, serif', category: 'Google Fonts', google: true },
  { label: 'PT Serif', value: '"PT Serif", Georgia, serif', category: 'Google Fonts', google: true },
  { label: 'Libre Baskerville', value: '"Libre Baskerville", Georgia, serif', category: 'Google Fonts', google: true },
  { label: 'Crimson Text', value: '"Crimson Text", Georgia, serif', category: 'Google Fonts', google: true },
  { label: 'Fira Code', value: '"Fira Code", "Courier New", monospace', category: 'Google Fonts', google: true },
  { label: 'JetBrains Mono', value: '"JetBrains Mono", "Courier New", monospace', category: 'Google Fonts', google: true },
  { label: 'Source Code Pro', value: '"Source Code Pro", "Courier New", monospace', category: 'Google Fonts', google: true },
  { label: 'Pacifico', value: 'Pacifico, cursive', category: 'Google Fonts', google: true },
  { label: 'Dancing Script', value: '"Dancing Script", cursive', category: 'Google Fonts', google: true },
  { label: 'Caveat', value: 'Caveat, cursive', category: 'Google Fonts', google: true },
  { label: 'Satisfy', value: 'Satisfy, cursive', category: 'Google Fonts', google: true },
  { label: 'Permanent Marker', value: '"Permanent Marker", cursive', category: 'Google Fonts', google: true },
  { label: 'Abril Fatface', value: '"Abril Fatface", Georgia, serif', category: 'Google Fonts', google: true },
  { label: 'Bebas Neue', value: '"Bebas Neue", Impact, sans-serif', category: 'Google Fonts', google: true },
  { label: 'Righteous', value: 'Righteous, Impact, sans-serif', category: 'Google Fonts', google: true },
  { label: 'Comfortaa', value: 'Comfortaa, Arial, sans-serif', category: 'Google Fonts', google: true },
  { label: 'Lexend', value: 'Lexend, Arial, sans-serif', category: 'Google Fonts', google: true },
];

const FONT_CATEGORIES = [...new Set(FONT_FAMILIES.map((f) => f.category))];

// Build Google Fonts import URL for email head
function getGoogleFontsImport(html: string): string {
  const usedGoogleFonts: string[] = [];
  for (const f of FONT_FAMILIES) {
    if (f.google && html.includes(f.label)) {
      usedGoogleFonts.push(f.label.replace(/\s+/g, '+'));
    }
  }
  if (usedGoogleFonts.length === 0) return '';
  return `<link href="https://fonts.googleapis.com/css2?${usedGoogleFonts.map((f) => `family=${f}:wght@400;600;700`).join('&')}&display=swap" rel="stylesheet" />`;
}

function FontFamilyPicker({ onSelect }: { onSelect: (font: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  function handleOpen() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      let left = rect.left;
      if (left + 280 > window.innerWidth) left = window.innerWidth - 292;
      let top = rect.bottom + 6;
      if (top + 420 > window.innerHeight) top = rect.top - 420;
      setPos({ top, left });
    }
    setOpen(!open);
    setSearch('');
  }

  const filtered = FONT_FAMILIES.filter((f) => {
    if (cat !== 'all' && f.category !== cat) return false;
    if (search && !f.label.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Load Google Fonts CSS for previewing in dropdown
  const googleFontsForPreview = FONT_FAMILIES
    .filter((f) => f.google)
    .map((f) => f.label.replace(/\s+/g, '+'))
    .join('&family=');

  return (
    <div className="relative">
      {/* Preload Google Fonts for dropdown preview */}
      {open && (
        <link
          href={`https://fonts.googleapis.com/css2?family=${googleFontsForPreview}&display=swap`}
          rel="stylesheet"
        />
      )}
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        title="Font Family"
        className="flex h-8 items-center gap-1 rounded-lg px-2 text-muted hover:bg-card-border/30 hover:text-foreground transition-colors text-xs font-medium"
      >
        <span className="text-[13px] font-serif leading-none">A</span>
        <span className="hidden sm:inline">Font</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[70] rounded-xl border border-card-border bg-background shadow-2xl w-[270px] flex flex-col"
            style={{ top: pos.top, left: pos.left, maxHeight: 420 }}
          >
            {/* Search */}
            <div className="px-2.5 pt-2.5 pb-1.5">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search fonts..."
                className="w-full rounded-lg border border-card-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                autoFocus
              />
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1 px-2.5 pb-1.5">
              <button
                type="button"
                onClick={() => setCat('all')}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${cat === 'all' ? 'bg-primary text-white' : 'text-muted hover:text-foreground bg-card-border/20'}`}
              >
                All
              </button>
              {FONT_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCat(c)}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors whitespace-nowrap ${cat === c ? 'bg-primary text-white' : 'text-muted hover:text-foreground bg-card-border/20'}`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Font list */}
            <div className="flex-1 overflow-y-auto border-t border-card-border">
              {filtered.length === 0 ? (
                <p className="px-3 py-4 text-xs text-muted text-center">No fonts found</p>
              ) : (
                filtered.map((f) => (
                  <button
                    key={f.label}
                    type="button"
                    onClick={() => { onSelect(f.value); setOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-card-border/20 transition-colors text-foreground flex items-center justify-between gap-2"
                    style={{ fontFamily: f.value || undefined }}
                  >
                    <span className="truncate">{f.label}</span>
                    {f.google && <span className="shrink-0 text-[9px] text-muted bg-card-border/30 rounded px-1 py-0.5">G</span>}
                  </button>
                ))
              )}
            </div>

            <div className="px-2.5 py-1.5 border-t border-card-border">
              <p className="text-[9px] text-muted"><strong>Web Safe</strong> = works in all email clients. <strong className="text-muted">G</strong> = Google Font (Gmail, Apple Mail, Yahoo).</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Block Background Picker ─────────────────────────────────

function BlockBgPicker({ onSelect }: { onSelect: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  function handleOpen() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const dropdownWidth = 290;
      let left = rect.left;
      if (left + dropdownWidth > window.innerWidth) {
        left = window.innerWidth - dropdownWidth - 12;
      }
      setPos({ top: rect.bottom + 6, left });
    }
    setOpen(!open);
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        title="Section Background"
        className="flex h-8 items-center gap-1 rounded-lg px-2 text-muted hover:bg-card-border/30 hover:text-foreground transition-colors text-xs font-medium"
      >
        <PaintBucket size={14} />
        <span className="hidden sm:inline">BG</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[70] rounded-xl border border-card-border bg-background p-3 shadow-2xl w-[280px] max-h-[80vh] overflow-y-auto"
            style={{ top: pos.top, left: pos.left }}
          >
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2 px-1">Section Background</p>

            <p className="text-[10px] text-muted mb-1 px-1">Solid Colors</p>
            <div className="grid grid-cols-7 gap-1.5 mb-3">
              {BLOCK_BG_COLORS.filter((c) => !c.value.includes('gradient')).map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => { onSelect(c.value); setOpen(false); }}
                  title={c.label}
                  className="h-7 w-7 rounded-lg border border-card-border/60 hover:scale-110 transition-transform hover:ring-2 hover:ring-primary/30"
                  style={{ backgroundColor: c.value === 'transparent' ? '#fff' : c.value }}
                >
                  {c.value === 'transparent' && (
                    <span className="text-[9px] text-muted flex items-center justify-center">✕</span>
                  )}
                </button>
              ))}
            </div>

            <p className="text-[10px] text-muted mb-1 px-1">Gradients</p>
            <div className="grid grid-cols-4 gap-1.5">
              {BLOCK_BG_COLORS.filter((c) => c.value.includes('gradient')).map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => { onSelect(c.value); setOpen(false); }}
                  title={c.label}
                  className="h-8 rounded-lg border border-card-border/60 hover:scale-105 transition-transform hover:ring-2 hover:ring-primary/30"
                  style={{ background: c.preview }}
                />
              ))}
            </div>

            <p className="text-[9px] text-muted mt-2 px-1">Click in a section first, then pick a color.</p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Image Picker Modal ─────────────────────────────────────

type ImageTab = 'upload' | 'storage' | 'url';

function ImagePickerModal({
  onInsert,
  onClose,
}: {
  onInsert: (url: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<ImageTab>('upload');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [storageImages, setStorageImages] = useState<StorageImage[]>([]);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(file: File) {
    setUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const url = await uploadMailerImage(formData);
      onInsert(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFileUpload(file);
  }

  async function loadStorageImages() {
    if (storageLoaded) return;
    setLoadingStorage(true);
    try {
      const images = await listMailerImages();
      setStorageImages(images);
      setStorageLoaded(true);
    } catch {
      setStorageImages([]);
    } finally {
      setLoadingStorage(false);
    }
  }

  function handleTabChange(newTab: ImageTab) {
    setTab(newTab);
    if (newTab === 'storage') loadStorageImages();
  }

  function handleUrlInsert() {
    const url = urlInput.trim();
    if (url) onInsert(url);
  }

  const tabs: { key: ImageTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { key: 'upload', label: 'Upload', icon: Upload },
    { key: 'storage', label: 'My Storage', icon: FolderOpen },
    { key: 'url', label: 'URL', icon: LinkIcon },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-background shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-card-border px-5 py-4">
          <h3 className="text-base font-semibold text-foreground">Insert Image</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted hover:text-foreground hover:bg-card-border/30 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-card-border px-5">
          {tabs.map(({ key, label, icon: TabIcon }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleTabChange(key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              <TabIcon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5 min-h-[280px]">
          {/* Upload Tab */}
          {tab === 'upload' && (
            <div className="space-y-3">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-card-border px-4 py-10 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
              >
                {uploading ? (
                  <>
                    <Loader2 size={28} className="text-primary animate-spin" />
                    <p className="text-sm font-medium text-foreground">Uploading...</p>
                  </>
                ) : (
                  <>
                    <Upload size={28} className="text-muted" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Drop an image here, or <span className="text-primary">browse</span>
                      </p>
                      <p className="mt-1 text-xs text-muted">JPEG, PNG, WebP, GIF — Max 5MB</p>
                    </div>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />
              {uploadError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger dark:bg-red-950">
                  <X size={14} /> {uploadError}
                </div>
              )}
            </div>
          )}

          {/* Storage Tab */}
          {tab === 'storage' && (
            <div>
              {loadingStorage ? (
                <div className="flex flex-col items-center gap-3 py-10">
                  <Loader2 size={24} className="text-primary animate-spin" />
                  <p className="text-sm text-muted">Loading your images...</p>
                </div>
              ) : storageImages.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <FolderOpen size={28} className="text-muted" />
                  <p className="text-sm font-medium text-foreground">No images in storage</p>
                  <p className="text-xs text-muted">Upload an image first using the Upload tab.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-1">
                  {storageImages.map((img) => (
                    <button
                      key={img.name}
                      type="button"
                      onClick={() => onInsert(img.url)}
                      className="group relative aspect-square rounded-xl border border-card-border overflow-hidden transition-all hover:border-primary hover:shadow-md"
                    >
                      <img
                        src={img.url}
                        alt={img.name}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                          <Check size={16} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* URL Tab */}
          {tab === 'url' && (
            <div className="space-y-4 py-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Image URL</label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleUrlInsert(); } }}
                  placeholder="https://example.com/image.png"
                  className="w-full rounded-xl border border-card-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              {urlInput.trim() && (
                <div className="rounded-xl border border-card-border p-3">
                  <p className="text-xs text-muted mb-2">Preview:</p>
                  <img
                    src={urlInput}
                    alt="Preview"
                    className="max-h-40 rounded-lg object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
              <button
                type="button"
                onClick={handleUrlInsert}
                disabled={!urlInput.trim()}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                <Image size={14} /> Insert Image
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Editor ─────────────────────────────────────────────

const MailEditor = forwardRef<MailEditorRef, { initialHTML?: string }>(
  ({ initialHTML = '' }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [showImagePicker, setShowImagePicker] = useState(false);
    const [htmlMode, setHtmlMode] = useState(false);
    const [htmlSource, setHtmlSource] = useState(initialHTML);

    useImperativeHandle(ref, () => ({
      getHTML: () => {
        if (htmlMode) return htmlSource;
        return editorRef.current?.innerHTML ?? '';
      },
      setHTML: (html: string) => {
        setHtmlSource(html);
        if (editorRef.current) editorRef.current.innerHTML = html;
      },
    }));

    const exec = useCallback((command: string, value?: string) => {
      document.execCommand(command, false, value);
      editorRef.current?.focus();
    }, []);

    const insertLink = useCallback(() => {
      const url = prompt('Enter URL:');
      if (url) exec('createLink', url);
    }, [exec]);

    const changeBlockBg = useCallback((bgValue: string) => {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;

      // Walk up from the cursor to find the nearest block element inside the editor
      let node: Node | null = selection.anchorNode;
      let targetEl: HTMLElement | null = null;

      while (node && node !== editorRef.current) {
        if (node instanceof HTMLElement) {
          const tag = node.tagName.toLowerCase();
          if (['div', 'p', 'h1', 'h2', 'h3', 'blockquote', 'section', 'td', 'li'].includes(tag)) {
            targetEl = node;
            break;
          }
        }
        node = node.parentNode;
      }

      // If no block found, wrap in a div
      if (!targetEl && editorRef.current) {
        targetEl = editorRef.current;
      }

      if (targetEl) {
        if (bgValue === 'transparent') {
          targetEl.style.background = '';
          targetEl.style.backgroundColor = '';
          targetEl.style.color = '';
        } else if (bgValue.includes('gradient')) {
          targetEl.style.background = bgValue;
          // Auto set text to white for dark gradients
          targetEl.style.color = '#ffffff';
        } else {
          targetEl.style.backgroundColor = bgValue;
          targetEl.style.background = bgValue;
          // Auto set text color based on lightness
          const isDark = ['#dc2626','#ea580c','#059669','#2563eb','#4f46e5','#7c3aed','#0f172a'].includes(bgValue);
          targetEl.style.color = isDark ? '#ffffff' : '';
        }
      }

      editorRef.current?.focus();
    }, []);

    const handleImageInsert = useCallback((url: string) => {
      setShowImagePicker(false);
      // Use insertHTML to insert the image at cursor position
      document.execCommand('insertHTML', false, `<img src="${url}" alt="Image" style="max-width:100%;border-radius:8px;margin:8px 0;" />`);
      editorRef.current?.focus();
    }, []);

    const insertButton = useCallback(() => {
      const text = prompt('Button text:', 'Click Here');
      if (!text) return;
      const url = prompt('Button URL:', 'https://');
      if (!url) return;
      const color = prompt('Button color (hex):', '#2563eb') || '#2563eb';
      const btnHtml = `<div style="text-align:center;margin:20px 0"><a href="${url}" target="_blank" style="display:inline-block;background-color:${color};color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">${text}</a></div>`;
      document.execCommand('insertHTML', false, btnHtml);
      editorRef.current?.focus();
    }, []);

    return (
      <>
        <div className="rounded-xl border border-card-border overflow-hidden">
          {/* Toolbar Row 1: Text formatting */}
          <div className="flex flex-wrap items-center gap-0.5 border-b border-card-border bg-card-border/5 px-2 py-1.5">
            <ToolbarBtn icon={Undo2} label="Undo" onClick={() => exec('undo')} />
            <ToolbarBtn icon={Redo2} label="Redo" onClick={() => exec('redo')} />

            <Divider />

            <ToolbarBtn icon={Bold} label="Bold (Ctrl+B)" onClick={() => exec('bold')} />
            <ToolbarBtn icon={Italic} label="Italic (Ctrl+I)" onClick={() => exec('italic')} />
            <ToolbarBtn icon={Underline} label="Underline (Ctrl+U)" onClick={() => exec('underline')} />
            <ToolbarBtn icon={Strikethrough} label="Strikethrough" onClick={() => exec('strikeThrough')} />

            <Divider />

            <FontSizePicker onSelect={(size) => exec('fontSize', size)} />
            <FontFamilyPicker onSelect={(font) => exec('fontName', font)} />

            <Divider />

            <ColorPicker
              colors={TEXT_COLORS}
              label="Text Color"
              icon={Type}
              onSelect={(color) => exec('foreColor', color)}
            />
            <ColorPicker
              colors={BG_COLORS}
              label="Highlight"
              icon={Palette}
              onSelect={(color) => {
                if (color === 'transparent') {
                  exec('removeFormat');
                } else {
                  exec('hiliteColor', color);
                }
              }}
            />

            <Divider />

            <ToolbarBtn icon={Heading1} label="Heading 1" onClick={() => exec('formatBlock', 'h1')} />
            <ToolbarBtn icon={Heading2} label="Heading 2" onClick={() => exec('formatBlock', 'h2')} />
            <ToolbarBtn icon={Heading3} label="Heading 3" onClick={() => exec('formatBlock', 'h3')} />

            <Divider />

            <ToolbarBtn icon={AlignLeft} label="Align Left" onClick={() => exec('justifyLeft')} />
            <ToolbarBtn icon={AlignCenter} label="Align Center" onClick={() => exec('justifyCenter')} />
            <ToolbarBtn icon={AlignRight} label="Align Right" onClick={() => exec('justifyRight')} />

            <Divider />

            <ToolbarBtn icon={List} label="Bullet List" onClick={() => exec('insertUnorderedList')} />
            <ToolbarBtn icon={ListOrdered} label="Numbered List" onClick={() => exec('insertOrderedList')} />
            <ToolbarBtn icon={Quote} label="Blockquote" onClick={() => exec('formatBlock', 'blockquote')} />

            <Divider />

            <ToolbarBtn icon={Link2} label="Insert Link" onClick={insertLink} />
            <ToolbarBtn icon={Image} label="Insert Image" onClick={() => setShowImagePicker(true)} />
            <ToolbarBtn icon={Minus} label="Horizontal Rule" onClick={() => exec('insertHorizontalRule')} />

            <Divider />

            {/* CTA Button */}
            <button
              type="button"
              onClick={insertButton}
              title="Insert CTA Button"
              className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-muted hover:bg-card-border/30 hover:text-foreground transition-colors"
            >
              <span className="inline-block h-4 w-4 rounded bg-primary/20 text-primary text-[9px] font-bold leading-4 text-center">B</span>
              <span className="hidden sm:inline">Button</span>
            </button>

            <Divider />

            <BlockBgPicker onSelect={changeBlockBg} />

            <Divider />

            <ToolbarBtn icon={RemoveFormatting} label="Clear Formatting" onClick={() => exec('removeFormat')} />

            <Divider />

            {/* HTML Source Toggle */}
            <button
              type="button"
              onClick={() => {
                if (!htmlMode) {
                  // Switching TO html mode: capture current visual editor content
                  const currentHtml = editorRef.current?.innerHTML ?? '';
                  setHtmlSource(currentHtml);
                } else {
                  // Switching FROM html mode: push source into visual editor
                  if (editorRef.current) {
                    editorRef.current.innerHTML = htmlSource;
                  }
                }
                setHtmlMode(!htmlMode);
              }}
              title={htmlMode ? 'Switch to Visual Editor' : 'Edit HTML Source'}
              className={`flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium transition-colors ${
                htmlMode
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted hover:bg-card-border/30 hover:text-foreground'
              }`}
            >
              <Code size={14} />
              <span className="hidden sm:inline">{htmlMode ? 'Visual' : 'HTML'}</span>
            </button>
          </div>

          {/* Editor Area */}
          {htmlMode ? (
            <textarea
              value={htmlSource}
              onChange={(e) => setHtmlSource(e.target.value)}
              spellCheck={false}
              className="min-h-[400px] w-full px-4 py-4 text-xs text-foreground outline-none bg-[#1e1e2e] text-[#cdd6f4] font-mono leading-relaxed resize-y"
              style={{ tabSize: 2 }}
              placeholder="Paste or edit HTML here..."
            />
          ) : (
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              dangerouslySetInnerHTML={{ __html: initialHTML }}
              className="min-h-[350px] px-6 py-5 text-sm text-foreground outline-none bg-white dark:bg-slate-950 focus:ring-0 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:mt-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_a]:text-blue-600 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_li]:mb-1 [&_hr]:my-4 [&_hr]:border-gray-200 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-3 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-3 [&_p]:mb-2"
            />
          )}
        </div>

        {/* Image Picker Modal */}
        {showImagePicker && (
          <ImagePickerModal
            onInsert={handleImageInsert}
            onClose={() => setShowImagePicker(false)}
          />
        )}
      </>
    );
  }
);

MailEditor.displayName = 'MailEditor';
export default MailEditor;
