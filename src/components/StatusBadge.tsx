import { CheckCircle2, Clock, XCircle, ShieldAlert, HelpCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const CONFIG: Record<string, {
  label: string;
  icon: React.ElementType;
  classes: string;
}> = {
  approved: {
    label: 'Verified',
    icon: CheckCircle2,
    classes: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    classes: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    classes: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  },
  suspended: {
    label: 'Suspended',
    icon: ShieldAlert,
    classes: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  },
  // Content-level statuses
  active: {
    label: 'Active',
    icon: CheckCircle2,
    classes: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  },
  inactive: {
    label: 'Inactive',
    icon: XCircle,
    classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  },
  pinned: {
    label: 'Pinned',
    icon: CheckCircle2,
    classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  },
  removed: {
    label: 'Removed',
    icon: XCircle,
    classes: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = CONFIG[status] ?? {
    label: status,
    icon: HelpCircle,
    classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${config.classes} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <Icon size={size === 'sm' ? 10 : 12} />
      {config.label}
    </span>
  );
}
