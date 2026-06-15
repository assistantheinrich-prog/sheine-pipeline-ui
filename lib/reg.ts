import fs from "node:fs";
import Database from "better-sqlite3";
import { AGENCY_DB } from "./paths";

// Read-only view of the regulatory-scanner's output (agency.db). This is the
// "performer lane" idea source — a regulatory development becomes a draft in one
// click. We never write to agency.db (the scanner owns it); "already drafted" is
// tracked by matching a hit's source_url against existing drafts.

export type RegHit = {
  id: number;
  jurisdiction: string;
  regulator: string;
  title: string;
  summary: string;
  source_url: string;
  significance: string;
  doc_type: string;
  topic_tags: string;
  published_at: string | null;
  detected_at: string | null;
};

// Crypto/compliance relevance — the scanner covers 59 regulators incl. plenty of
// off-topic items, so we keep only hits whose tags/title/summary touch our space.
const RELEVANT = [
  "crypto", "virtual asset", "vasp", "stablecoin", "defi", "aml", "cft", "kyc",
  "licens", "custody", "travel rule", "mica", "sanction", "tokeni", "digital asset",
  "payment", "wallet", "exchange", "fatf",
];

function open(): Database.Database | null {
  try {
    if (!fs.existsSync(AGENCY_DB)) return null;
    return new Database(AGENCY_DB, { readonly: true, fileMustExist: true });
  } catch {
    return null;
  }
}

const COLS =
  "id, jurisdiction, regulator, title, IFNULL(summary,'') summary, " +
  "IFNULL(source_url,'') source_url, IFNULL(significance,'') significance, " +
  "IFNULL(doc_type,'') doc_type, IFNULL(topic_tags,'') topic_tags, " +
  "published_at, COALESCE(detected_at, ingested_at) detected_at";

export function regHits(limit = 30, excludeUrls: Set<string> = new Set()): RegHit[] {
  const db = open();
  if (!db) return [];
  try {
    const like = RELEVANT.map(
      () => "LOWER(IFNULL(topic_tags,'')||' '||IFNULL(title,'')||' '||IFNULL(summary,'')) LIKE ?"
    ).join(" OR ");
    const sql =
      `SELECT ${COLS} FROM regulatory_items ` +
      `WHERE significance IN ('high','medium') AND IFNULL(used_in_content,0)=0 ` +
      `AND (${like}) ` +
      `ORDER BY COALESCE(detected_at, ingested_at) DESC LIMIT ?`;
    const params = [...RELEVANT.map((t) => `%${t}%`), limit * 3];
    const rows = db.prepare(sql).all(...params) as RegHit[];
    return rows.filter((r) => r.source_url && !excludeUrls.has(r.source_url)).slice(0, limit);
  } catch {
    return [];
  } finally {
    try {
      db.close();
    } catch {
      /* ignore */
    }
  }
}

export function regHit(id: number): RegHit | null {
  const db = open();
  if (!db) return null;
  try {
    return (db.prepare(`SELECT ${COLS} FROM regulatory_items WHERE id = ?`).get(id) as RegHit) || null;
  } catch {
    return null;
  } finally {
    try {
      db.close();
    } catch {
      /* ignore */
    }
  }
}
