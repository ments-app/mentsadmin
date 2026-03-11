'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/cn';

const CURRENCIES = [
  { symbol: '₹', label: '₹  INR' },
  { symbol: '$', label: '$  USD' },
  { symbol: '€', label: '€  EUR' },
  { symbol: '£', label: '£  GBP' },
  { symbol: '¥', label: '¥  JPY' },
  { symbol: 'AED ', label: 'AED' },
  { symbol: 'SGD ', label: 'SGD' },
  { symbol: 'CAD ', label: 'CAD' },
  { symbol: 'AUD ', label: 'AUD' },
];

type Props = {
  value: string;
  onChange: (value: string) => void;
};

function parseSalary(val: string): { symbol: string; amount: string } {
  // Try to match a known currency prefix
  const symbols = ['AED ', 'SGD ', 'CAD ', 'AUD ', '₹', '$', '€', '£', '¥'];
  for (const s of symbols) {
    if (val.startsWith(s)) {
      return { symbol: s, amount: val.slice(s.length) };
    }
  }
  return { symbol: '₹', amount: val };
}

export default function SalaryInput({ value, onChange }: Props) {
  const parsed = parseSalary(value);
  const [symbol, setSymbol] = useState(parsed.symbol);
  const [amount, setAmount] = useState(parsed.amount);

  // Sync from parent only on first mount (don't fight the user's input)
  useEffect(() => {
    const p = parseSalary(value);
    setSymbol(p.symbol);
    setAmount(p.amount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSymbol(s: string) {
    setSymbol(s);
    onChange(amount ? `${s}${amount}` : '');
  }

  function handleAmount(a: string) {
    setAmount(a);
    onChange(a ? `${symbol}${a}` : '');
  }

  return (
    <div
      className={cn(
        'flex overflow-hidden rounded-lg border bg-input-bg',
        'shadow-[var(--shadow-sm)] transition-all duration-200',
        'border-input-border',
        'focus-within:border-input-focus focus-within:ring-2 focus-within:ring-input-focus/25'
      )}
    >
      <select
        value={symbol}
        onChange={(e) => handleSymbol(e.target.value)}
        className={cn(
          'shrink-0 cursor-pointer border-r border-input-border bg-card-bg px-3 py-2.5 text-sm font-medium text-foreground',
          'outline-none transition-colors duration-150',
          'hover:bg-input-focus/5'
        )}
      >
        {CURRENCIES.map((c) => (
          <option key={c.symbol} value={c.symbol}>{c.label}</option>
        ))}
      </select>
      <input
        type="text"
        value={amount}
        onChange={(e) => handleAmount(e.target.value)}
        placeholder="e.g. 5L – 10L or 50,000 – 80,000"
        className="flex-1 bg-transparent px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted/50"
      />
    </div>
  );
}
