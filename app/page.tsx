import { listDrafts } from "@/lib/drafts";
import { readLatestResearchNote } from "@/lib/research";
import { Composer } from "./composer";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [drafts, research] = await Promise.all([listDrafts(), readLatestResearchNote()]);
  return <Composer drafts={drafts} research={research} />;
}
