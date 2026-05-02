"use client";

import { useMemo, useState } from "react";
import type { Draft } from "@/lib/drafts";
import type { ResearchNote } from "@/lib/research";
import { Button, Card, Empty, Label, PlatformBadge, StatusBadge } from "@/components/ui";
import { CalendarClock, Save, ExternalLink } from "lucide-react";

type Props = {
  drafts: Draft[];
  research: ResearchNote | null;
};

const X_LIMIT = 280;

export function Composer({ drafts, research }: Props) {
  const reviewable = useMemo(
    () => drafts.filter((d) => d.status === "pending" || d.status === "approved"),
    [drafts]
  );
  const [selected, setSelected] = useState<Draft | null>(reviewable[0] || null);
  const [body, setBody] = useState(selected?.body || "");
  const [status, setStatus] = useState(selected?.status || "pending");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  function pick(d: Draft) {
    setSelected(d);
    setBody(d.body);
    setStatus(d.status);
    setSavedAt(null);
  }

  async function save(opts: { newStatus?: string } = {}) {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/drafts/${selected.filename}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          status: opts.newStatus ?? status,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { draft } = await res.json();
      setSelected(draft);
      setStatus(draft.status);
      setSavedAt(new Date().toISOString());
    } catch (e: any) {
      alert("Save failed: " + (e?.message || e));
    } finally {
      setSaving(false);
    }
  }

  const xCount = body.length;
  const xOver = selected?.platform === "x" && xCount > X_LIMIT;

  return (
    <div className="grid grid-cols-2 h-screen">
      {/* RESEARCH NOTE — left */}
      <section className="overflow-y-auto px-10 py-8 border-r border-line-subtle">
        <header className="flex items-baseline justify-between mb-6">
          <div>
            <Label>Research note</Label>
            <h1 className="font-sans font-semibold text-[1.5rem] tracking-tight text-ink-900 mt-1">
              {research ? research.date : "No notes yet"}
            </h1>
          </div>
          <a
            href="/research"
            className="text-brand text-sm hover:underline inline-flex items-center gap-1"
          >
            Browse all <ExternalLink size={12} />
          </a>
        </header>
        {research ? (
          <article className="prose prose-invert max-w-none text-sm text-ink-900 font-sans whitespace-pre-wrap leading-relaxed">
            {stripFrontmatter(research.body)}
          </article>
        ) : (
          <Empty>
            Run <code className="font-mono text-brand">research-run</code> to generate today's note.
          </Empty>
        )}
      </section>

      {/* DRAFT CANVAS — right */}
      <section className="overflow-y-auto px-10 py-8 sticky top-0 bg-bg-base">
        <header className="flex items-baseline justify-between mb-6">
          <div>
            <Label>Draft canvas</Label>
            <h2 className="font-sans font-semibold text-[1.5rem] tracking-tight text-ink-900 mt-1">
              {selected ? selected.filename.replace(/\.md$/, "") : "Nothing to review"}
            </h2>
          </div>
          {selected && (
            <div className="flex items-center gap-2">
              <PlatformBadge platform={selected.platform} />
              <StatusBadge status={status} />
            </div>
          )}
        </header>

        {/* Draft picker */}
        {reviewable.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1">
            {reviewable.slice(0, 12).map((d) => (
              <button
                key={d.filename}
                onClick={() => pick(d)}
                className={
                  "h-7 px-2 rounded-xs text-xs border transition-colors " +
                  (selected?.filename === d.filename
                    ? "bg-bg-subtle border-line-strong text-ink-900"
                    : "bg-transparent border-line-subtle text-ink-500 hover:border-line-strong")
                }
              >
                <span className="font-mono mr-1.5 text-ink-400">
                  {d.platform === "x" ? "X" : "LI"}
                </span>
                {d.slug || d.filename.slice(0, 24)}
              </button>
            ))}
          </div>
        )}

        {selected ? (
          <>
            {selected.based_on && (
              <p className="text-xs text-ink-400 mb-3 italic">
                Based on: {selected.based_on}
              </p>
            )}
            {selected.reply_to_id && (
              <p className="text-xs text-brand mb-3">
                ↳ Reply to{" "}
                <a
                  href={`https://x.com/${selected.reply_to_handle || "i"}/status/${selected.reply_to_id}`}
                  target="_blank"
                  rel="noopener"
                  className="font-mono hover:underline"
                >
                  @{selected.reply_to_handle || "?"}/{selected.reply_to_id}
                </a>
              </p>
            )}
            <textarea
              className="w-full min-h-[280px] bg-bg-subtle border border-line-subtle rounded-sm p-4 text-ink-900 font-sans text-sm leading-relaxed focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 resize-y"
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                setSavedAt(null);
              }}
              placeholder="Write your post here…"
            />
            <div className="flex items-center justify-between mt-2 text-xs text-ink-400">
              <span>
                {selected.platform === "x" && (
                  <span className={xOver ? "text-danger font-semibold" : ""}>
                    {xCount} / {X_LIMIT}
                  </span>
                )}
                {selected.platform === "linkedin" && (
                  <span>{wordCount(body)} words · {body.length} chars</span>
                )}
                {savedAt && <span className="ml-3 text-brand">saved {timeAgo(savedAt)}</span>}
              </span>
              {selected.scheduled_at ? (
                <span className="inline-flex items-center gap-1 text-ink-500">
                  <CalendarClock size={12} />
                  {selected.scheduled_at}
                </span>
              ) : (
                <span className="text-ink-400 italic">no schedule</span>
              )}
            </div>

            <VoiceLints body={body} />

            <div className="flex items-center gap-2 mt-6">
              <Button onClick={() => save()} disabled={saving} variant="secondary">
                <Save size={14} /> Save edits
              </Button>
              {status !== "approved" ? (
                <Button
                  onClick={() => {
                    setStatus("approved");
                    save({ newStatus: "approved" });
                  }}
                  disabled={saving || xOver}
                  variant="primary"
                >
                  Approve
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setStatus("pending");
                    save({ newStatus: "pending" });
                  }}
                  disabled={saving}
                >
                  Un-approve
                </Button>
              )}
              <Button
                onClick={() => {
                  if (confirm("Reject this draft?")) {
                    setStatus("rejected");
                    save({ newStatus: "rejected" });
                  }
                }}
                disabled={saving}
                variant="destructive"
              >
                Reject
              </Button>
            </div>
          </>
        ) : (
          <Empty>No reviewable drafts. Generate via `research-draft` or write one with `social-draft`.</Empty>
        )}
      </section>
    </div>
  );
}

const BANNED = [
  "delve",
  "leverage",
  "navigate",
  "robust",
  "seamless",
  "tapestry",
  "intricate",
  "dive into",
  "unlock",
  "game-changer",
  "supercharged",
];

function VoiceLints({ body }: { body: string }) {
  const lower = body.toLowerCase();
  const hits = BANNED.filter((w) => lower.includes(w));
  const hasEmoji = /\p{Extended_Pictographic}/u.test(body);
  if (!hits.length && !hasEmoji) return null;
  return (
    <Card className="mt-4 bg-rose/5 border-rose/30">
      <Label>Voice lints</Label>
      <ul className="mt-2 text-xs text-danger space-y-1">
        {hasEmoji && <li>Contains emoji — voice rule says no emojis.</li>}
        {hits.map((w) => (
          <li key={w}>Banned word: <span className="font-mono">{w}</span></li>
        ))}
      </ul>
    </Card>
  );
}

function stripFrontmatter(s: string): string {
  return s.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "");
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 5_000) return "just now";
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3600_000) return `${Math.floor(ms / 60_000)}m ago`;
  return new Date(iso).toLocaleTimeString();
}
