import { postsByDay, recentPosts, totals } from "@/lib/posts";
import { linkedinSummary } from "@/lib/linkedin";
import { PageHeader } from "@/components/page-header";
import { AnalyticsCharts } from "./charts";
import { LiUpload } from "./li-upload";
import { Empty, PlatformBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
  const t = totals(30);
  const byDay = postsByDay(30);
  const top = recentPosts(null, 30)
    .sort((a, b) => b.likes + b.retweets * 2 - (a.likes + a.retweets * 2))
    .slice(0, 8);
  const li = linkedinSummary(90);

  const noData = t.posts === 0;

  return (
    <div>
      <PageHeader
        label="Analytics"
        title="Last 30 days"
        rightSlot={<LiUpload />}
      />
      <div className="px-6 py-6 max-w-6xl mx-auto">
        {/* LinkedIn analytics (from the imported xlsx export) */}
        <div className="mb-8">
          <h2 className="text-[10.5px] uppercase tracking-label text-ink-400 font-semibold mb-3">
            LinkedIn
          </h2>
          {!li.hasData ? (
            <Empty>
              No LinkedIn export imported yet. Use{" "}
              <strong className="text-ink-700">Import LinkedIn xlsx</strong> (top
              right) to load a Content analytics export.
            </Empty>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                <Stat label="Followers" value={li.totalFollowers ?? 0} />
                <Stat label="Total impressions" value={li.totalImpressions ?? 0} />
                <Stat label="Members reached" value={li.membersReached ?? 0} />
                <Stat label="Days of data" value={li.daily.length} />
              </div>
              <p className="text-[11px] text-ink-400 font-mono mb-4">
                imported {li.importedAt?.slice(0, 16) || "?"} · {li.sourceFile || ""} · followers as of {li.followersAsOf || "?"}
              </p>
              {li.topPosts.length > 0 && (
                <div className="bg-bg-surface border border-line-subtle rounded-md shadow-card overflow-hidden">
                  <table className="w-full text-[13px]">
                    <thead className="bg-bg-subtle">
                      <tr className="text-ink-500 text-[10.5px] uppercase tracking-label">
                        <th className="text-left font-semibold px-3 py-2">Date</th>
                        <th className="text-left font-semibold px-3 py-2">Post</th>
                        <th className="text-right font-semibold px-3 py-2">Impressions</th>
                        <th className="text-right font-semibold px-3 py-2">Engagements</th>
                      </tr>
                    </thead>
                    <tbody>
                      {li.topPosts.map((p) => (
                        <tr key={p.url} className="h-9 border-t border-line-subtle hover:bg-bg-subtle">
                          <td className="px-3 font-mono text-ink-500 text-[11.5px]">{p.date}</td>
                          <td className="px-3 text-ink-700 text-[12.5px] truncate max-w-md">
                            <a href={p.url} target="_blank" rel="noopener" className="hover:text-brand hover:underline">
                              {p.url.replace(/^https?:\/\/(www\.)?linkedin\.com\//, "…/")}
                            </a>
                          </td>
                          <td className="px-3 text-right font-mono">{Math.round(p.impressions)}</td>
                          <td className="px-3 text-right font-mono">{Math.round(p.engagements)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        <h2 className="text-[10.5px] uppercase tracking-label text-ink-400 font-semibold mb-3">
          X / logged posts
        </h2>
        {noData ? (
          <Empty>
            No posts logged yet. Once you publish via{" "}
            <code className="font-mono text-brand">social-post</code> the engagement
            log fills automatically.
          </Empty>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
              <Stat label="Posts" value={t.posts} />
              <Stat label="Likes" value={t.likes} />
              <Stat label="Reposts" value={t.retweets} />
              <Stat label="Replies" value={t.replies} />
              <Stat label="Views" value={t.views} />
            </div>
            <div className="bg-bg-surface border border-line-subtle rounded-md shadow-card p-4 mb-6">
              <h2 className="text-[10.5px] uppercase tracking-label text-ink-400 font-semibold mb-3">
                Posts &amp; engagement / day
              </h2>
              <AnalyticsCharts data={byDay} />
            </div>
            <h2 className="text-[10.5px] uppercase tracking-label text-ink-400 font-semibold mb-3">
              Top posts
            </h2>
            <div className="bg-bg-surface border border-line-subtle rounded-md shadow-card overflow-hidden">
              <table className="w-full text-[13px]">
                <thead className="bg-bg-subtle">
                  <tr className="text-ink-500 text-[10.5px] uppercase tracking-label">
                    <th className="text-left font-semibold px-3 py-2">Platform</th>
                    <th className="text-left font-semibold px-3 py-2">Date</th>
                    <th className="text-left font-semibold px-3 py-2">Text</th>
                    <th className="text-right font-semibold px-3 py-2">Likes</th>
                    <th className="text-right font-semibold px-3 py-2">Reposts</th>
                    <th className="text-right font-semibold px-3 py-2">Replies</th>
                  </tr>
                </thead>
                <tbody>
                  {top.map((p) => (
                    <tr key={p.platform + p.post_id} className="h-10 border-t border-line-subtle hover:bg-bg-subtle">
                      <td className="px-3"><PlatformBadge platform={p.platform} /></td>
                      <td className="px-3 font-mono text-ink-500 text-[11.5px]">
                        {p.posted_at?.slice(0, 16)}
                      </td>
                      <td className="px-3 text-ink-700 text-[12.5px] truncate max-w-md">
                        {p.url ? (
                          <a href={p.url} target="_blank" rel="noopener" className="hover:text-brand hover:underline">
                            {p.text.slice(0, 90)}
                            {p.text.length > 90 ? "…" : ""}
                          </a>
                        ) : (
                          <>{p.text.slice(0, 90)}{p.text.length > 90 ? "…" : ""}</>
                        )}
                      </td>
                      <td className="px-3 text-right font-mono">{p.likes}</td>
                      <td className="px-3 text-right font-mono">{p.retweets}</td>
                      <td className="px-3 text-right font-mono">{p.replies}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-bg-surface border border-line-subtle rounded-md shadow-card px-4 py-3">
      <div className="text-[10.5px] uppercase tracking-label text-ink-400 font-semibold">
        {label}
      </div>
      <div className="text-[1.5rem] font-semibold text-ink-900 mt-0.5 font-mono tabular-nums">
        {value}
      </div>
    </div>
  );
}
