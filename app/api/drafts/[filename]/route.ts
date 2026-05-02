import { NextRequest, NextResponse } from "next/server";
import { readDraft, writeDraft } from "@/lib/drafts";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: { filename: string } }) {
  const draft = await readDraft(ctx.params.filename);
  if (!draft) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ draft });
}

export async function PATCH(req: NextRequest, ctx: { params: { filename: string } }) {
  const body = await req.json().catch(() => ({}));
  const updated = await writeDraft(ctx.params.filename, {
    body: typeof body.body === "string" ? body.body : undefined,
    status: typeof body.status === "string" ? body.status : undefined,
    scheduled_at: body.scheduled_at === undefined ? undefined : body.scheduled_at,
    auto_post: typeof body.auto_post === "boolean" ? body.auto_post : undefined,
  });
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ draft: updated });
}
