import { notFound } from "next/navigation";
import { readResearchNote } from "@/lib/research";
import { MarkdownView } from "@/components/markdown";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

export default async function ResearchNotePage({ params }: { params: { date: string } }) {
  const note = await readResearchNote(params.date);
  if (!note) notFound();
  return (
    <div>
      <PageHeader label="Research" title={note.date} />
      <div className="px-6 py-7 max-w-4xl mx-auto">
        <MarkdownView body={stripFrontmatter(note.body)} />
      </div>
    </div>
  );
}

function stripFrontmatter(s: string): string {
  return s.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "");
}
