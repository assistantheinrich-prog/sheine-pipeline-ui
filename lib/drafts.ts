import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { DRAFTS_DIR } from "./paths";

export type Draft = {
  filename: string;
  path: string;
  type?: string;
  platform: "x" | "linkedin" | string;
  status: "pending" | "approved" | "posted" | "rejected" | "draft" | string;
  scheduled_at?: string | null;
  auto_post?: boolean;
  image?: string | null;
  first_comment?: string | null;
  reply_to_id?: string | null;
  reply_to_handle?: string | null;
  quote_tweet_url?: string | null;
  source_url?: string | null;
  source_label?: string | null;
  based_on?: string | null;
  posted_at?: string | null;
  posted_url?: string | null;
  posted_id?: string | null;
  slug?: string;
  created_at?: string;
  body: string;
  raw: string;
};

export async function listDrafts(): Promise<Draft[]> {
  let entries: string[] = [];
  try {
    entries = await fs.readdir(DRAFTS_DIR);
  } catch (e) {
    return [];
  }
  const md = entries.filter(
    (f) => f.endsWith(".md") && !f.startsWith("_")
  );
  const drafts = await Promise.all(
    md.map(async (f) => {
      const full = path.join(DRAFTS_DIR, f);
      try {
        const raw = await fs.readFile(full, "utf-8");
        const fm = matter(raw);
        const d = fm.data || {};
        return {
          filename: f,
          path: full,
          type: d.type,
          platform: (d.platform || "").toLowerCase() || "?",
          status: (d.status || "pending").toLowerCase(),
          scheduled_at: d.scheduled_at || null,
          auto_post: !!d.auto_post,
          image: d.image || null,
          first_comment: d.first_comment || null,
          reply_to_id: d.reply_to_id ? String(d.reply_to_id) : null,
          reply_to_handle: d.reply_to_handle || null,
          based_on: d.based_on || null,
          posted_at: d.posted_at || null,
          posted_url: d.posted_url || null,
          posted_id: d.posted_id ? String(d.posted_id) : null,
          slug: d.slug || "",
          created_at: d.created_at || "",
          body: (fm.content || "").trim(),
          raw,
        } satisfies Draft;
      } catch {
        return null;
      }
    })
  );
  return (drafts.filter(Boolean) as Draft[]).sort((a, b) => {
    return b.filename.localeCompare(a.filename);
  });
}

export async function readDraft(filename: string): Promise<Draft | null> {
  if (filename.includes("..") || filename.includes("/")) return null;
  if (!filename.endsWith(".md")) return null;
  const full = path.join(DRAFTS_DIR, filename);
  try {
    const raw = await fs.readFile(full, "utf-8");
    const fm = matter(raw);
    const d = fm.data || {};
    return {
      filename,
      path: full,
      type: d.type,
      platform: (d.platform || "").toLowerCase() || "?",
      status: (d.status || "pending").toLowerCase(),
      scheduled_at: d.scheduled_at || null,
      auto_post: !!d.auto_post,
      image: d.image || null,
      first_comment: d.first_comment || null,
      reply_to_id: d.reply_to_id ? String(d.reply_to_id) : null,
      reply_to_handle: d.reply_to_handle || null,
      quote_tweet_url: d.quote_tweet_url || null,
      source_url: d.source_url || null,
      source_label: d.source_label || null,
      based_on: d.based_on || null,
      posted_at: d.posted_at || null,
      posted_url: d.posted_url || null,
      posted_id: d.posted_id ? String(d.posted_id) : null,
      slug: d.slug || "",
      created_at: d.created_at || "",
      body: (fm.content || "").trim(),
      raw,
    } satisfies Draft;
  } catch {
    return null;
  }
}

export async function writeDraft(
  filename: string,
  patch: {
    body?: string;
    status?: string;
    scheduled_at?: string | null;
    auto_post?: boolean;
    quote_tweet_url?: string | null;
  }
): Promise<Draft | null> {
  if (filename.includes("..") || filename.includes("/")) return null;
  if (!filename.endsWith(".md")) return null;
  const existing = await readDraft(filename);
  if (!existing) return null;
  const fm = matter(existing.raw);
  const data = { ...fm.data };
  if (patch.status !== undefined) data.status = patch.status;
  if (patch.scheduled_at !== undefined) data.scheduled_at = patch.scheduled_at;
  if (patch.auto_post !== undefined) data.auto_post = patch.auto_post;
  if (patch.quote_tweet_url !== undefined) {
    if (patch.quote_tweet_url) {
      data.quote_tweet_url = patch.quote_tweet_url;
    } else {
      delete data.quote_tweet_url;
    }
  }
  const body = patch.body !== undefined ? patch.body : fm.content;
  const out = matter.stringify(body.startsWith("\n") ? body : "\n" + body, data);
  await fs.writeFile(existing.path, out, "utf-8");
  return readDraft(filename);
}
