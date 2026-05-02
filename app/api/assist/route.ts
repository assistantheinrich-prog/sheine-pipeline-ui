import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";

export const dynamic = "force-dynamic";
export const maxDuration = 240;

const HUMANIZE_BIN = path.join(os.homedir(), "agent-harness/bin/humanize");

function callClaude(prompt: string, timeout = 200_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const c = spawn("claude", ["-p", prompt, "--model", "sonnet", "--no-session-persistence"], {
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
    });
    let out = "";
    let err = "";
    const t = setTimeout(() => { c.kill("SIGTERM"); err += "\n[timeout]"; }, timeout);
    c.stdout.on("data", (b) => (out += b));
    c.stderr.on("data", (b) => (err += b));
    c.on("close", (code) => { clearTimeout(t); code === 0 ? resolve(out) : reject(new Error(err || `exit ${code}`)); });
    c.on("error", (e) => { clearTimeout(t); reject(e); });
  });
}

function humanizeFlags(text: string): Promise<{ result: string; flags: string[] }> {
  return new Promise((resolve) => {
    const c = spawn(HUMANIZE_BIN, [], { env: { ...process.env, NODE_NO_WARNINGS: "1" } });
    let out = "";
    c.stdout.on("data", (b) => (out += b));
    c.on("close", () => {
      const flags: string[] = [];
      const flagRe = /^\s*(?:⚠️|❌|⚡|💡|⚠ )\s*(.+)$/gmu;
      let m: RegExpExecArray | null;
      while ((m = flagRe.exec(out)) !== null) {
        flags.push(m[1].trim());
      }
      const resMatch = out.match(/─── Result ─+\s*\n([\s\S]*?)$/);
      const result = resMatch ? resMatch[1].trim() : text;
      resolve({ result, flags });
    });
    c.on("error", () => resolve({ result: text, flags: [] }));
    c.stdin.write(text);
    c.stdin.end();
  });
}

const PRESETS: Record<string, string> = {
  humanize: `Make this read like a human wrote it, not an AI. Apply Sebastian's voice rules + Dickie Bush's read-aloud test:

- READ-ALOUD TEST. Every sentence should be speakable in one breath. If you stumble or run out of breath, the sentence is too long or too jargon-heavy. Break it up.
- WRITE LIKE YOU TALK. Contractions are fine. Sentence fragments are fine. The cadence of speech, not the cadence of academic writing.
- LEAD WITH THE PUNCHLINE. First sentence is the takeaway, not a setup.
- BEHIND-THE-CURTAIN POV. Sebastian writes as a CCO who has implemented this stuff. Frame insights as "what this actually means for compliance teams" — not commentary.
- NO BS. Cut hedging language ("it could be argued", "it's worth noting", "many would say"). Just say it.
ABSOLUTELY FORBIDDEN — these are AI tells, the python humanizer flags them:
- "It's not X. It's Y" / "It is not X. It is Y" / "Not X. It's Y" — cross-sentence negation reframe. State the positive directly without the negation setup. (BAD: "Treasury isn't monitoring. It's offloading enforcement." GOOD: "Treasury is offloading enforcement risk onto issuers.")
- "It isn't X, it's Y" / "It's not X, it's Y" — same family in one sentence.
- "Not X, not Y, but Z" — triadic AI cadence.
- "Not only X but also Y" — same family.
- Em-dash chaining (>2 per post is suspicious).
- Passive voice ("is being drafted", "are being asked") — flip to active.

BANNED words (any form/tense): delve, navigate, leverage, foster, moreover, crucial, comprehensive, synergy, multifaceted, pivotal, nuanced, paradigm, unlock, revolutionize, game-changer, ecosystem, seamless, robust, transformative, innovative, empower, streamline, holistic, tapestry, intricate, dive into, supercharged.

BANNED hedges: "it's worth noting", "it goes without saying", "at the end of the day", "I think", "perhaps", "arguably", "in many ways".

BANNED transitions: "in order to", "the fact that", "as a result", "ultimately".

Vague superlatives to remove: "significant", "substantial", "various".

NO emojis.
Length: ≤ 280 chars for X / under 250 words for LinkedIn.

Output ONLY the rewritten draft, nothing else. No preamble, no quotes around the result.`,
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

  try {
    let out = (await callClaude(prompt)).trim();

    // Strip surrounding quotes if Claude wrapped despite instructions.
    if ((out.startsWith('"') && out.endsWith('"')) || (out.startsWith("'") && out.endsWith("'"))) {
      out = out.slice(1, -1).trim();
    }

    if (preset === "variants") {
      const variants = out.split(/\n\s*---\s*\n/).map((s) => s.trim()).filter(Boolean);
      return NextResponse.json({ variants });
    }

    // Humanize: feedback loop with the python humanizer. After the LLM rewrite,
    // run humanize.py for flags. If any persist, do one more LLM pass with the
    // flags as explicit constraints. Up to 1 retry.
    if (preset === "humanize") {
      const { flags: flags1 } = await humanizeFlags(out);
      let final = out;
      const flagsApplied: string[] = flags1;
      if (flags1.length > 0) {
        const constraints = flags1.map((f) => `- ${f}`).join("\n");
        const retryPrompt = `${prompt}\n\nThe rewrite above still contains these AI tells. Fix them ALL:\n${constraints}\n\nThe current rewrite is:\n"""\n${out}\n"""\n\nOutput ONLY the corrected rewrite. Same length cap.`;
        try {
          let retry = (await callClaude(retryPrompt)).trim();
          if ((retry.startsWith('"') && retry.endsWith('"'))) retry = retry.slice(1, -1).trim();
          if (retry) final = retry;
        } catch (e) {
          // keep `out` if retry fails
        }
        const second = await humanizeFlags(final);
        return NextResponse.json({
          output: final,
          remaining_flags: second.flags,
          first_pass_flags: flagsApplied,
        });
      }
      return NextResponse.json({ output: final, remaining_flags: [], first_pass_flags: [] });
    }

    return NextResponse.json({ output: out });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
