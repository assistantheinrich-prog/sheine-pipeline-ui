import { NextRequest, NextResponse } from "next/server";
import { readDraft } from "@/lib/drafts";
import { runGates } from "@/lib/gates";
import matter from "gray-matter";

export const dynamic = "force-dynamic";

// Preview the blocking eval gates for a draft without changing its status.
// The UI calls this to show the gate panel before "Send to review".
export async function GET(_req: NextRequest, ctx: { params: { filename: string } }) {
  const draft = await readDraft(ctx.params.filename);
  if (!draft) return NextResponse.json({ error: "not found" }, { status: 404 });
  const allowNoVisual = !!(matter(draft.raw).data?.allow_no_visual);
  const gate = runGates({
    body: draft.body,
    platform: draft.platform,
    image: draft.image,
    allow_no_visual: allowNoVisual,
  });
  return NextResponse.json({ gate });
}
