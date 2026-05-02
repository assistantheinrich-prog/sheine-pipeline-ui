import { listDrafts } from "@/lib/drafts";
import { Empty, H1, Label, PlatformBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const all = await listDrafts();
  const posted = all.filter((d) => d.status === "posted");
  return (
    <div className="px-10 py-8">
      <header className="mb-8">
        <Label>Library</Label>
        <H1 className="mt-1">{posted.length} posted</H1>
      </header>
      {posted.length === 0 ? (
        <Empty>Nothing posted yet.</Empty>
      ) : (
        <div className="space-y-3">
          {posted.map((d) => (
            <div key={d.filename} className="border border-border-subtle rounded-md p-4 bg-navy-card">
              <div className="flex items-center gap-2 mb-2">
                <PlatformBadge platform={d.platform} />
                <span className="text-xs font-mono text-text-dim">{d.posted_at}</span>
                {d.posted_url && (
                  <a href={d.posted_url} target="_blank" rel="noopener" className="text-cyan text-xs hover:underline ml-auto">
                    open
                  </a>
                )}
              </div>
              <p className="text-sm whitespace-pre-line text-text-white">{d.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
