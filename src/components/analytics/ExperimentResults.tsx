'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { cn } from '@/lib/cn';

interface VariantData {
  variant_id: string;
  variant_name: string;
  sample_size: number;
  metrics: Record<string, {
    value: number;
    ci_lower: number;
    ci_upper: number;
    relative_change?: number;
    p_value?: number;
    is_significant: boolean;
  }>;
}

interface ExperimentResultsProps {
  variants: VariantData[];
  isSignificant: boolean;
  winner?: string;
}

const tooltipStyle = {
  backgroundColor: 'var(--card-bg, #0a0a0a)',
  border: '1px solid var(--card-border, #1a1a1a)',
  borderRadius: '10px',
  color: 'var(--foreground, #e5e5e5)',
  padding: '10px 14px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
};

export function ExperimentResults({ variants, isSignificant, winner }: ExperimentResultsProps) {
  if (variants.length === 0) {
    return (
      <div className="card-elevated p-8">
        <p className="text-muted/40 text-center text-sm">No results available yet</p>
      </div>
    );
  }

  const chartData = variants.map((v) => ({
    name: v.variant_name,
    'Engagement Rate': Math.round((v.metrics.engagement_rate?.value || 0) * 10000) / 100,
    CTR: Math.round((v.metrics.ctr?.value || 0) * 10000) / 100,
    'Sample Size': v.sample_size,
  }));

  return (
    <div className="space-y-6">
      {/* Significance banner */}
      <div
        className={cn(
          'card-elevated flex items-center gap-3 px-5 py-4',
          isSignificant
            ? 'ring-1 ring-green-500/20 bg-green-500/5'
            : 'ring-1 ring-yellow-500/20 bg-yellow-500/5'
        )}
      >
        <div
          className={cn(
            'h-2.5 w-2.5 rounded-full shrink-0',
            isSignificant ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
          )}
        />
        <p className={cn(
          'text-sm font-medium',
          isSignificant ? 'text-green-400' : 'text-yellow-400'
        )}>
          {isSignificant
            ? `Statistically significant result! Winner: ${variants.find((v) => v.variant_id === winner)?.variant_name || winner}`
            : 'Not yet statistically significant. Needs more data.'}
        </p>
      </div>

      {/* Variant comparison chart */}
      <div className="card-elevated p-6">
        <div className="mb-6">
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            Variant Comparison
          </h3>
          <p className="mt-1 text-xs text-muted">Side-by-side performance metrics</p>
        </div>
        <div className="rounded-lg bg-[var(--card-bg)]/50 p-2">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border, #1a1a1a)" />
              <XAxis
                dataKey="name"
                stroke="var(--muted, #666)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--muted, #666)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
              />
              <Bar dataKey="Engagement Rate" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="CTR" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Variant details table */}
      <div className="card-elevated overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--card-border)]">
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            Variant Details
          </h3>
          <p className="mt-1 text-xs text-muted">Detailed breakdown per variant</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)]">
                <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">Variant</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">Sample Size</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">Engagement Rate</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">CTR</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">Avg Dwell</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">Significance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]/50">
              {variants.map((v, i) => (
                <tr
                  key={v.variant_id}
                  className="transition-colors duration-150 hover:bg-[var(--primary)]/[0.03]"
                >
                  <td className="px-6 py-4 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      {v.variant_name}
                      {v.variant_id === winner && (
                        <span className="inline-flex items-center text-[11px] font-semibold bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full ring-1 ring-green-500/20">
                          Winner
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted font-mono text-xs">
                    {v.sample_size.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-foreground font-mono text-xs">
                      {(v.metrics.engagement_rate?.value * 100).toFixed(2)}%
                    </span>
                    {i > 0 && v.metrics.engagement_rate?.relative_change !== undefined && (
                      <span className={cn(
                        'ml-2 text-[11px] font-semibold',
                        v.metrics.engagement_rate.relative_change > 0 ? 'text-green-400' : 'text-red-400'
                      )}>
                        {v.metrics.engagement_rate.relative_change > 0 ? '+' : ''}{(v.metrics.engagement_rate.relative_change * 100).toFixed(1)}%
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-foreground font-mono text-xs">
                    {(v.metrics.ctr?.value * 100).toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 text-foreground font-mono text-xs">
                    {Math.round(v.metrics.avg_dwell_ms?.value || 0)}ms
                  </td>
                  <td className="px-6 py-4">
                    {i === 0 ? (
                      <span className="text-[11px] font-medium text-muted/60">Control</span>
                    ) : v.metrics.engagement_rate?.is_significant ? (
                      <span className="inline-flex items-center text-[11px] font-semibold bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full ring-1 ring-green-500/20">
                        p={v.metrics.engagement_rate.p_value?.toFixed(4)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[11px] font-semibold bg-yellow-500/10 text-yellow-400 px-2.5 py-1 rounded-full ring-1 ring-yellow-500/20">
                        Not significant
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
