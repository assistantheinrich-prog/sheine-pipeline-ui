import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const INGEST_BIN = path.join(os.homedir(), "agent-harness/bin/social-analytics-ingest");

function ingest(xlsxPath: string): Promise<{ ok: boolean; out: string }> {
  return new Promise((resolve) => {
    const c = spawn(INGEST_BIN, [xlsxPath], {
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
      cwd: os.homedir(),
    });
    let out = "";
    let err = "";
    const t = setTimeout(() => c.kill("SIGTERM"), 110_000);
    c.stdout.on("data", (b) => (out += b.toString()));
    c.stderr.on("data", (b) => (err += b.toString()));
    c.on("close", (code) => {
      clearTimeout(t);
      resolve({ ok: code === 0, out: out.trim() || err.trim() });
    });
    c.on("error", (e) => {
      clearTimeout(t);
      resolve({ ok: false, out: String(e) });
    });
  });
}

// Accept a LinkedIn analytics .xlsx upload, parse it into social-posts.sqlite.
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "no file uploaded (field 'file')" }, { status: 400 });
  }
  const name = (file as File).name || "upload.xlsx";
  if (!/\.xlsx$/i.test(name)) {
    return NextResponse.json({ error: "expected a .xlsx file" }, { status: 400 });
  }
  const buf = Buffer.from(await (file as File).arrayBuffer());
  const tmp = path.join(os.tmpdir(), `li-analytics-${Date.now()}.xlsx`);
  await fs.writeFile(tmp, buf);
  try {
    const res = await ingest(tmp);
    let parsed: any = null;
    try {
      parsed = JSON.parse(res.out);
    } catch {
      /* fall through */
    }
    if (!res.ok || !parsed?.ok) {
      return NextResponse.json(
        { error: "ingest failed", detail: parsed?.error || res.out },
        { status: 500 }
      );
    }
    return NextResponse.json({ result: parsed });
  } finally {
    await fs.rm(tmp, { force: true }).catch(() => {});
  }
}
