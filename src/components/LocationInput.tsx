'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

type Result = {
  place_id: number;
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    county?: string;
    state?: string;
    country?: string;
  };
  type: string;
  class: string;
};

function formatResult(r: Result): string {
  const a = r.address;
  const city = a.city || a.town || a.village || a.suburb || a.county;
  const parts = [city, a.state, a.country].filter(Boolean);
  return parts.slice(0, 3).join(', ');
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  name?: string;
};

export default function LocationInput({ value, onChange, placeholder, label, name }: Props) {
  const [input, setInput] = useState(value);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync input when parent value changes externally (e.g. loading form data)
  useEffect(() => {
    setInput(value);
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=8&addressdetails=1`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en-IN,en;q=0.9' },
      });
      const data: Result[] = await res.json();

      // Deduplicate by formatted label
      const seen = new Set<string>();
      const unique = data
        .map((r) => ({ r, label: formatResult(r) }))
        .filter(({ label }) => {
          if (!label || seen.has(label)) return false;
          seen.add(label);
          return true;
        })
        .map(({ r }) => r);

      setResults(unique);
      setOpen(unique.length > 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(val: string) {
    setInput(val);
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 400);
  }

  function select(r: Result) {
    const name = formatResult(r);
    setInput(name);
    onChange(name);
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div ref={wrapperRef} className="relative">
        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none z-10" />
        <input
          id={name}
          type="text"
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder ?? 'Search city or location…'}
          className="w-full rounded-lg border border-card-border bg-background pl-8 pr-8 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted"
        />
        {loading && (
          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted animate-spin" />
        )}

        {open && results.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full rounded-lg border border-card-border bg-background shadow-lg overflow-hidden max-h-56 overflow-y-auto">
            {results.map((r) => (
              <li key={r.place_id}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); select(r); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <MapPin size={12} className="shrink-0 text-muted" />
                  <span className="truncate">{formatResult(r)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
