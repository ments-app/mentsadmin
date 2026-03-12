'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/cn';

interface RetentionCohortProps {
  dau: number;
  wau: number;
  mau: number;
  depthDistribution: Record<string, number>;
}

const tooltipStyle = {
  backgroundColor: 'var(--card-bg, #0a0a0a)',
  border: '1px solid var(--card-border, #1a1a1a)',
  borderRadius: '10px',
  color: 'var(--foreground, #e5e5e5)',
  padding: '10px 14px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
};

export function RetentionCohort({ dau, wau, mau, depthDistribution }: RetentionCohortProps) {
  const dauWauRatio = wau > 0 ? Math.round((dau / wau) * 100) : 0;
  const wauMauRatio = mau > 0 ? Math.round((wau / mau) * 100) : 0;

  const depthData = Object.entries(depthDistribution).map(([range, count]) => ({
    range,
    count,
  }));

  const activeUserCards = [
    {
      label: 'Daily Active Users',
      value: dau,
      ratio: null as string | null,
    },
    {
      label: 'Weekly Active Users',
      value: wau,
      ratio: `DAU/WAU: ${dauWauRatio}%`,
    },
    {
      label: 'Monthly Active Users',
      value: mau,
      ratio: `WAU/MAU: ${wauMauRatio}%`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* DAU/WAU/MAU Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {activeUserCards.map((card) => (
          <div key={card.label} className="card-elevated group p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
              {card.value.toLocaleString()}
            </p>
            {card.ratio && (
              <div className="mt-2 flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                <p className="text-xs text-muted">{card.ratio}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Session Depth Distribution */}
      <div className="card-elevated p-6">
        <div className="mb-6">
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            Session Depth Distribution
          </h3>
          <p className="mt-1 text-xs text-muted">How deep users scroll per session</p>
        </div>
        {depthData.length > 0 && depthData.some((d) => d.count > 0) ? (
          <div className="rounded-lg bg-[var(--card-bg)]/50 p-2">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={depthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border, #1a1a1a)" />
                <XAxis
                  dataKey="range"
                  stroke="var(--muted, #666)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: 'Posts Viewed', position: 'bottom' }}
                />
                <YAxis
                  stroke="var(--muted, #666)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: 'Sessions', angle: -90, position: 'left' }}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#00ffa2" name="Sessions" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted/40 text-sm">
            No session data yet
          </div>
        )}
      </div>
    </div>
  );
}
