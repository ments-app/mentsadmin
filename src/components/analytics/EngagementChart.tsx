'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DailyData {
  date: string;
  engagement_rate: number;
  total_impressions: number;
  total_engagements: number;
}

interface EngagementChartProps {
  data: DailyData[];
}

export function EngagementChart({ data }: EngagementChartProps) {
  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    'Engagement Rate': Math.round(d.engagement_rate * 100) / 100,
    Impressions: d.total_impressions,
    Engagements: d.total_engagements,
  }));

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-sidebar-border bg-sidebar-bg p-6">
        <h3 className="text-lg font-semibold text-sidebar-heading mb-4">Engagement Over Time</h3>
        <div className="flex items-center justify-center h-64 text-sidebar-text/40">
          No data available yet
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-sidebar-border bg-sidebar-bg p-6">
      <h3 className="text-lg font-semibold text-sidebar-heading mb-4">Engagement Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-sidebar-border, #333)" />
          <XAxis dataKey="date" stroke="var(--color-sidebar-text, #888)" fontSize={12} />
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
          <Line
            type="monotone"
            dataKey="Engagement Rate"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="Impressions"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            yAxisId={0}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
