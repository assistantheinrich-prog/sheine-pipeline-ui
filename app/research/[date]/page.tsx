import { notFound } from "next/navigation";
import { readResearchNote } from "@/lib/research";
import { H1, Label } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ResearchNotePage({ params }: { params: { date: string } }) {
  const note = await readResearchNote(params.date);
  if (!note) notFound();
  return (
    <div className="px-10 py-8 max-w-4xl">
      <header className="mb-8">
        <Label>Research note</Label>
        <H1 className="mt-1 font-mono text-[1.5rem]">{note.date}</H1>
      </header>
      <article className="text-sm whitespace-pre-wrap leading-relaxed text-text-white">
        {stripFrontmatter(note.body)}
      </article>
    </div>
  );
}

function stripFrontmatter(s: string): string {
  return s.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "");
}
