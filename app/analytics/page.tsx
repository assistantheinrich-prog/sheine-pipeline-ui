import { Empty, H1, Label } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
  return (
    <div className="px-10 py-8">
      <header className="mb-8">
        <Label>Analytics</Label>
        <H1 className="mt-1">Engagement over time</H1>
      </header>
      <Empty>
        Coming on Day 2 — reads <code className="font-mono text-cyan">social-posts.sqlite</code>.
      </Empty>
    </div>
  );
}
