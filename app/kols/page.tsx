import fs from "node:fs/promises";
import { KOL_LIST } from "@/lib/paths";
import { Empty, H1, Label } from "@/components/ui";

export const dynamic = "force-dynamic";

type Entry = string | { handle: string; note?: string };

async function loadList(): Promise<Entry[]> {
  try {
    const raw = await fs.readFile(KOL_LIST, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.handles) ? parsed.handles : [];
  } catch {
    return [];
  }
}

export default async function KolsPage() {
  const handles = await loadList();
  return (
    <div className="px-10 py-8">
      <header className="mb-8">
        <Label>KOLs</Label>
        <H1 className="mt-1">{handles.length} tracked</H1>
      </header>
      {handles.length === 0 ? (
        <Empty>
          List is empty. Add via <code className="font-mono text-cyan">social-kol-draft add &lt;handle&gt;</code>.
        </Empty>
      ) : (
        <div className="space-y-2 max-w-3xl">
          {handles.map((entry, i) => {
            const handle = typeof entry === "string" ? entry : entry.handle;
            const note = typeof entry === "object" ? entry.note : undefined;
            return (
              <div key={i} className="bg-navy-card border border-border-subtle rounded-md p-4 flex items-baseline gap-4">
                <a
                  href={`https://x.com/${handle}`}
                  target="_blank"
                  rel="noopener"
                  className="font-mono text-text-white hover:text-cyan"
                >
                  @{handle}
                </a>
                {note && <span className="text-text-gray text-xs">{note}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
