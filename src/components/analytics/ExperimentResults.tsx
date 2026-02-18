'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

export function ExperimentResults({ variants, isSignificant, winner }: ExperimentResultsProps) {
  if (variants.length === 0) {
    return (
      <div className="rounded-xl border border-sidebar-border bg-sidebar-bg p-6">
        <p className="text-sidebar-text/40 text-center">No results available yet</p>
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
      <div className={`rounded-xl p-4 ${isSignificant ? 'bg-green-500/10 border border-green-500/30' : 'bg-yellow-500/10 border border-yellow-500/30'}`}>
        <p className={`text-sm font-medium ${isSignificant ? 'text-green-400' : 'text-yellow-400'}`}>
          {isSignificant
            ? `Statistically significant result! Winner: ${variants.find((v) => v.variant_id === winner)?.variant_name || winner}`
            : 'Not yet statistically significant. Needs more data.'}
        </p>
      </div>

      {/* Variant comparison chart */}
      <div className="rounded-xl border border-sidebar-border bg-sidebar-bg p-6">
        <h3 className="text-lg font-semibold text-sidebar-heading mb-4">Variant Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-sidebar-border, #333)" />
            <XAxis dataKey="name" stroke="var(--color-sidebar-text, #888)" fontSize={12} />
            <YAxis stroke="var(--color-sidebar-text, #888)" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-sidebar-bg, #1a1a2e)',
                border: '1px solid var(--color-sidebar-border, #333)',
                borderRadius: '8px',
                color: 'var(--color-sidebar-text, #ddd)',
              }}
            />
            <Legend />
            <Bar dataKey="Engagement Rate" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="CTR" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Variant details table */}
      <div className="rounded-xl border border-sidebar-border bg-sidebar-bg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sidebar-border">
              <th className="text-left px-4 py-3 text-sidebar-text/60 font-medium">Variant</th>
              <th className="text-left px-4 py-3 text-sidebar-text/60 font-medium">Sample Size</th>
              <th className="text-left px-4 py-3 text-sidebar-text/60 font-medium">Engagement Rate</th>
              <th className="text-left px-4 py-3 text-sidebar-text/60 font-medium">CTR</th>
              <th className="text-left px-4 py-3 text-sidebar-text/60 font-medium">Avg Dwell</th>
              <th className="text-left px-4 py-3 text-sidebar-text/60 font-medium">Significance</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v, i) => (
              <tr key={v.variant_id} className="border-b border-sidebar-border/50">
                <td className="px-4 py-3 font-medium text-sidebar-heading">
                  {v.variant_name}
                  {v.variant_id === winner && (
                    <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Winner</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sidebar-text">{v.sample_size}</td>
                <td className="px-4 py-3 text-sidebar-text">
                  {(v.metrics.engagement_rate?.value * 100).toFixed(2)}%
                  {i > 0 && v.metrics.engagement_rate?.relative_change !== undefined && (
                    <span className={`ml-2 text-xs ${v.metrics.engagement_rate.relative_change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {v.metrics.engagement_rate.relative_change > 0 ? '+' : ''}{(v.metrics.engagement_rate.relative_change * 100).toFixed(1)}%
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sidebar-text">
                  {(v.metrics.ctr?.value * 100).toFixed(2)}%
                </td>
                <td className="px-4 py-3 text-sidebar-text">
                  {Math.round(v.metrics.avg_dwell_ms?.value || 0)}ms
                </td>
                <td className="px-4 py-3">
                  {i === 0 ? (
                    <span className="text-xs text-sidebar-text/40">Control</span>
                  ) : v.metrics.engagement_rate?.is_significant ? (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                      p={v.metrics.engagement_rate.p_value?.toFixed(4)}
                    </span>
                  ) : (
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
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
  );
}
