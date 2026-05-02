import { listDrafts } from "@/lib/drafts";
import { Empty, H1, Label, PlatformBadge, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const all = await listDrafts();
  // Queue = approved or pending with a scheduled_at, plus all approved.
  const queue = all
    .filter((d) => d.status === "approved" || d.status === "pending")
    .sort((a, b) => {
      const ax = a.scheduled_at || "9999";
      const bx = b.scheduled_at || "9999";
      return ax.localeCompare(bx);
    });

  return (
    <div className="px-10 py-8">
      <header className="mb-8">
        <Label>Queue</Label>
        <H1 className="mt-1">
          {queue.length} draft{queue.length === 1 ? "" : "s"} pending or approved
        </H1>
      </header>

      {queue.length === 0 ? (
        <Empty>Queue is empty.</Empty>
      ) : (
        <div className="border border-border-subtle rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-navy-mid">
              <tr className="text-text-gray text-[11px] uppercase tracking-label">
                <th className="text-left font-semibold px-4 py-3">Platform</th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
                <th className="text-left font-semibold px-4 py-3">Scheduled</th>
                <th className="text-left font-semibold px-4 py-3">Slug</th>
                <th className="text-left font-semibold px-4 py-3">Preview</th>
                <th className="text-left font-semibold px-4 py-3">Auto</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((d, idx) => (
                <tr
                  key={d.filename}
                  className={
                    "h-10 border-t border-border-subtle hover:bg-navy-elev2 " +
                    (idx % 2 ? "bg-navy-mid" : "bg-navy-card")
                  }
                >
                  <td className="px-4">
                    <PlatformBadge platform={d.platform} />
                  </td>
                  <td className="px-4">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-4 font-mono text-text-gray">
                    {d.scheduled_at || <span className="text-text-dim italic">—</span>}
                  </td>
                  <td className="px-4 text-text-white font-mono text-xs">
                    {d.slug || d.filename.replace(/\.md$/, "")}
                  </td>
                  <td className="px-4 text-text-gray text-xs truncate max-w-md">
                    {d.body.replace(/\n/g, " ").slice(0, 90)}
                    {d.body.length > 90 ? "…" : ""}
                  </td>
                  <td className="px-4 font-mono text-xs text-text-gray">
                    {d.platform === "linkedin"
                      ? "—"
                      : d.auto_post
                      ? <span className="text-cyan">on</span>
                      : <span className="text-text-dim">off</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
