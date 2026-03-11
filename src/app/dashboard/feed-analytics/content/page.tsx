import { getContentPerformance } from '@/actions/feed-analytics';
import { ContentBreakdown } from '@/components/analytics/ContentBreakdown';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

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
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <FileText size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Content Performance</h1>
            <p className="text-sm text-muted">Post type performance, topics, and top creators</p>
          </div>
        </div>
        <Link
          href="/dashboard/feed-analytics"
          className="btn-secondary gap-2"
        >
          <ArrowLeft size={15} />
          Back to Overview
        </Link>
      </div>

      <ContentBreakdown topPosts={contentData.topPosts} trendingTopics={contentData.trendingTopics} />

      {/* Top Creators Table */}
      <div className="card-elevated rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-card-border">
          <h3 className="text-base font-semibold text-foreground">Top Creators by Engagement</h3>
        </div>
        {contentData.topCreators.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-card-bg/60">
                <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">#</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">Creator ID</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">Engagements</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {contentData.topCreators.map((creator, i) => (
                <tr key={creator.author_id} className="transition-colors hover:bg-primary/[0.03]">
                  <td className="px-6 py-3.5">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-card-border/40 text-xs font-semibold text-muted">
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 font-mono text-xs text-foreground">{creator.author_id.substring(0, 8)}...</td>
                  <td className="px-6 py-3.5">
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-sm font-semibold text-primary">
                      {creator.engagement_count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-16 text-center">
            <FileText size={40} className="mx-auto mb-3 text-muted/30" />
            <p className="text-sm font-medium text-muted">No creator data yet</p>
            <p className="mt-1 text-xs text-muted/70">Creator engagement data will appear here once available</p>
          </div>
        )}
      </div>
    </div>
  );
}
