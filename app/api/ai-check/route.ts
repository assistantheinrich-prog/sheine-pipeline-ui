import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";

export const dynamic = "force-dynamic";

// ai-check = read-only AI-tell gate (structural detectors + Kobak vocab + banned-words.json).
// Canonical tool: ~/agent-harness/tools/ai-check/ai_check.py. Runs on Approve in composer-canvas.
const AI_CHECK_BIN = path.join(os.homedir(), "agent-harness/bin/ai-check");

export async function POST(req: NextRequest) {
  const { body } = await req.json().catch(() => ({}));
  if (typeof body !== "string" || !body.trim()) {
    return NextResponse.json({ error: "body required" }, { status: 400 });
  }
  return new Promise<NextResponse>((resolve) => {
    const c = spawn(AI_CHECK_BIN, ["-", "--json"], {
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
    });
    let out = "";
    let err = "";
    const t = setTimeout(() => {
      c.kill("SIGTERM");
      err += "\n[timeout]";
    }, 15_000);
    c.stdout.on("data", (b) => (out += b));
    c.stderr.on("data", (b) => (err += b));
    c.on("close", () => {
      clearTimeout(t);
      try {
        resolve(NextResponse.json(JSON.parse(out)));
      } catch {
        resolve(NextResponse.json({ error: err.trim() || "ai-check failed" }, { status: 500 }));
      }
    });
    c.on("error", (e) => {
      clearTimeout(t);
      resolve(NextResponse.json({ error: String(e) }, { status: 500 }));
    });
    c.stdin.write(body);
    c.stdin.end();
  });
}
