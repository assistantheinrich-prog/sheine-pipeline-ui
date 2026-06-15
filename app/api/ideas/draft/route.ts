import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { regHit } from "@/lib/reg";
import { DRAFTS_DIR } from "@/lib/paths";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function callClaude(prompt: string, timeout = 90_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const c = spawn("claude", ["-p", prompt, "--model", "sonnet", "--no-session-persistence"], {
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
    });
    let out = "";
    let err = "";
    const t = setTimeout(() => {
      c.kill("SIGTERM");
      err += "\n[timeout]";
    }, timeout);
    c.stdout.on("data", (b) => (out += b));
    c.stderr.on("data", (b) => (err += b));
    c.on("close", (code) => {
      clearTimeout(t);
      code === 0 ? resolve(out) : reject(new Error(err || `exit ${code}`));
    });
    c.on("error", (e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 50) || "reg-draft"
  );
}

// Generate ONE LinkedIn draft from a regulatory-scanner hit (the performer lane,
// ~30-min-turnaround clarity post). Lands as status:pending in the queue, then
// flows through the eval gates + Telegram approval like any other draft.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const hit = regHit(id);
  if (!hit) return NextResponse.json({ error: "reg hit not found" }, { status: 404 });

  const prompt = `You are Sebastian Heine, founder of sheine.ai (crypto compliance for VASPs), writing a LinkedIn post for an audience of VASP founders and compliance leads.

A regulatory development just landed:
- Regulator: ${hit.regulator} (${hit.jurisdiction})
- Type: ${hit.doc_type} · significance ${hit.significance}
- Title: ${hit.title}
- Summary: ${hit.summary}
- Source: ${hit.source_url}

Write ONE LinkedIn post (a clarity / "what this actually means for compliance teams" angle, NOT a press-release rehash). Rules:
- Lead with the punchline (what changed and who must act), then the operator takeaway.
- Name at least TWO concrete entities (the regulator plus a firm, standard, or jurisdiction).
- First-person practitioner POV. No emojis. No hashtags.
- FORBIDDEN AI tells: no "not X but Y" / "it's not X, it's Y" negation-reframe; no em-dash chaining; no "delve/landscape/moreover/crucial/comprehensive/navigate/foster"; no hedging ("it could be argued", "arguably"); no "additionally/furthermore".
- ~150-200 words. End with a concrete implication, not a CTA.
Output ONLY the post text, no preamble, no quotes.`;

  let post: string;
  try {
    post = (await callClaude(prompt)).trim();
    if ((post.startsWith('"') && post.endsWith('"')) || (post.startsWith("'") && post.endsWith("'"))) {
      post = post.slice(1, -1).trim();
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
  if (!post) return NextResponse.json({ error: "empty generation" }, { status: 500 });

  const today = new Date().toISOString().slice(0, 10);
  const slug = slugify(`${hit.regulator}-${hit.title}`);
  let filename = `${today}-${slug}-linkedin.md`;
  let full = path.join(DRAFTS_DIR, filename);
  let n = 2;
  while (true) {
    try {
      await fs.access(full);
      filename = `${today}-${slug}-${n}-linkedin.md`;
      full = path.join(DRAFTS_DIR, filename);
      n += 1;
    } catch {
      break;
    }
  }

  const based = `${hit.regulator} ${hit.jurisdiction}: ${hit.title}`.replace(/"/g, "'").slice(0, 160);
  const content =
    `---\ntype: social-draft\nplatform: linkedin\nstatus: pending\nscheduled_at:\nauto_post: false\n` +
    `created_at: ${today}\nslug: ${slug}\nbased_on: "${based}"\nsource_url: ${hit.source_url}\n---\n\n${post}\n`;
  await fs.mkdir(DRAFTS_DIR, { recursive: true });
  await fs.writeFile(full, content, "utf-8");

  return NextResponse.json({ filename, based_on: based });
}
