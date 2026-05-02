import { NextResponse } from "next/server";
import { listResearchNotes, readLatestResearchNote } from "@/lib/research";

export const dynamic = "force-dynamic";

export async function GET() {
  const [notes, latest] = await Promise.all([
    listResearchNotes(),
    readLatestResearchNote(),
  ]);
  return NextResponse.json({
    notes: notes.map(({ date, filename }) => ({ date, filename })),
    latest,
  });
}
