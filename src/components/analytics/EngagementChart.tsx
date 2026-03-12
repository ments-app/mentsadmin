'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { cn } from '@/lib/cn';

interface DailyData {
  date: string;
  engagement_rate: number;
  total_impressions: number;
  total_engagements: number;
}

interface EngagementChartProps {
  data: DailyData[];
}

const tooltipStyle = {
  backgroundColor: 'var(--card-bg, #0a0a0a)',
  border: '1px solid var(--card-border, #1a1a1a)',
  borderRadius: '10px',
  color: 'var(--foreground, #e5e5e5)',
  padding: '10px 14px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
};

export function EngagementChart({ data }: EngagementChartProps) {
  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    'Engagement Rate': Math.round(d.engagement_rate * 100) / 100,
    Impressions: d.total_impressions,
    Engagements: d.total_engagements,
  }));

  if (chartData.length === 0) {
    return (
      <div className="card-elevated p-6">
        <div className="mb-6">
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            Engagement Over Time
          </h3>
          <p className="mt-1 text-xs text-muted">Daily engagement metrics</p>
        </div>
        <div className="flex items-center justify-center h-64 text-muted/40 text-sm">
          No data available yet
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated p-6">
      <div className="mb-6">
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          Engagement Over Time
        </h3>
        <p className="mt-1 text-xs text-muted">Daily engagement metrics</p>
      </div>
      <div className="rounded-lg bg-[var(--card-bg)]/50 p-2">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border, #1a1a1a)" />
            <XAxis
              dataKey="date"
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
            <Line
              type="monotone"
              dataKey="Engagement Rate"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, fill: '#10b981' }}
            />
            <Line
              type="monotone"
              dataKey="Impressions"
              stroke="#00ffa2"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, fill: '#00ffa2' }}
              yAxisId={0}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
