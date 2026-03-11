'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { cn } from '@/lib/cn';

interface ContentBreakdownProps {
  topPosts: Array<{
    post_id: string;
    engagement_score: number;
    virality_velocity: number;
    like_rate: number;
    reply_rate: number;
    ctr: number;
  }>;
  trendingTopics: Array<{
    topic: string;
    post_count: number;
    velocity: number;
    status: string;
  }>;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const tooltipStyle = {
  backgroundColor: 'var(--card-bg, #0a0a0a)',
  border: '1px solid var(--card-border, #1a1a1a)',
  borderRadius: '10px',
  color: 'var(--foreground, #e5e5e5)',
  padding: '10px 14px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
};

export function ContentBreakdown({ topPosts, trendingTopics }: ContentBreakdownProps) {
  const topicData = trendingTopics.slice(0, 8).map((t) => ({
    name: t.topic,
    value: t.post_count,
    velocity: t.velocity,
  }));

  const postPerformanceData = topPosts.slice(0, 10).map((p, i) => ({
    name: `Post ${i + 1}`,
    engagement: Math.round(p.engagement_score * 100),
    ctr: Math.round(p.ctr * 100),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Topic Distribution */}
      <div className="card-elevated p-6">
        <div className="mb-6">
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            Trending Topics
          </h3>
          <p className="mt-1 text-xs text-muted">Distribution by post count</p>
        </div>
        {topicData.length > 0 ? (
          <div className="rounded-lg bg-[var(--card-bg)]/50 p-2">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topicData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {topicData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted/40 text-sm">
            No topic data yet
          </div>
        )}
      </div>

      {/* Post Performance */}
      <div className="card-elevated p-6">
        <div className="mb-6">
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            Top Post Performance
          </h3>
          <p className="mt-1 text-xs text-muted">Engagement and click-through rates</p>
        </div>
        {postPerformanceData.length > 0 ? (
          <div className="rounded-lg bg-[var(--card-bg)]/50 p-2">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={postPerformanceData}>
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
                <Bar dataKey="engagement" fill="#6366f1" name="Engagement %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ctr" fill="#10b981" name="CTR %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted/40 text-sm">
            No post performance data yet
          </div>
        )}
      </div>
    </div>
  );
}
