import { NextRequest, NextResponse } from "next/server";
import { readResearchNote } from "@/lib/research";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: { date: string } }) {
  const note = await readResearchNote(ctx.params.date);
  if (!note) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ note });
}
