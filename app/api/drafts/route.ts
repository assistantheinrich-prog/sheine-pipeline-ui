import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { listDrafts } from "@/lib/drafts";
import { DRAFTS_DIR } from "@/lib/paths";

export const dynamic = "force-dynamic";

export async function GET() {
  const drafts = await listDrafts();
  return NextResponse.json({ drafts });
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "draft";
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const platform = String(body.platform || "").toLowerCase();
  if (platform !== "x" && platform !== "linkedin") {
    return NextResponse.json(
      { error: "platform must be 'x' or 'linkedin'" },
      { status: 400 }
    );
  }
  const slugInput = String(body.slug || "draft");
  const slug = slugify(slugInput);
  const today = new Date().toISOString().slice(0, 10);
  let filename = `${today}-${slug}-${platform}.md`;
  let full = path.join(DRAFTS_DIR, filename);
  // de-dupe
  let n = 2;
  while (true) {
    try {
      await fs.access(full);
      filename = `${today}-${slug}-${n}-${platform}.md`;
      full = path.join(DRAFTS_DIR, filename);
      n += 1;
    } catch {
      break;
    }
  }
  const content = `---\ntype: social-draft\nplatform: ${platform}\nstatus: pending\nscheduled_at:\nauto_post: false\ncreated_at: ${today}\nslug: ${slug}\n---\n\n${
    platform === "x"
      ? "<!-- write your X post here. ≤ 280 chars. -->"
      : "<!-- write your LinkedIn post here. -->"
  }\n`;
  await fs.mkdir(DRAFTS_DIR, { recursive: true });
  await fs.writeFile(full, content, "utf-8");
  return NextResponse.json({ filename, path: full }, { status: 201 });
}
