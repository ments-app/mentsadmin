import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/cn';

interface StatsCardProps {
  title: string;
  count: number;
  icon: LucideIcon;
  trend?: { value: number; direction: 'up' | 'down' };
  subtitle?: string;
}

export default function StatsCard({
  title,
  count,
  icon: Icon,
  trend,
  subtitle,
}: StatsCardProps) {
  return (
    <div className="card-elevated group p-6">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            {count.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center gap-2">
            {trend && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-semibold',
                  trend.direction === 'up'
                    ? 'text-success'
                    : 'text-danger'
                )}
              >
                {trend.direction === 'up' ? (
                  <TrendingUp size={13} />
                ) : (
                  <TrendingDown size={13} />
                )}
                {trend.value}%
              </span>
            )}
            {subtitle && (
              <span className="truncate text-xs text-muted">{subtitle}</span>
            )}
          </div>
        </div>
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
            'bg-primary/10',
            'ring-1 ring-primary/10',
            'transition-transform duration-200 group-hover:scale-110'
          )}
        >
          <Icon size={20} className="text-primary" />
        </div>
      </div>
    </div>
  );
}
