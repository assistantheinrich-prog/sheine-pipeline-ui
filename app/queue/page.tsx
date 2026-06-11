import { listDrafts } from "@/lib/drafts";
import { Empty, PlatformBadge, StatusBadge } from "@/components/ui";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const all = await listDrafts();
  const queue = all
    .filter((d) => d.status === "approved" || d.status === "pending" || d.status === "ready")
    .sort((a, b) => {
      const ax = a.scheduled_at || "9999";
      const bx = b.scheduled_at || "9999";
      return ax.localeCompare(bx);
    });

  return (
    <div>
      <PageHeader
        label="Queue"
        title={`${queue.length} draft${queue.length === 1 ? "" : "s"}`}
      />
      <div className="px-6 py-6 max-w-6xl mx-auto">
        {queue.length === 0 ? (
          <Empty>Queue is empty.</Empty>
        ) : (
          <div className="border border-line-subtle rounded-md overflow-hidden bg-bg-surface shadow-card">
            <table className="w-full text-[13px]">
              <thead className="bg-bg-subtle">
                <tr className="text-ink-500 text-[10.5px] uppercase tracking-label">
                  <th className="text-left font-semibold px-4 py-2.5">Platform</th>
                  <th className="text-left font-semibold px-4 py-2.5">Status</th>
                  <th className="text-left font-semibold px-4 py-2.5">Scheduled</th>
                  <th className="text-left font-semibold px-4 py-2.5">Slug</th>
                  <th className="text-left font-semibold px-4 py-2.5">Preview</th>
                  <th className="text-left font-semibold px-4 py-2.5">Auto</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((d) => (
                  <tr
                    key={d.filename}
                    className="h-10 border-t border-line-subtle hover:bg-bg-subtle"
                  >
                    <td className="px-4">
                      <PlatformBadge platform={d.platform} />
                    </td>
                    <td className="px-4">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-4 font-mono text-ink-500">
                      {d.scheduled_at || (
                        <span className="text-ink-400 italic">—</span>
                      )}
                    </td>
                    <td className="px-4 text-ink-900 font-mono text-[12px]">
                      {d.slug || d.filename.replace(/\.md$/, "")}
                    </td>
                    <td className="px-4 text-ink-500 text-[12.5px] truncate max-w-md">
                      {d.body.replace(/\n/g, " ").slice(0, 90)}
                      {d.body.length > 90 ? "…" : ""}
                    </td>
                    <td className="px-4 font-mono text-[12px]">
                      {d.platform === "linkedin"
                        ? "—"
                        : d.auto_post
                        ? <span className="text-success">on</span>
                        : <span className="text-ink-400">off</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
