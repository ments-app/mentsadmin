'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RetentionCohortProps {
  dau: number;
  wau: number;
  mau: number;
  depthDistribution: Record<string, number>;
}

export function RetentionCohort({ dau, wau, mau, depthDistribution }: RetentionCohortProps) {
  const dauWauRatio = wau > 0 ? Math.round((dau / wau) * 100) : 0;
  const wauMauRatio = mau > 0 ? Math.round((wau / mau) * 100) : 0;

  const depthData = Object.entries(depthDistribution).map(([range, count]) => ({
    range,
    count,
  }));

  return (
    <div className="space-y-6">
      {/* DAU/WAU/MAU Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-sidebar-border bg-sidebar-bg p-6">
          <p className="text-xs text-sidebar-text/60 font-medium mb-1">Daily Active Users</p>
          <p className="text-3xl font-bold text-sidebar-heading">{dau}</p>
        </div>
        <div className="rounded-xl border border-sidebar-border bg-sidebar-bg p-6">
          <p className="text-xs text-sidebar-text/60 font-medium mb-1">Weekly Active Users</p>
          <p className="text-3xl font-bold text-sidebar-heading">{wau}</p>
          <p className="text-xs text-sidebar-text/40 mt-1">DAU/WAU: {dauWauRatio}%</p>
        </div>
        <div className="rounded-xl border border-sidebar-border bg-sidebar-bg p-6">
          <p className="text-xs text-sidebar-text/60 font-medium mb-1">Monthly Active Users</p>
          <p className="text-3xl font-bold text-sidebar-heading">{mau}</p>
          <p className="text-xs text-sidebar-text/40 mt-1">WAU/MAU: {wauMauRatio}%</p>
        </div>
      </div>

      {/* Session Depth Distribution */}
      <div className="rounded-xl border border-sidebar-border bg-sidebar-bg p-6">
        <h3 className="text-lg font-semibold text-sidebar-heading mb-4">Session Depth Distribution</h3>
        {depthData.length > 0 && depthData.some((d) => d.count > 0) ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={depthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-sidebar-border, #333)" />
              <XAxis dataKey="range" stroke="var(--color-sidebar-text, #888)" fontSize={12} label={{ value: 'Posts Viewed', position: 'bottom' }} />
              <YAxis stroke="var(--color-sidebar-text, #888)" fontSize={12} label={{ value: 'Sessions', angle: -90, position: 'left' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-sidebar-bg, #1a1a2e)',
                  border: '1px solid var(--color-sidebar-border, #333)',
                  borderRadius: '8px',
                  color: 'var(--color-sidebar-text, #ddd)',
                }}
              />
              <Bar dataKey="count" fill="#8b5cf6" name="Sessions" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-sidebar-text/40">
            No session data yet
          </div>
        )}
      </div>
    </div>
  );
}
