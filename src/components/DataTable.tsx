'use client';

import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';

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
            <td key={j} className="px-4 py-3">
              <div className="h-4 w-3/4 animate-pulse rounded bg-card-border" />
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
    <div className="overflow-x-auto rounded-lg border border-card-border bg-card-bg">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-card-border">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="px-4 py-3 font-medium text-muted"
              >
                {col.label}
              </th>
            ))}
            <th className="px-4 py-3 font-medium text-muted">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-card-border">
          {loading ? (
            <SkeletonRows cols={columns.length} />
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="px-4 py-8 text-center text-muted"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={item.id} className="hover:bg-primary-light/30">
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-4 py-3">
                    {col.render
                      ? col.render(item)
                      : String((item as Record<string, unknown>)[String(col.key)] ?? '')}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={editHref(item)}
                      className="rounded p-1.5 text-muted transition-colors hover:bg-primary-light hover:text-primary"
                    >
                      <Pencil size={16} />
                    </Link>
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item)}
                        className="rounded p-1.5 text-muted transition-colors hover:bg-red-50 hover:text-danger dark:hover:bg-red-950"
                      >
                        <Trash2 size={16} />
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
  );
}
