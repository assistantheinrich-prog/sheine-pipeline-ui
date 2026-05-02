import fs from "node:fs/promises";
import path from "node:path";
import { RESEARCH_DIR } from "./paths";

export type ResearchNote = {
  date: string; // YYYY-MM-DD
  filename: string;
  path: string;
  body: string;
};

export async function listResearchNotes(): Promise<ResearchNote[]> {
  let entries: string[] = [];
  try {
    entries = await fs.readdir(RESEARCH_DIR);
  } catch {
    return [];
  }
  const md = entries.filter((f) => f.endsWith("-research.md"));
  return md
    .map((f) => ({
      date: f.replace("-research.md", ""),
      filename: f,
      path: path.join(RESEARCH_DIR, f),
      body: "",
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function readResearchNote(date: string): Promise<ResearchNote | null> {
  const safe = date.replace(/[^0-9-]/g, "");
  const filename = `${safe}-research.md`;
  const full = path.join(RESEARCH_DIR, filename);
  try {
    const body = await fs.readFile(full, "utf-8");
    return { date: safe, filename, path: full, body };
  } catch {
    return null;
  }
}

export async function readLatestResearchNote(): Promise<ResearchNote | null> {
  const notes = await listResearchNotes();
  if (!notes.length) return null;
  return readResearchNote(notes[0].date);
}
