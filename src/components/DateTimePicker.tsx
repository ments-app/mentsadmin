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
      <label className="mb-1 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-lg border border-card-border bg-background px-3 py-2 text-left text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
      >
        <CalendarDays size={16} className="shrink-0 text-muted" />
        <span className={displayText ? '' : 'text-muted'}>
          {displayText || 'Select date & time...'}
        </span>
        {value && (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); clear(); }}
            className="ml-auto shrink-0 text-muted hover:text-foreground"
          >
            <X size={14} />
          </span>
        )}
      </button>

      {/* Hidden native input for form semantics */}
      <input type="hidden" name={name} value={value} />

      {open && (
        <div className="absolute left-0 z-50 mt-1 w-[300px] rounded-lg border border-card-border bg-card-bg p-3 shadow-lg">
          {/* Month navigation */}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewDate(subMonths(viewDate, 1))}
              className="rounded p-1 text-muted hover:bg-card-border/40 hover:text-foreground"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-foreground">
              {format(viewDate, 'MMMM yyyy')}
            </span>
            <button
              type="button"
              onClick={() => setViewDate(addMonths(viewDate, 1))}
              className="rounded p-1 text-muted hover:bg-card-border/40 hover:text-foreground"
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
          <div className="grid grid-cols-7 text-center text-sm">
            {days.map((day) => {
              const inMonth = isSameMonth(day, viewDate);
              const selected = selectedDate && isSameDay(day, selectedDate);
              const today = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs transition-colors ${
                    selected
                      ? 'bg-primary text-white'
                      : today
                        ? 'border border-primary text-primary'
                        : inMonth
                          ? 'text-foreground hover:bg-card-border/40'
                          : 'text-muted/40'
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          {/* Time picker */}
          <div className="mt-3 flex items-center gap-2 border-t border-card-border pt-3">
            <Clock size={14} className="text-muted" />
            <span className="text-xs font-medium text-muted">Time</span>
            <div className="ml-auto flex items-center gap-1">
              <select
                value={hours}
                onChange={(e) => setTime(e.target.value, minutes)}
                className="rounded border border-card-border bg-background px-1.5 py-1 text-xs text-foreground outline-none focus:border-primary"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={String(i).padStart(2, '0')}>
                    {String(i).padStart(2, '0')}
                  </option>
                ))}
              </select>
              <span className="text-xs text-muted">:</span>
              <select
                value={minutes}
                onChange={(e) => setTime(hours, e.target.value)}
                className="rounded border border-card-border bg-background px-1.5 py-1 text-xs text-foreground outline-none focus:border-primary"
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
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setViewDate(now);
                selectDay(now);
              }}
              className="flex-1 rounded border border-card-border px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-card-border/40 hover:text-foreground"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 rounded bg-primary px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
