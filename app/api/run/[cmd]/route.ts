import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import path from "node:path";
import os from "node:os";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // seconds

// Whitelist of commands callable from the UI. Each maps to an absolute
// path under ~/agent-harness/bin. Anything not in this map is rejected.
const ALLOWED: Record<string, { bin: string; argv?: string[]; timeoutMs: number }> = {
  "research-run": {
    bin: path.join(os.homedir(), "agent-harness/bin/research-run"),
    argv: ["--no-enrich"],
    timeoutMs: 180_000,
  },
  "research-draft": {
    bin: path.join(os.homedir(), "agent-harness/bin/research-draft"),
    timeoutMs: 240_000,
  },
  "social-due": {
    bin: path.join(os.homedir(), "agent-harness/bin/social-due"),
    argv: ["--dry-run"],
    timeoutMs: 30_000,
  },
  "refresh-gmail-snapshot": {
    bin: path.join(os.homedir(), "agent-harness/bin/refresh-gmail-snapshot"),
    timeoutMs: 240_000,
  },
  "x-digest": {
    bin: path.join(os.homedir(), "agent-harness/bin/x-digest"),
    timeoutMs: 180_000,
  },
};

function runCmd(cmd: string): Promise<{ ok: boolean; stdout: string; stderr: string; code: number | null }> {
  const conf = ALLOWED[cmd];
  if (!conf) {
    return Promise.resolve({ ok: false, stdout: "", stderr: `unknown command: ${cmd}`, code: -1 });
  }
  return new Promise((resolve) => {
    const child = spawn(conf.bin, conf.argv || [], {
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
      cwd: os.homedir(),
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      stderr += `\n[timeout after ${conf.timeoutMs}ms]`;
    }, conf.timeoutMs);
    child.stdout.on("data", (b) => (stdout += b.toString()));
    child.stderr.on("data", (b) => (stderr += b.toString()));
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0, stdout, stderr, code });
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ ok: false, stdout, stderr: stderr + String(err), code: -1 });
    });
  });
}

export async function POST(_req: NextRequest, ctx: { params: { cmd: string } }) {
  const result = await runCmd(ctx.params.cmd);
  return NextResponse.json(result);
}
