import Link from "next/link";
import { listResearchNotes } from "@/lib/research";
import { Card, Empty, H1, Label } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ResearchPage() {
  const notes = await listResearchNotes();
  return (
    <div className="px-10 py-8">
      <header className="mb-8">
        <Label>Research</Label>
        <H1 className="mt-1">{notes.length} note{notes.length === 1 ? "" : "s"}</H1>
      </header>
      {notes.length === 0 ? (
        <Empty>No research notes yet. Run <code className="font-mono text-cyan">research-run</code>.</Empty>
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <Link key={n.date} href={`/research/${n.date}` as any}>
              <Card className="hover:bg-navy-elev2 cursor-pointer flex items-center justify-between">
                <span className="font-mono text-text-white">{n.date}</span>
                <span className="text-text-dim text-xs font-mono">{n.filename}</span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
