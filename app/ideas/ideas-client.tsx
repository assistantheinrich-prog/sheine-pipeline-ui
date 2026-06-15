"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PenLine, ExternalLink, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui";
import type { RegHit } from "@/lib/reg";

type State = { status: "idle" | "drafting" | "done" | "error"; msg?: string };

export function IdeasClient({ hits }: { hits: RegHit[] }) {
  const router = useRouter();
  const [state, setState] = useState<Record<number, State>>({});

  async function draft(hit: RegHit) {
    setState((s) => ({ ...s, [hit.id]: { status: "drafting" } }));
    try {
      const r = await fetch("/api/ideas/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: hit.id }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.filename) {
        setState((s) => ({ ...s, [hit.id]: { status: "done", msg: data.filename } }));
        router.refresh();
      } else {
        setState((s) => ({ ...s, [hit.id]: { status: "error", msg: data.error || "failed" } }));
      }
    } catch (e: any) {
      setState((s) => ({ ...s, [hit.id]: { status: "error", msg: String(e) } }));
    }
  }

  return (
    <div className="space-y-3">
      {hits.map((h) => {
        const st = state[h.id]?.status || "idle";
        return (
          <div
            key={h.id}
            className="rounded-md border border-line-subtle bg-bg-surface shadow-card p-4"
          >
            <div className="flex items-center gap-2 mb-1.5 text-[11px] uppercase tracking-label">
              <span className="font-semibold text-ink-700">
                {h.regulator} · {h.jurisdiction}
              </span>
              <span
                className={
                  h.significance === "high"
                    ? "text-danger font-semibold"
                    : "text-ink-400"
                }
              >
                {h.significance}
              </span>
              <span className="text-ink-400">{h.doc_type}</span>
              {h.published_at && (
                <span className="text-ink-400 font-mono normal-case">{h.published_at}</span>
              )}
            </div>
            <p className="text-[14px] text-ink-900 font-medium leading-snug">{h.title}</p>
            {h.summary && (
              <p className="text-[12.5px] text-ink-500 mt-1 line-clamp-3">{h.summary}</p>
            )}
            <div className="flex items-center gap-3 mt-3">
              {st === "done" ? (
                <Link
                  href={"/" as any}
                  className="inline-flex items-center gap-1.5 text-[12.5px] text-success font-medium"
                >
                  <Check size={14} /> Draft created — open composer to review &amp; send
                </Link>
              ) : (
                <Button
                  onClick={() => draft(h)}
                  disabled={st === "drafting"}
                  variant="primary"
                  className="!h-8"
                >
                  {st === "drafting" ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Drafting…
                    </>
                  ) : (
                    <>
                      <PenLine size={13} /> Draft this
                    </>
                  )}
                </Button>
              )}
              {h.source_url && (
                <a
                  href={h.source_url}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1 text-[12px] text-ink-400 hover:text-brand"
                >
                  <ExternalLink size={12} /> source
                </a>
              )}
              {st === "error" && (
                <span className="text-[12px] text-danger">{state[h.id]?.msg}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
