'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

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
      <div className="rounded-xl border border-sidebar-border bg-sidebar-bg p-6">
        <h3 className="text-lg font-semibold text-sidebar-heading mb-4">Trending Topics</h3>
        {topicData.length > 0 ? (
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
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-sidebar-bg, #1a1a2e)',
                  border: '1px solid var(--color-sidebar-border, #333)',
                  borderRadius: '8px',
                  color: 'var(--color-sidebar-text, #ddd)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-sidebar-text/40">
            No topic data yet
          </div>
        )}
      </div>

      {/* Post Performance */}
      <div className="rounded-xl border border-sidebar-border bg-sidebar-bg p-6">
        <h3 className="text-lg font-semibold text-sidebar-heading mb-4">Top Post Performance</h3>
        {postPerformanceData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={postPerformanceData}>
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
              <Bar dataKey="engagement" fill="#10b981" name="Engagement %" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ctr" fill="#3b82f6" name="CTR %" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-sidebar-text/40">
            No post performance data yet
          </div>
        )}
      </div>
    </div>
  );
}
