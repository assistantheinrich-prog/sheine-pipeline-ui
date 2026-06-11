import { NextResponse } from "next/server";
import { listDrafts } from "@/lib/drafts";
import { linkedinSummary } from "@/lib/linkedin";
import { recentPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

// Compact weekly numbers for the Sunday metrics digest to read (one GET).
// Consistency is the headline metric (the ~23x finding): posts shipped vs
// planned, queue depth, and the latest follower/impression counts.
export async function GET() {
  const drafts = await listDrafts();
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 3600 * 1000;
  const weekAhead = now + 7 * 24 * 3600 * 1000;

  const inWindow = (iso: string | null | undefined, lo: number, hi: number) => {
    if (!iso) return false;
    const t = Date.parse(iso);
    return Number.isFinite(t) && t >= lo && t <= hi;
  };

  const queueApproved = drafts.filter((d) => d.status === "approved").length;
  const readyForReview = drafts.filter((d) => d.status === "ready").length;
  const pending = drafts.filter((d) => d.status === "pending").length;
  const shippedDrafts7d = drafts.filter(
    (d) => d.status === "posted" && inWindow(d.posted_at, weekAgo, now)
  ).length;
  const scheduledNext7d = drafts.filter(
    (d) =>
      d.status !== "posted" &&
      d.status !== "rejected" &&
      inWindow(d.scheduled_at, now, weekAhead)
  ).length;

  // X posts logged to the engagement DB in the last 7 days. NOT added to
  // posts_shipped_7d — a draft fired via the loop is BOTH a status=posted draft
  // AND an engagement row, so summing double-counts. `status=posted` drafts are
  // the single source of truth for shipped (covers X + LinkedIn); this is an
  // informational cross-check only.
  const xPostsLogged7d = recentPosts("x", 7).length;

  const li = linkedinSummary(7);

  return NextResponse.json({
    generated_at: new Date(now).toISOString(),
    consistency: {
      posts_shipped_7d: shippedDrafts7d,
      x_posts_logged_7d: xPostsLogged7d,
      scheduled_next_7d: scheduledNext7d,
      target_min_per_week: 3,
    },
    queue: {
      approved: queueApproved,
      ready_for_review: readyForReview,
      pending,
      low_queue_alert: queueApproved < 3 || scheduledNext7d === 0,
    },
    linkedin: {
      followers: li.totalFollowers,
      total_impressions: li.totalImpressions,
      members_reached: li.membersReached,
      as_of: li.followersAsOf,
      last_import: li.importedAt,
    },
    // Substack subscriber count is not tracked in this DB yet; field is here so
    // the Sunday digest has a stable shape to fill once a source is wired.
    subscriber_count: null,
  });
}
