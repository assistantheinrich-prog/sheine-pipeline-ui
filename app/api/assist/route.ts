import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";

export const dynamic = "force-dynamic";
export const maxDuration = 240;

const PRESETS: Record<string, string> = {
  punchier: "Make this draft punchier without changing the meaning. Keep ≤ 280 chars for X / under 250 words for LinkedIn. No emojis. No banned AI words (delve/leverage/navigate/robust/seamless/tapestry/intricate/dive into/unlock/game-changer/supercharged). First-person practitioner POV. Output ONLY the rewritten draft, nothing else.",
  shorter: "Shorten this draft to roughly half the length while preserving the strongest single point. Keep voice (no emojis, no AI tells, first-person practitioner). Output ONLY the rewritten draft, nothing else.",
  longer: "Expand this draft with one additional concrete detail (specific regulator name, rule reference, or implementation consequence). Keep ≤ 280 chars for X / under 280 words for LinkedIn. Voice rules: no emojis, no AI tells, first-person practitioner. Output ONLY the rewritten draft, nothing else.",
  variants: "Produce 3 variants of this draft. Each must take a different angle (e.g., one focused on the regulator, one on the firm-side implication, one as a question worth pondering). Voice rules: no emojis, no AI tells, first-person practitioner. Format: each variant on its own, separated by exactly the line `---` (3 dashes). No preamble or numbering — just the variants and the separators.",
  voicelint: "Review this draft against the voice rules: no emojis, no AI tells (delve/leverage/navigate/robust/seamless/tapestry/intricate/dive into/unlock/game-changer/supercharged), first-person practitioner POV, concrete regulator names, no closing CTAs, no markdown tables. Output a short bullet list of issues found, or 'Voice clean.' if there are none. Output ONLY the bullet list or 'Voice clean.', no preamble.",
};

export async function POST(req: NextRequest) {
  const { preset, body, platform, instruction } = await req.json().catch(() => ({}));

  let promptInstruction: string;
  if (preset && PRESETS[preset]) {
    promptInstruction = PRESETS[preset];
  } else if (typeof instruction === "string" && instruction.trim()) {
    promptInstruction = instruction.trim() + "\n\nVoice rules: no emojis, no AI tells, first-person practitioner POV. Output ONLY the rewritten draft, no preamble.";
  } else {
    return NextResponse.json({ error: "preset or instruction required" }, { status: 400 });
  }

  const prompt = `You are editing a social media draft for Sebastian Heine, founder of sheine.ai (crypto compliance consultancy).

Platform: ${platform || "x"}

Current draft:
"""
${body || "(empty)"}
"""

Task:
${promptInstruction}`;

  return new Promise<Response>((resolve) => {
    const child = spawn("claude", ["-p", prompt, "--model", "sonnet", "--no-session-persistence"], {
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
    });
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
        resolve(
          NextResponse.json({ error: stderr || `exit ${code}` }, { status: 500 })
        );
        return;
      }
      const out = stdout.trim();
      if (preset === "variants") {
        const variants = out
          .split(/\n\s*---\s*\n/)
          .map((s) => s.trim())
          .filter(Boolean);
        resolve(NextResponse.json({ variants }));
      } else {
        resolve(NextResponse.json({ output: out }));
      }
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve(NextResponse.json({ error: String(err) }, { status: 500 }));
    });
  });
}
