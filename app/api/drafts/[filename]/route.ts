import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import matter from "gray-matter";
import { readDraft, writeDraft } from "@/lib/drafts";
import { runGates } from "@/lib/gates";

export const dynamic = "force-dynamic";

const TG_SEND_BIN = path.join(os.homedir(), "agent-harness/bin/social-tg-send");
const APPROVE_CLI = path.join(
  os.homedir(),
  "agent-harness/tools/social-pipeline/telegram/approve.py"
);

function runBin(bin: string, args: string[]): Promise<{ ok: boolean; detail: string }> {
  return new Promise((resolve) => {
    const c = spawn(bin, args, {
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
      cwd: os.homedir(),
    });
    let out = "";
    let err = "";
    const t = setTimeout(() => c.kill("SIGTERM"), 30_000);
    c.stdout.on("data", (b) => (out += b.toString()));
    c.stderr.on("data", (b) => (err += b.toString()));
    c.on("close", (code) => {
      clearTimeout(t);
      resolve({ ok: code === 0, detail: (out || err).trim() });
    });
    c.on("error", (e) => {
      clearTimeout(t);
      resolve({ ok: false, detail: String(e) });
    });
  });
}

const sendToTelegram = (filename: string) => runBin(TG_SEND_BIN, [filename]);

// Draft mutation for approve lives in ONE place — approve.py apply — so the
// dashboard gets the same auto-scheduling (next open weekday slot, stale-slot
// refresh) as a Telegram-card tap.
const applyApprove = (filename: string) =>
  runBin("python3", [APPROVE_CLI, "apply", "appr", filename]);

export async function GET(_req: NextRequest, ctx: { params: { filename: string } }) {
  const draft = await readDraft(ctx.params.filename);
  if (!draft) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ draft });
}

export async function PATCH(req: NextRequest, ctx: { params: { filename: string } }) {
  const body = await req.json().catch(() => ({}));
  const nextStatus = typeof body.status === "string" ? body.status : undefined;

  // The `ready` transition is the gated handoff to Telegram approval. Run the
  // blocking eval gates against the would-be final state; a failing draft is
  // refused (422) and never reaches `ready`/Telegram.
  if (nextStatus === "ready") {
    const existing = await readDraft(ctx.params.filename);
    if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
    const finalBody = typeof body.body === "string" ? body.body : existing.body;
    const allowNoVisual = !!(matter(existing.raw).data?.allow_no_visual);
    const gate = runGates({
      body: finalBody,
      platform: existing.platform,
      image: existing.image,
      allow_no_visual: allowNoVisual,
    });
    if (!gate.ok) {
      return NextResponse.json(
        { error: "gates failed", gate, blocked: true },
        { status: 422 }
      );
    }
    const updated = await writeDraft(ctx.params.filename, {
      body: typeof body.body === "string" ? body.body : undefined,
      status: "ready",
    });
    if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
    const telegram = await sendToTelegram(ctx.params.filename);
    return NextResponse.json({ draft: updated, gate, telegram });
  }

  // `approved` is the arming transition (X drafts with auto_post become live
  // ammunition for social-due) — gate it exactly like `ready`, then delegate
  // the status+schedule mutation to approve.py apply so dashboard approval and
  // Telegram-tap approval behave identically.
  if (nextStatus === "approved") {
    const existing = await readDraft(ctx.params.filename);
    if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
    const finalBody = typeof body.body === "string" ? body.body : existing.body;
    const allowNoVisual = !!(matter(existing.raw).data?.allow_no_visual);
    const gate = runGates({
      body: finalBody,
      platform: existing.platform,
      image: existing.image,
      allow_no_visual: allowNoVisual,
    });
    if (!gate.ok) {
      return NextResponse.json(
        { error: "gates failed", gate, blocked: true },
        { status: 422 }
      );
    }
    // Persist any edits (body / schedule / flags) BEFORE apply so it schedules
    // against the final state.
    await writeDraft(ctx.params.filename, {
      body: typeof body.body === "string" ? body.body : undefined,
      scheduled_at: body.scheduled_at === undefined ? undefined : body.scheduled_at,
      auto_post: typeof body.auto_post === "boolean" ? body.auto_post : undefined,
      quote_tweet_url: body.quote_tweet_url === undefined ? undefined : body.quote_tweet_url,
    });
    const apply = await applyApprove(ctx.params.filename);
    if (!apply.ok) {
      return NextResponse.json(
        { error: "approve failed", detail: apply.detail },
        { status: 500 }
      );
    }
    const updated = await readDraft(ctx.params.filename);
    return NextResponse.json({ draft: updated, gate, apply: apply.detail });
  }

  const updated = await writeDraft(ctx.params.filename, {
    body: typeof body.body === "string" ? body.body : undefined,
    status: nextStatus,
    scheduled_at: body.scheduled_at === undefined ? undefined : body.scheduled_at,
    auto_post: typeof body.auto_post === "boolean" ? body.auto_post : undefined,
    quote_tweet_url: body.quote_tweet_url === undefined ? undefined : body.quote_tweet_url,
  });
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ draft: updated });
}
