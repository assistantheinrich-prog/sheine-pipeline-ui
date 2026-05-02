"use client";

import { useMemo, useState } from "react";
import type { Draft } from "@/lib/drafts";
import type { ResearchNote } from "@/lib/research";
import { ComposerCanvas } from "@/components/composer-canvas";
import { MarkdownView } from "@/components/markdown";
import {
  Plus,
  Search,
  PanelLeftClose,
  PanelRightClose,
  Calendar,
  BarChart3,
  Plug,
  HelpCircle,
  Settings as SettingsIcon,
  ChevronDown,
} from "lucide-react";
import clsx from "clsx";

type Tab = "drafts" | "scheduled" | "posted";

export function Composer({
  drafts,
  research,
}: {
  drafts: Draft[];
  research: ResearchNote | null;
}) {
  const [tab, setTab] = useState<Tab>("drafts");
  const [filter, setFilter] = useState("");

  const tabbed = useMemo(() => {
    if (tab === "drafts")
      return drafts.filter(
        (d) => d.status === "pending" || d.status === "approved"
      );
    if (tab === "scheduled")
      return drafts.filter((d) => d.status === "approved" && d.scheduled_at);
    return drafts.filter((d) => d.status === "posted");
  }, [drafts, tab]);

  const visible = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return tabbed;
    return tabbed.filter(
      (d) =>
        d.body.toLowerCase().includes(f) ||
        d.slug?.toLowerCase().includes(f) ||
        d.filename.toLowerCase().includes(f)
    );
  }, [tabbed, filter]);

  const [selected, setSelected] = useState<Draft | null>(visible[0] || null);
  const [body, setBody] = useState(selected?.body || "");
  const [status, setStatus] = useState(selected?.status || "pending");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [showResearch, setShowResearch] = useState(true);

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

  return (
    <div className="flex h-screen min-h-0">
      {/* Drafts column — Typefully's left panel */}
      <aside className="w-[280px] shrink-0 border-r border-line-subtle bg-bg-base flex flex-col">
        <div className="px-3 pt-4 pb-2 flex items-center gap-2">
          <button className="flex-1 flex items-center gap-2 h-9 px-2 rounded-sm text-[13px] text-ink-700 hover:bg-bg-subtle transition-colors">
            <span className="w-6 h-6 rounded-full bg-ink-900 text-white inline-flex items-center justify-center text-[10px] font-semibold">SH</span>
            <span className="font-medium truncate">Sebastian Heine</span>
            <ChevronDown size={14} className="ml-auto text-ink-400" />
          </button>
          <button className="h-8 w-8 inline-flex items-center justify-center rounded-sm text-ink-500 hover:bg-bg-subtle">
            <Search size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-3 border-b border-line-subtle">
          <div className="flex gap-4">
            {(["drafts", "scheduled", "posted"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={clsx(
                  "h-10 -mb-px text-[12.5px] font-medium uppercase tracking-label transition-colors capitalize border-b-2",
                  tab === t
                    ? "text-ink-900 border-ink-900"
                    : "text-ink-400 border-transparent hover:text-ink-700"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* New draft + filter */}
        <div className="px-3 py-3 space-y-2">
          <a
            href="/inbox"
            className="flex items-center justify-between w-full h-9 px-2.5 rounded-sm bg-bg-surface border border-line-subtle text-[13px] text-ink-700 hover:border-line-strong transition-colors group"
          >
            <span className="inline-flex items-center gap-2">
              <Plus size={14} />
              New draft
            </span>
            <ChevronDown size={14} className="text-ink-400 -rotate-90" />
          </a>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter drafts…"
            className="w-full h-8 px-2.5 rounded-sm bg-bg-base border border-line-subtle text-[12.5px] text-ink-900 placeholder:text-ink-300 focus:outline-none focus:border-line-strong"
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {visible.length === 0 ? (
            <div className="text-center text-[12.5px] text-ink-400 italic py-8 px-3">
              {tab === "drafts" ? "No drafts in this tab." : `No ${tab} posts.`}
            </div>
          ) : (
            <ul className="space-y-1">
              {visible.map((d) => {
                const isActive = selected?.filename === d.filename;
                return (
                  <li key={d.filename}>
                    <button
                      onClick={() => pick(d)}
                      className={clsx(
                        "w-full text-left px-2.5 py-2.5 rounded-sm border transition-colors",
                        isActive
                          ? "bg-bg-surface border-line-strong shadow-card"
                          : "bg-transparent border-transparent hover:bg-bg-subtle"
                      )}
                    >
                      <p className="text-[12.5px] text-ink-900 line-clamp-3 leading-snug">
                        {d.body || (
                          <span className="italic text-ink-400">
                            (empty draft)
                          </span>
                        )}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[10.5px]">
                        <span className="font-mono text-ink-400 lowercase">
                          {d.platform === "x" ? "X" : "linkedin"}
                          {d.reply_to_id && " · reply"}
                        </span>
                        <span
                          className={clsx(
                            "uppercase tracking-label font-semibold",
                            d.status === "approved"
                              ? "text-success"
                              : d.status === "pending"
                              ? "text-warn"
                              : d.status === "posted"
                              ? "text-brand"
                              : "text-ink-400"
                          )}
                        >
                          {d.status}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Bottom secondary nav (Typefully pattern) */}
        <div className="border-t border-line-subtle px-2 py-2 space-y-px">
          <NavLink href="/queue" icon={Calendar} label="Queue" />
          <NavLink href="/analytics" icon={BarChart3} label="Analytics" />
          <NavLink href="/kols" icon={Plug} label="KOLs" />
          <NavLink href="/settings" icon={SettingsIcon} label="Settings" />
          <NavLink href="/research" icon={HelpCircle} label="Research" />
        </div>
      </aside>

      {/* Center: composer */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Top bar */}
        <header className="h-12 px-4 border-b border-line-subtle flex items-center gap-2 bg-bg-base">
          {selected && (
            <span
              className={clsx(
                "inline-flex items-center justify-center w-6 h-6 rounded-xs text-[11px] font-semibold border",
                selected.platform === "x"
                  ? "bg-ink-900 text-white border-ink-900"
                  : "bg-[#0a66c2] text-white border-[#0a66c2]"
              )}
            >
              {selected.platform === "x" ? "X" : "in"}
            </span>
          )}
          <span className="font-mono text-[12.5px] text-ink-700 truncate">
            {selected ? selected.filename.replace(/\.md$/, "") : "Pipeline composer"}
          </span>
          <div className="flex-1" />
          <button
            onClick={() => setShowResearch((v) => !v)}
            title={showResearch ? "Hide research" : "Show research"}
            className="h-8 w-8 inline-flex items-center justify-center rounded-sm text-ink-500 hover:bg-bg-subtle"
          >
            {showResearch ? <PanelRightClose size={15} /> : <PanelLeftClose size={15} />}
          </button>
          {selected && (
            <>
              <button
                onClick={() => save({ newStatus: status === "approved" ? "pending" : "approved" })}
                disabled={saving}
                className="h-8 px-3 rounded-sm bg-warn text-white text-[12.5px] font-semibold hover:bg-warn-soft disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {status === "approved" ? "Un-approve" : "Schedule"}
              </button>
              <button
                onClick={() => save()}
                disabled={saving || !body.trim()}
                className="h-8 px-3 rounded-sm bg-brand text-white text-[12.5px] font-semibold hover:bg-brand-soft disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          )}
        </header>

        <ComposerCanvas
          selected={selected}
          reviewable={visible}
          onPick={pick}
          body={body}
          setBody={(s) => {
            setBody(s);
            setSavedAt(null);
          }}
          status={status}
          setStatus={setStatus}
          saving={saving}
          savedAt={savedAt}
          save={save}
        />
      </main>

      {/* Right: research note (collapsible) */}
      {showResearch && (
        <aside className="w-[380px] shrink-0 border-l border-line-subtle flex flex-col bg-bg-base">
          <header className="h-12 px-5 border-b border-line-subtle flex items-baseline gap-3">
            <span className="text-[10.5px] uppercase tracking-label text-ink-400 font-semibold">
              Research
            </span>
            <span className="font-mono text-[12.5px] text-ink-700">
              {research ? research.date : "no notes"}
            </span>
            <a
              href="/research"
              className="ml-auto text-[12px] text-brand hover:underline"
            >
              all
            </a>
          </header>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {research ? (
              <MarkdownView body={stripFrontmatter(research.body)} />
            ) : (
              <p className="text-[13px] text-ink-400 italic">
                Run <code className="font-mono text-brand">research-run</code> to
                generate today's note.
              </p>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}

function NavLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: any;
  label: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-2.5 h-8 px-2.5 rounded-sm text-[12.5px] text-ink-500 hover:bg-bg-subtle hover:text-ink-900 transition-colors"
    >
      <Icon size={14} strokeWidth={1.75} />
      {label}
    </a>
  );
}

function stripFrontmatter(s: string): string {
  return s.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "");
}
