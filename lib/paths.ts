import path from "node:path";
import os from "node:os";

const HOME = os.homedir();

export const VAULT = path.join(HOME, "Documents/ObsidianVault");
// Drafts live in the vault by default. On the mini the UI runs under launchd,
// whose node binary has no TCC consent for ~/Documents (reads hang). Set
// SOCIAL_DRAFTS_DIR to a non-TCC path (e.g. ~/.sheine/social-drafts) that the
// vault path is symlinked to, so the UI reads the same files without the prompt.
export const DRAFTS_DIR =
  process.env.SOCIAL_DRAFTS_DIR ||
  path.join(VAULT, "00-memory/inbox/social-drafts");
export const RESEARCH_DIR = path.join(VAULT, "00-memory/inbox/research-notes");
// Engagement log moved 2026-05-02 to keep the canonical markdown memory
// tree binary-free. See engagement_log.py docstring.
export const POSTS_DB = path.join(HOME, ".sheine/data/social-posts.sqlite");
export const KOL_LIST = path.join(
  HOME,
  "agent-harness/tools/social-pipeline/kol/kol-list.json"
);
