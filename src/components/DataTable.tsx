'use client';

import Link from 'next/link';
import { Pencil, Trash2, Inbox } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  editHref: (item: T) => string;
  onDelete?: (item: T) => void;
  emptyMessage?: string;
}

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols + 1 }).map((_, j) => (
            <td key={j} className="px-5 py-4">
              <div
                className="skeleton-shimmer h-4 rounded-md"
                style={{ width: j === cols ? '60px' : `${60 + Math.random() * 30}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function DataTable<T extends { id: string }>({
  columns,
  data,
  loading,
  editHref,
  onDelete,
  emptyMessage = 'No records found.',
}: DataTableProps<T>) {
  return (
    <div className="card-elevated overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-card-border bg-surface-hover/50">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted"
                >
                  {col.label}
                </th>
              ))}
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={columns.length} />
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-5 py-16 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-hover">
                      <Inbox size={24} className="text-muted/60" />
                    </div>
                    <p className="text-sm font-medium text-muted">
                      {emptyMessage}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr
                  key={item.id}
                  className={cn(
                    'border-b border-card-border/50 transition-colors duration-150 last:border-b-0',
                    'hover:bg-primary-light/30'
                  )}
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className="px-5 py-3.5 text-foreground"
                    >
                      {col.render
                        ? col.render(item)
                        : String(
                            (item as Record<string, unknown>)[String(col.key)] ?? ''
                          )}
                    </td>
                  ))}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <Link
                        href={editHref(item)}
                        className={cn(
                          'group/btn relative rounded-lg p-2 text-muted transition-all duration-150',
                          'hover:bg-primary-light hover:text-primary'
                        )}
                        title="Edit"
                      >
                        <Pencil size={15} />
                        <span
                          className={cn(
                            'pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2',
                            'whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] font-medium text-card-bg',
                            'opacity-0 transition-opacity duration-150 group-hover/btn:opacity-100'
                          )}
                        >
                          Edit
                        </span>
                      </Link>
                      {onDelete && (
                        <button
                          onClick={() => onDelete(item)}
                          className={cn(
                            'group/btn relative rounded-lg p-2 text-muted transition-all duration-150',
                            'hover:bg-danger/10 hover:text-danger'
                          )}
                          title="Delete"
                        >
                          <Trash2 size={15} />
                          <span
                            className={cn(
                              'pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2',
                              'whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] font-medium text-card-bg',
                              'opacity-0 transition-opacity duration-150 group-hover/btn:opacity-100'
                            )}
                          >
                            Delete
                          </span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
