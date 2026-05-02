import Link from "next/link";
import { listDrafts } from "@/lib/drafts";
import { Card, Empty, H1, Label, PlatformBadge, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const all = await listDrafts();
  const inbox = all.filter((d) => d.status === "pending");

  return (
    <div className="px-10 py-8">
      <header className="mb-8 flex items-baseline justify-between">
        <div>
          <Label>Inbox</Label>
          <H1 className="mt-1">{inbox.length} draft{inbox.length === 1 ? "" : "s"} to review</H1>
        </div>
        <p className="text-text-gray text-xs font-mono">All drafts: {all.length}</p>
      </header>

      {inbox.length === 0 ? (
        <Empty>No pending drafts. Generate via <code className="font-mono text-cyan">research-draft</code>.</Empty>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {inbox.map((d) => (
            <Link
              key={d.filename}
              href={`/?file=${encodeURIComponent(d.filename)}` as any}
            >
              <Card className="h-full hover:bg-navy-elev2 cursor-pointer">
                <div className="flex items-center gap-2 mb-3">
                  <PlatformBadge platform={d.platform} />
                  <StatusBadge status={d.status} />
                  {d.reply_to_id && (
                    <span className="text-[11px] uppercase tracking-label text-cyan">reply</span>
                  )}
                </div>
                <p className="text-sm text-text-white whitespace-pre-line line-clamp-6">
                  {d.body}
                </p>
                {d.based_on && (
                  <p className="text-xs text-text-dim italic mt-3 line-clamp-1">
                    {d.based_on}
                  </p>
                )}
                <p className="text-[11px] text-text-dim font-mono mt-3">
                  {d.filename}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
