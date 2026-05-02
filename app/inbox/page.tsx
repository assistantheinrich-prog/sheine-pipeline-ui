import Link from "next/link";
import { listDrafts } from "@/lib/drafts";
import { Empty, PlatformBadge, StatusBadge } from "@/components/ui";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const all = await listDrafts();
  const inbox = all.filter((d) => d.status === "pending");

  return (
    <div>
      <PageHeader
        label="Inbox"
        title={`${inbox.length} draft${inbox.length === 1 ? "" : "s"} to review`}
        rightSlot={<span className="text-[12px] font-mono text-ink-400">All drafts: {all.length}</span>}
      />

      <div className="px-6 py-6 max-w-6xl mx-auto">
        {inbox.length === 0 ? (
          <Empty>
            No pending drafts. Generate via{" "}
            <code className="font-mono text-brand">research-draft</code>.
          </Empty>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {inbox.map((d) => (
              <Link
                key={d.filename}
                href={"/" as any}
                className="group rounded-md border border-line-subtle bg-bg-surface shadow-card p-4 hover:border-line-strong transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <PlatformBadge platform={d.platform} />
                  <StatusBadge status={d.status} />
                  {d.reply_to_id && (
                    <span className="text-[11px] uppercase tracking-label text-brand font-semibold">
                      reply
                    </span>
                  )}
                </div>
                <p className="text-[13.5px] text-ink-900 whitespace-pre-line line-clamp-6 leading-snug">
                  {d.body}
                </p>
                {d.based_on && (
                  <p className="text-[11.5px] text-ink-400 italic mt-3 line-clamp-1">
                    {d.based_on}
                  </p>
                )}
                <p className="text-[10.5px] text-ink-400 font-mono mt-3">
                  {d.filename}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
