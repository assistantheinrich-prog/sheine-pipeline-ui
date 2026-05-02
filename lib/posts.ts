import fs from "node:fs";
import Database from "better-sqlite3";
import { POSTS_DB } from "./paths";

export type PostRow = {
  platform: string;
  post_id: string;
  url: string | null;
  text: string;
  posted_at: string;
  likes: number;
  retweets: number;
  replies: number;
  views: number;
  measured_at: string | null;
};

export type DayBucket = {
  date: string;
  posts: number;
  likes: number;
  retweets: number;
  replies: number;
};

function open(): Database.Database | null {
  try {
    if (!fs.existsSync(POSTS_DB)) return null;
    return new Database(POSTS_DB, { readonly: true, fileMustExist: true });
  } catch {
    return null;
  }
}

export function recentPosts(platform: string | null, days: number): PostRow[] {
  const db = open();
  if (!db) return [];
  const since = `-${Math.max(1, days)} days`;
  let sql = `
    SELECT p.platform, p.post_id, p.url, p.text, p.posted_at,
           IFNULL(e.likes, 0) AS likes,
           IFNULL(e.retweets, 0) AS retweets,
           IFNULL(e.replies, 0) AS replies,
           IFNULL(e.views, 0) AS views,
           e.measured_at
    FROM posts p
    LEFT JOIN engagement e ON e.platform = p.platform AND e.post_id = p.post_id
      AND e.measured_at = (
        SELECT MAX(measured_at) FROM engagement
        WHERE platform = p.platform AND post_id = p.post_id
      )
    WHERE datetime(p.posted_at) >= datetime('now', ?)
  `;
  const params: any[] = [since];
  if (platform) {
    sql += " AND p.platform = ?";
    params.push(platform);
  }
  sql += " ORDER BY p.posted_at DESC";
  try {
    return db.prepare(sql).all(...params) as PostRow[];
  } catch {
    return [];
  } finally {
    db.close();
  }
}

export function postsByDay(days: number): DayBucket[] {
  const all = recentPosts(null, days);
  const map: Record<string, DayBucket> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map[key] = { date: key, posts: 0, likes: 0, retweets: 0, replies: 0 };
  }
  for (const r of all) {
    const day = (r.posted_at || "").slice(0, 10);
    if (!map[day]) continue;
    map[day].posts += 1;
    map[day].likes += r.likes || 0;
    map[day].retweets += r.retweets || 0;
    map[day].replies += r.replies || 0;
  }
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}

export function totals(days: number): { posts: number; likes: number; retweets: number; replies: number; views: number } {
  const rows = recentPosts(null, days);
  return {
    posts: rows.length,
    likes: rows.reduce((s, r) => s + (r.likes || 0), 0),
    retweets: rows.reduce((s, r) => s + (r.retweets || 0), 0),
    replies: rows.reduce((s, r) => s + (r.replies || 0), 0),
    views: rows.reduce((s, r) => s + (r.views || 0), 0),
  };
}
