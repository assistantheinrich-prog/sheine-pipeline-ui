import { Card, H1, Label } from "@/components/ui";

export default function SettingsPage() {
  return (
    <div className="px-10 py-8 max-w-3xl">
      <header className="mb-8">
        <Label>Settings</Label>
        <H1 className="mt-1">Pipeline configuration</H1>
      </header>

      <div className="space-y-4">
        <Card>
          <Label>Refresh triggers</Label>
          <ul className="mt-3 space-y-2 text-sm font-mono text-text-gray">
            <li>research-run</li>
            <li>research-draft</li>
            <li>social-kol-draft</li>
            <li>refresh-gmail-snapshot</li>
            <li>x-digest</li>
          </ul>
          <p className="text-xs text-text-dim mt-3">
            One-click triggers come on Day 3 — POSTs to /api/run/&lt;cmd&gt;.
          </p>
        </Card>

        <Card>
          <Label>Voice rules</Label>
          <p className="text-text-gray text-xs mt-2">
            Banned words live in <code className="font-mono text-cyan">app/composer.tsx</code>.
            Editable lint list comes on Day 3.
          </p>
        </Card>
      </div>
    </div>
  );
}
