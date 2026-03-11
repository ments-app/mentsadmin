import { cn } from '@/lib/cn';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const CONFIG: Record<string, {
  label: string;
  dot: string;
  classes: string;
}> = {
  approved: {
    label: 'Verified',
    dot: 'bg-emerald-500',
    classes: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
  },
  pending: {
    label: 'Pending',
    dot: 'bg-amber-500',
    classes: 'bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
  },
  rejected: {
    label: 'Rejected',
    dot: 'bg-red-500',
    classes: 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20',
  },
  suspended: {
    label: 'Suspended',
    dot: 'bg-orange-500',
    classes: 'bg-orange-50 text-orange-700 ring-orange-600/10 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/20',
  },
  active: {
    label: 'Active',
    dot: 'bg-emerald-500',
    classes: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
  },
  inactive: {
    label: 'Inactive',
    dot: 'bg-gray-400',
    classes: 'bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-500/10 dark:text-gray-400 dark:ring-gray-500/20',
  },
  pinned: {
    label: 'Pinned',
    dot: 'bg-blue-500',
    classes: 'bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20',
  },
  removed: {
    label: 'Removed',
    dot: 'bg-red-500',
    classes: 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20',
  },
};

const FALLBACK = {
  label: '',
  dot: 'bg-gray-400',
  classes: 'bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-500/10 dark:text-gray-400 dark:ring-gray-500/20',
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = CONFIG[status] ?? { ...FALLBACK, label: status };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset',
        config.classes,
        size === 'sm'
          ? 'px-2 py-0.5 text-[11px]'
          : 'px-2.5 py-1 text-xs'
      )}
    >
      <span
        className={cn(
          'shrink-0 rounded-full',
          config.dot,
          size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2'
        )}
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
}
