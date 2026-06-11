import fs from "node:fs";
import Database from "better-sqlite3";
import { POSTS_DB } from "./paths";

// Readers for the LinkedIn analytics tables (li_*) populated by
// social-analytics-ingest. All readers are defensive: if the xlsx has never
// been imported the tables won't exist, so every query is wrapped and returns
// an empty/zero shape rather than throwing.

export type LiDaily = { date: string; impressions: number; engagements: number };
export type LiTopPost = { url: string; date: string; impressions: number; engagements: number };
export type LiSummary = {
  hasData: boolean;
  totalFollowers: number | null;
  totalImpressions: number | null;
  membersReached: number | null;
  followersAsOf: string | null;
  importedAt: string | null;
  sourceFile: string | null;
  daily: LiDaily[];
  topPosts: LiTopPost[];
};

function open(): Database.Database | null {
  try {
    if (!fs.existsSync(POSTS_DB)) return null;
    return new Database(POSTS_DB, { readonly: true, fileMustExist: true });
  } catch {
    return null;
  }
}

function meta(db: Database.Database): Record<string, string> {
  try {
    const rows = db.prepare("SELECT key, value FROM li_meta").all() as {
      key: string;
      value: string;
    }[];
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch {
    return {};
  }
}

function num(v: string | undefined): number | null {
  if (v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function linkedinSummary(days = 90): LiSummary {
  const db = open();
  const empty: LiSummary = {
    hasData: false,
    totalFollowers: null,
    totalImpressions: null,
    membersReached: null,
    followersAsOf: null,
    importedAt: null,
    sourceFile: null,
    daily: [],
    topPosts: [],
  };
  if (!db) return empty;
  try {
    const m = meta(db);
    let daily: LiDaily[] = [];
    try {
      daily = db
        .prepare(
          "SELECT date, IFNULL(impressions,0) impressions, IFNULL(engagements,0) engagements " +
            "FROM li_daily ORDER BY date DESC LIMIT ?"
        )
        .all(days) as LiDaily[];
      daily.reverse();
    } catch {
      return empty;
    }
    let topPosts: LiTopPost[] = [];
    try {
      topPosts = db
        .prepare(
          "SELECT url, IFNULL(date,'') date, IFNULL(impressions,0) impressions, IFNULL(engagements,0) engagements " +
            "FROM li_top_posts ORDER BY impressions DESC LIMIT 10"
        )
        .all() as LiTopPost[];
    } catch {
      /* no top posts */
    }
    if (daily.length === 0 && Object.keys(m).length === 0) return empty;
    return {
      hasData: true,
      totalFollowers: num(m.total_followers),
      totalImpressions: num(m.total_impressions),
      membersReached: num(m.members_reached),
      followersAsOf: m.followers_as_of || null,
      importedAt: m.imported_at || null,
      sourceFile: m.source_file || null,
      daily,
      topPosts,
    };
  } finally {
    db.close();
  }
}
