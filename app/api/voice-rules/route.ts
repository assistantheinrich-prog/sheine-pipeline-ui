import { NextResponse } from "next/server";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const dynamic = "force-dynamic";

const BANNED_JSON_PATH = path.join(os.homedir(), "agent-harness/tools/humanize/banned-words.json");

export async function GET() {
  try {
    const raw = fs.readFileSync(BANNED_JSON_PATH, "utf-8");
    const doc = JSON.parse(raw);
    return NextResponse.json(doc);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
