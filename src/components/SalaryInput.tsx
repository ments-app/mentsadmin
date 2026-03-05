'use client';

import { useState, useEffect } from 'react';

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
    <div className="flex rounded-lg border border-card-border bg-background overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
      <select
        value={symbol}
        onChange={(e) => handleSymbol(e.target.value)}
        className="shrink-0 bg-card-border/40 px-2 py-2 text-sm text-foreground outline-none border-r border-card-border cursor-pointer"
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
        className="flex-1 px-3 py-2 text-sm text-foreground bg-transparent outline-none placeholder:text-muted"
      />
    </div>
  );
}
