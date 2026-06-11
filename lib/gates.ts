import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Draft } from "./drafts";

// Blocking eval gates run on the `ready` transition (draft -> Telegram approval).
// A draft that fails any gate cannot reach `ready`, so it never pings Telegram.
// These are deterministic (no LLM) so the gate is fast and reproducible — the
// advisory voicelint preset in /api/assist stays as a soft editor aid.
//
// Canonical banned-word list: ~/agent-harness/tools/humanize/banned-words.json
// (same source the humanizer + /api/assist use). If you change the categories
// here, sync 00-memory/feedback/feedback_voice_rules_2026-05-02.md.

const BANNED_JSON_PATH = path.join(
  os.homedir(),
  "agent-harness/tools/humanize/banned-words.json"
);

export type GateCheck = {
  id: string;
  label: string;
  severity: "fail" | "warn";
  passed: boolean;
  detail?: string;
};

export type GateResult = {
  ok: boolean; // true if no `fail`-severity check failed
  failures: GateCheck[];
  warnings: GateCheck[];
  checks: GateCheck[];
};

type BannedCategory = { severity?: string; words?: string[]; phrases?: string[] };
type BannedDoc = { categories?: Record<string, BannedCategory> };

function loadBannedTerms(): { block: string[]; warn: string[] } {
  try {
    const doc = JSON.parse(fs.readFileSync(BANNED_JSON_PATH, "utf-8")) as BannedDoc;
    const block: string[] = [];
    const warn: string[] = [];
    for (const cat of Object.values(doc.categories || {})) {
      const terms = [...(cat.words || []), ...(cat.phrases || [])];
      if (cat.severity === "block") block.push(...terms);
      else if (cat.severity === "warn") warn.push(...terms);
    }
    return { block, warn };
  } catch {
    return { block: [], warn: [] };
  }
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Match a term with alphanumeric boundaries (so "navigate" matches but
// "navigated" is its own listed form; "AI" won't match inside "fail").
function findTerms(text: string, terms: string[]): string[] {
  const hits = new Set<string>();
  for (const term of terms) {
    const t = term.trim();
    if (!t) continue;
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(t)}(?![\\p{L}\\p{N}])`, "iu");
    if (re.test(text)) hits.add(term);
  }
  return [...hits];
}

// Domain entities we always recognise even when lowercased or acronymised.
// Acronyms (2-6 uppercase letters) and Title-Case proper nouns are also counted
// heuristically below, so this list only needs the non-obvious / lowercased ones.
const KNOWN_ENTITIES = [
  "FATF", "FinCEN", "SEC", "MiCA", "VARA", "ADGM", "ESMA", "CFTC", "OFAC",
  "eIDAS", "Signicat", "Fractal ID", "UAE Pass", "Treasury", "Emirates",
  "SpaceX", "Starlink", "Substack", "LinkedIn", "SHeine", "Tornado Cash",
  "Binance", "Coinbase", "Chainalysis", "DFSA", "FSRA", "FCA", "MAS",
  "eIDAS 2.0", "UAE Pass",
];

// Strip URLs and #hashtags so a #KYC tag doesn't masquerade as body content.
function stripNoise(text: string): string {
  return text
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/(^|\s)#[\p{L}\p{N}_]+/gu, " ");
}

export function countNamedEntities(body: string): string[] {
  const text = stripNoise(body);
  const found = new Set<string>();
  for (const e of KNOWN_ENTITIES) {
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(e)}(?![\\p{L}\\p{N}])`, "iu");
    if (re.test(text)) found.add(e);
  }
  // ALL-CAPS acronyms (KYC, AML, AI, EU, UAE, ...).
  for (const m of text.matchAll(/\b[A-Z][A-Z0-9]{1,5}\b/g)) found.add(m[0]);
  // Title-Case proper nouns NOT at the start of a sentence (so "An AI" doesn't
  // count "An", but "Emirates flight" counts "Emirates").
  for (const m of text.matchAll(/(?<=[a-z,]\s)([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/g)) {
    found.add(m[1]);
  }
  return [...found];
}

// Cross-/intra-sentence "not X but Y" reframe family — the AI-cadence tell.
const REFRAME_PATTERNS: RegExp[] = [
  /\bnot only\b[^.?!]*\bbut\b/gi,
  /\bit'?s not\b[^.?!]*[.?!]\s*it'?s\b/gi,
  /\bit is not\b[^.?!]*[.?!]\s*it is\b/gi,
  /\bisn'?t\b[^.?!]*[,.?!]\s*it'?s\b/gi,
  /\bnot\b[^.?!]{1,40}\bbut\b/gi,
];

function countReframes(body: string): number {
  let n = 0;
  for (const re of REFRAME_PATTERNS) {
    const m = body.match(re);
    if (m) n += m.length;
  }
  return n;
}

function longSentences(body: string, max = 60): number {
  const sentences = body
    .replace(/\s+/g, " ")
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return sentences.filter((s) => s.split(/\s+/).length > max).length;
}

// Run all gates against a draft. `draft` must carry `body`, `platform`, `image`.
export function runGates(draft: Pick<Draft, "body" | "platform" | "image"> & {
  allow_no_visual?: boolean;
}): GateResult {
  const checks: GateCheck[] = [];
  const body = draft.body || "";
  const { block, warn } = loadBannedTerms();

  // 1. Banned words (humanizer block list) — FAIL.
  const banned = findTerms(body, block);
  checks.push({
    id: "banned-words",
    label: "No banned AI-tell words/phrases",
    severity: "fail",
    passed: banned.length === 0,
    detail: banned.length ? `found: ${banned.join(", ")}` : undefined,
  });

  // 2. >=2 named entities — FAIL.
  const entities = countNamedEntities(body);
  checks.push({
    id: "named-entities",
    label: "At least 2 named entities (regulator/firm/person)",
    severity: "fail",
    passed: entities.length >= 2,
    detail:
      entities.length >= 2
        ? `${entities.length} found: ${entities.slice(0, 6).join(", ")}`
        : `only ${entities.length} found${entities.length ? `: ${entities.join(", ")}` : ""}`,
  });

  // 3. Visual attached — FAIL (escape hatch: frontmatter allow_no_visual: true).
  const hasVisual = !!(draft.image && String(draft.image).trim());
  checks.push({
    id: "visual",
    label: "Visual attached (image:)",
    severity: "fail",
    passed: hasVisual || !!draft.allow_no_visual,
    detail: hasVisual
      ? undefined
      : draft.allow_no_visual
      ? "waived (allow_no_visual: true)"
      : "no image: in frontmatter — add one or set allow_no_visual: true",
  });

  // 4. "not X but Y" reframe counter — WARN when >2.
  const reframes = countReframes(body);
  checks.push({
    id: "reframe",
    label: 'Few "not X but Y" reframes',
    severity: "warn",
    passed: reframes <= 2,
    detail: reframes > 2 ? `${reframes} reframe patterns (target <=2)` : undefined,
  });

  // 5. Sentence > 60 words — WARN.
  const longCount = longSentences(body);
  checks.push({
    id: "long-sentence",
    label: "No sentence over 60 words",
    severity: "warn",
    passed: longCount === 0,
    detail: longCount > 0 ? `${longCount} sentence(s) over 60 words` : undefined,
  });

  // Vague words — WARN.
  const vague = findTerms(body, warn);
  checks.push({
    id: "vague-words",
    label: "No vague filler words",
    severity: "warn",
    passed: vague.length === 0,
    detail: vague.length ? `found: ${vague.join(", ")}` : undefined,
  });

  const failures = checks.filter((c) => c.severity === "fail" && !c.passed);
  const warnings = checks.filter((c) => c.severity === "warn" && !c.passed);
  return { ok: failures.length === 0, failures, warnings, checks };
}
