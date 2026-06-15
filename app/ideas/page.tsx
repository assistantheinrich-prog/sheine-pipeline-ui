import { regHits } from "@/lib/reg";
import { listDrafts } from "@/lib/drafts";
import { PageHeader } from "@/components/page-header";
import { Empty } from "@/components/ui";
import { IdeasClient } from "./ideas-client";

export const dynamic = "force-dynamic";

// Performer-lane idea feed: recent regulatory-scanner hits, one click to draft.
export default async function IdeasPage() {
  const drafts = await listDrafts();
  const used = new Set(
    drafts.map((d) => d.source_url).filter(Boolean) as string[]
  );
  const hits = regHits(40, used);

  return (
    <div>
      <PageHeader
        label="Ideas"
        title={`${hits.length} regulatory development${hits.length === 1 ? "" : "s"}`}
      />
      <div className="px-6 py-6 max-w-5xl mx-auto">
        {hits.length === 0 ? (
          <Empty>
            No fresh regulatory hits to draft. The scanner runs daily at 06:00;
            already-drafted items are hidden.
          </Empty>
        ) : (
          <IdeasClient hits={hits} />
        )}
      </div>
    </div>
  );
}
