import Link from "next/link";
import { listResearchNotes } from "@/lib/research";
import { Empty } from "@/components/ui";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

export default async function ResearchPage() {
  const notes = await listResearchNotes();
  return (
    <div>
      <PageHeader label="Research" title={`${notes.length} note${notes.length === 1 ? "" : "s"}`} />
      <div className="px-6 py-6 max-w-3xl mx-auto">
        {notes.length === 0 ? (
          <Empty>
            No research notes yet. Run{" "}
            <code className="font-mono text-brand">research-run</code>.
          </Empty>
        ) : (
          <ul className="space-y-1.5">
            {notes.map((n) => (
              <li key={n.date}>
                <Link
                  href={`/research/${n.date}` as any}
                  className="flex items-center justify-between px-3 h-10 rounded-sm bg-bg-surface border border-line-subtle hover:border-line-strong transition-colors"
                >
                  <span className="font-mono text-[13.5px] text-ink-900">{n.date}</span>
                  <span className="text-ink-400 text-[11.5px] font-mono">{n.filename}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
