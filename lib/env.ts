import fs from "node:fs";
import os from "node:os";
import path from "node:path";

let loaded = false;

// Load env vars from the canonical .env files we already maintain. Non-
// destructive — never overrides an already-set process.env value.
export function loadEnvOnce(): void {
  if (loaded) return;
  loaded = true;
  const candidates = [
    path.join(os.homedir(), ".sheine/.env"),
    path.join(os.homedir(), ".openclaw/.env"),
  ];
  for (const file of candidates) {
    let raw = "";
    try {
      raw = fs.readFileSync(file, "utf-8");
    } catch {
      continue;
    }
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const [k, ...rest] = t.split("=");
      const key = k.trim();
      if (process.env[key]) continue;
      let val = rest.join("=").trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}
