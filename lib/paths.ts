import path from "node:path";
import os from "node:os";

const HOME = os.homedir();

export const VAULT = path.join(HOME, "Documents/ObsidianVault");
export const DRAFTS_DIR = path.join(VAULT, "00-memory/inbox/social-drafts");
export const RESEARCH_DIR = path.join(VAULT, "00-memory/inbox/research-notes");
// Engagement log moved 2026-05-02 to keep the canonical markdown memory
// tree binary-free. See engagement_log.py docstring.
export const POSTS_DB = path.join(HOME, ".sheine/data/social-posts.sqlite");
export const KOL_LIST = path.join(
  HOME,
  "agent-harness/tools/social-pipeline/kol/kol-list.json"
);
