'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { cn } from '@/lib/cn';

interface DateTimePickerProps {
  label: string;
  name: string;
  value: string; // "YYYY-MM-DDTHH:mm" format (same as datetime-local)
  onChange: (value: string) => void;
  required?: boolean;
}

export default function DateTimePicker({
  label,
  name,
  value,
  onChange,
  required,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) return new Date(value);
    return new Date();
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? new Date(value) : null;
  const hours = selectedDate ? String(selectedDate.getHours()).padStart(2, '0') : '12';
  const minutes = selectedDate ? String(selectedDate.getMinutes()).padStart(2, '0') : '00';

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  function selectDay(day: Date) {
    const h = selectedDate ? selectedDate.getHours() : 12;
    const m = selectedDate ? selectedDate.getMinutes() : 0;
    const dt = new Date(day);
    dt.setHours(h, m, 0, 0);
    onChange(toLocalString(dt));
  }

  function setTime(h: string, m: string) {
    const base = selectedDate ? new Date(selectedDate) : new Date();
    if (!selectedDate) {
      base.setSeconds(0, 0);
    }
    base.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
    onChange(toLocalString(base));
  }

  function toLocalString(d: Date) {
    // "YYYY-MM-DDTHH:mm"
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hh}:${mm}`;
  }

  function clear() {
    onChange('');
    setOpen(false);
  }

  const displayText = selectedDate
    ? format(selectedDate, 'MMM d, yyyy') + ' at ' + format(selectedDate, 'hh:mm a')
    : '';

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg border bg-input-bg px-3.5 py-2.5 text-left text-sm text-foreground',
          'shadow-[var(--shadow-sm)] transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-input-focus/25 focus:border-input-focus',
          open ? 'border-input-focus ring-2 ring-input-focus/25' : 'border-input-border hover:border-input-focus/40'
        )}
      >
        <CalendarDays size={16} className="shrink-0 text-muted" />
        <span className={displayText ? 'flex-1' : 'flex-1 text-muted/50'}>
          {displayText || 'Select date & time...'}
        </span>
        {value && (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); clear(); }}
            className="shrink-0 rounded-md p-0.5 text-muted transition-colors hover:bg-input-border/40 hover:text-foreground"
          >
            <X size={14} />
          </span>
        )}
      </button>

      {/* Hidden native input for form semantics */}
      <input type="hidden" name={name} value={value} />

      {open && (
        <div className="absolute left-0 z-50 mt-1.5 w-[300px] rounded-lg border border-input-border bg-card-bg p-4 shadow-lg">
          {/* Month navigation */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewDate(subMonths(viewDate, 1))}
              className="rounded-md p-1.5 text-muted transition-all duration-150 hover:bg-input-focus/10 hover:text-input-focus"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-foreground">
              {format(viewDate, 'MMMM yyyy')}
            </span>
            <button
              type="button"
              onClick={() => setViewDate(addMonths(viewDate, 1))}
              className="rounded-md p-1.5 text-muted transition-all duration-150 hover:bg-input-focus/10 hover:text-input-focus"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="mb-1 grid grid-cols-7 text-center text-xs font-medium text-muted">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <span key={d} className="py-1">{d}</span>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5 text-center text-sm">
            {days.map((day) => {
              const inMonth = isSameMonth(day, viewDate);
              const selected = selectedDate && isSameDay(day, selectedDate);
              const today = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={cn(
                    'mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs transition-all duration-150',
                    selected
                      ? 'bg-input-focus text-white font-semibold shadow-sm'
                      : today
                        ? 'border border-input-focus text-input-focus font-medium'
                        : inMonth
                          ? 'text-foreground hover:bg-input-focus/10 hover:text-input-focus'
                          : 'text-muted/30'
                  )}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          {/* Time picker */}
          <div className="mt-3 flex items-center gap-2.5 border-t border-input-border pt-3">
            <Clock size={14} className="text-muted" />
            <span className="text-xs font-medium text-muted">Time</span>
            <div className="ml-auto flex items-center gap-1.5">
              <select
                value={hours}
                onChange={(e) => setTime(e.target.value, minutes)}
                className="rounded-md border border-input-border bg-input-bg px-2 py-1 text-xs text-foreground outline-none transition-all duration-150 focus:border-input-focus focus:ring-1 focus:ring-input-focus/25"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={String(i).padStart(2, '0')}>
                    {String(i).padStart(2, '0')}
                  </option>
                ))}
              </select>
              <span className="text-xs font-bold text-muted">:</span>
              <select
                value={minutes}
                onChange={(e) => setTime(hours, e.target.value)}
                className="rounded-md border border-input-border bg-input-bg px-2 py-1 text-xs text-foreground outline-none transition-all duration-150 focus:border-input-focus focus:ring-1 focus:ring-input-focus/25"
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={String(i).padStart(2, '0')}>
                    {String(i).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick actions */}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setViewDate(now);
                selectDay(now);
              }}
              className="flex-1 rounded-lg border border-input-border px-2.5 py-1.5 text-xs font-medium text-muted transition-all duration-150 hover:border-input-focus/40 hover:bg-input-focus/5 hover:text-foreground"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-white shadow-sm transition-all duration-150 hover:bg-primary-hover active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
