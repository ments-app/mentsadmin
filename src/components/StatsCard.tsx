import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  count: number;
  icon: LucideIcon;
}

export default function StatsCard({ title, count, icon: Icon }: StatsCardProps) {
  return (
    <div className="rounded-xl border border-card-border bg-card-bg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{count}</p>
        </div>
        <div className="rounded-lg bg-primary-light p-3">
          <Icon size={24} className="text-primary" />
        </div>
      </div>
    </div>
  );
}
