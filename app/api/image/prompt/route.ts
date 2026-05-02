import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";

export const dynamic = "force-dynamic";
export const maxDuration = 240;

export async function POST(req: NextRequest) {
  const { body, platform } = await req.json().catch(() => ({}));
  if (!body || typeof body !== "string" || !body.trim()) {
    return NextResponse.json({ error: "body required" }, { status: 400 });
  }
  const prompt = `You are crafting an image prompt to accompany a ${platform || "social"} post.

The post:
"""
${body}
"""

Draft a single, concrete, visual prompt for an AI image generator (Imagen, DALL-E, Midjourney). The image should illustrate the post's central idea without being on-the-nose.

Hard rules:
- One paragraph, no preamble, no numbered alternatives.
- Specify subject, setting, lighting, composition, and color palette.
- Editorial / institutional aesthetic — not consumer-AI glossy. Think Financial Times, The Atlantic, Linear marketing imagery.
- No text in the image (avoid "with text saying...").
- No stock-photo cliches (no diverse-team-handshaking, no glowing circuit boards, no "AI brain" visualizations).
- Aspect ratio: 1:1 (square) for both X and LinkedIn.

Output ONLY the prompt paragraph. No quotation marks, no labels.`;

  return new Promise<Response>((resolve) => {
    const child = spawn(
      "claude",
      ["-p", prompt, "--model", "sonnet", "--no-session-persistence"],
      { env: { ...process.env, NODE_NO_WARNINGS: "1" } }
    );
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      stderr += "\n[timeout]";
    }, 200_000);
    child.stdout.on("data", (b) => (stdout += b.toString()));
    child.stderr.on("data", (b) => (stderr += b.toString()));
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        resolve(NextResponse.json({ error: stderr || `exit ${code}` }, { status: 500 }));
        return;
      }
      resolve(NextResponse.json({ prompt: stdout.trim() }));
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve(NextResponse.json({ error: String(err) }, { status: 500 }));
    });
  });
}
