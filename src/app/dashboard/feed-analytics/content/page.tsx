import { getContentPerformance } from '@/actions/feed-analytics';
import { ContentBreakdown } from '@/components/analytics/ContentBreakdown';
import Link from 'next/link';

export default async function ContentAnalyticsPage() {
  let contentData = {
    topPosts: [] as Array<{
      post_id: string;
      engagement_score: number;
      virality_velocity: number;
      like_rate: number;
      reply_rate: number;
      ctr: number;
    }>,
    trendingTopics: [] as Array<{
      topic: string;
      post_count: number;
      velocity: number;
      status: string;
    }>,
    topCreators: [] as Array<{
      author_id: string;
      engagement_count: number;
    }>,
  };

  try {
    contentData = await getContentPerformance();
  } catch (error) {
    console.error('Error loading content analytics:', error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sidebar-heading">Content Performance</h1>
          <p className="text-sm text-sidebar-text/60 mt-1">Post type performance, topics, and top creators</p>
        </div>
        <Link
          href="/dashboard/feed-analytics"
          className="px-4 py-2 text-sm font-medium rounded-lg border border-sidebar-border bg-sidebar-bg text-sidebar-text hover:bg-sidebar-hover transition-colors"
        >
          Back to Overview
        </Link>
      </div>

      <ContentBreakdown topPosts={contentData.topPosts} trendingTopics={contentData.trendingTopics} />

      {/* Top Creators Table */}
      <div className="rounded-xl border border-sidebar-border bg-sidebar-bg overflow-hidden">
        <div className="px-6 py-4 border-b border-sidebar-border">
          <h3 className="text-lg font-semibold text-sidebar-heading">Top Creators by Engagement</h3>
        </div>
        {contentData.topCreators.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sidebar-border">
                <th className="text-left px-6 py-3 text-sidebar-text/60 font-medium">#</th>
                <th className="text-left px-6 py-3 text-sidebar-text/60 font-medium">Creator ID</th>
                <th className="text-left px-6 py-3 text-sidebar-text/60 font-medium">Engagements</th>
              </tr>
            </thead>
            <tbody>
              {contentData.topCreators.map((creator, i) => (
                <tr key={creator.author_id} className="border-b border-sidebar-border/50">
                  <td className="px-6 py-3 text-sidebar-text">{i + 1}</td>
                  <td className="px-6 py-3 text-sidebar-heading font-mono text-xs">{creator.author_id.substring(0, 8)}...</td>
                  <td className="px-6 py-3 text-sidebar-text">{creator.engagement_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-12 text-center text-sidebar-text/40">
            No creator data yet
          </div>
        )}
      </div>
    </div>
  );
}
