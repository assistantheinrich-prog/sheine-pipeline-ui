"use client";

import { useEffect, useMemo, useState } from "react";
import type { Draft } from "@/lib/drafts";
import type { ResearchNote } from "@/lib/research";
import { ComposerCanvas } from "@/components/composer-canvas";
import { MarkdownView } from "@/components/markdown";
import { NewDraftModal, ScheduleModal } from "@/components/modals";
import { AssistPanel } from "@/components/assist-panel";
import {
  Plus,
  Search,
  PanelLeftClose,
  PanelRightClose,
  Calendar,
  BarChart3,
  Plug,
  Settings as SettingsIcon,
  ChevronDown,
  Menu,
  BookOpen,
  CalendarClock,
} from "lucide-react";
import clsx from "clsx";

type Tab = "drafts" | "scheduled" | "posted";

export function Composer({
  drafts: initialDrafts,
  research,
}: {
  drafts: Draft[];
  research: ResearchNote | null;
}) {
  const [drafts, setDrafts] = useState<Draft[]>(initialDrafts);
  const [tab, setTab] = useState<Tab>("drafts");
  const [filter, setFilter] = useState("");
  const [showResearch, setShowResearch] = useState(true);
  const [showDrafts, setShowDrafts] = useState(true);
  const [openSchedule, setOpenSchedule] = useState(false);
  const [openNew, setOpenNew] = useState(false);

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

  // Auto-collapse panels on small screens.
  useEffect(() => {
    function adjust() {
      if (window.innerWidth < 640) {
        setShowDrafts(false);
        setShowResearch(false);
      } else if (window.innerWidth < 1024) {
        setShowResearch(false);
      }
    }
    adjust();
    window.addEventListener("resize", adjust);
    return () => window.removeEventListener("resize", adjust);
  }, []);

  // Keyboard shortcuts.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      // Skip when typing in inputs/textareas (except for ⌘S which we want
      // global to save the current draft).
      const target = e.target as HTMLElement | null;
      const inField = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        if (selected) save();
        return;
      }
      if (inField) return;
      if (e.key === "n" || e.key === "N") { e.preventDefault(); setOpenNew(true); return; }
      if (e.key === "k" || e.key === "K") { e.preventDefault(); setShowDrafts((v) => !v); return; }
      if (e.key === "." ) { e.preventDefault(); setShowResearch((v) => !v); return; }
      if (e.key === "1") { e.preventDefault(); setTab("drafts"); return; }
      if (e.key === "2") { e.preventDefault(); setTab("scheduled"); return; }
      if (e.key === "3") { e.preventDefault(); setTab("posted"); return; }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, body]); // eslint-disable-line react-hooks/exhaustive-deps

  function pick(d: Draft) {
    setSelected(d);
    setBody(d.body);
    setStatus(d.status);
    setSavedAt(null);
    if (window.innerWidth < 640) setShowDrafts(false);
  }

  async function refreshDrafts(): Promise<Draft[] | null> {
    try {
      const r = await fetch("/api/drafts");
      if (!r.ok) return null;
      const { drafts: list } = await r.json();
      setDrafts(list);
      return list;
    } catch {
      return null;
    }
  }

  async function save(opts: {
    newStatus?: string;
    scheduled_at?: string | null;
  } = {}) {
    if (!selected) return;
    setSaving(true);
    try {
      const payload: any = { body };
      if (opts.newStatus !== undefined) payload.status = opts.newStatus;
      if (opts.scheduled_at !== undefined) payload.scheduled_at = opts.scheduled_at;
      const res = await fetch(`/api/drafts/${selected.filename}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const { draft } = await res.json();
      setSelected(draft);
      setStatus(draft.status);
      setSavedAt(new Date().toISOString());
      refreshDrafts();
    } catch (e: any) {
      alert("Save failed: " + (e?.message || e));
    } finally {
      setSaving(false);
    }
  }

  async function onCreated(filename: string) {
    const list = await refreshDrafts();
    if (!list) return;
    const found = list.find((d) => d.filename === filename);
    if (found) pick(found);
  }

  return (
    <div className="flex h-screen min-h-0">
      {/* Drafts column — Typefully's left panel */}
      <aside
        className={clsx(
          "shrink-0 border-r border-line-subtle bg-bg-base flex flex-col",
          showDrafts ? "w-[280px]" : "w-0 overflow-hidden border-r-0",
          "transition-[width] duration-200"
        )}
      >
        <div className="px-3 pt-3 pb-2 flex items-center gap-1.5">
          <div className="flex-1 flex items-center gap-2 h-9 px-2 rounded-sm hover:bg-bg-subtle transition-colors cursor-default group">
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-ink-900 to-ink-700 text-white inline-flex items-center justify-center text-[10.5px] font-semibold shadow-card">
              SH
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-semibold text-ink-900 leading-tight truncate">
                Sebastian Heine
              </div>
              <div className="text-[10.5px] text-ink-400 leading-tight truncate font-mono">
                @s3bastian_w3
              </div>
            </div>
            <ChevronDown size={12} className="text-ink-400 opacity-0 group-hover:opacity-100" />
          </div>
          <button
            title="Search"
            className="h-8 w-8 inline-flex items-center justify-center rounded-sm text-ink-500 hover:bg-bg-subtle"
          >
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
                  "h-9 -mb-px text-[11.5px] font-semibold uppercase tracking-label transition-colors capitalize border-b-2",
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
          <button
            onClick={() => setOpenNew(true)}
            className="flex items-center justify-between w-full h-9 px-2.5 rounded-sm bg-bg-surface border border-line-subtle text-[13px] text-ink-700 hover:border-line-strong hover:bg-bg-subtle transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              <Plus size={14} />
              New draft
            </span>
            <span className="text-[10px] text-ink-400 font-mono">⌘N</span>
          </button>
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
                          {d.scheduled_at && (
                            <span className="ml-1.5 inline-flex items-center gap-0.5">
                              <CalendarClock size={9} />
                              {String(d.scheduled_at).slice(5, 16)}
                            </span>
                          )}
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

        {/* Bottom secondary nav */}
        <div className="border-t border-line-subtle px-2 py-2 space-y-px">
          <NavLink href="/queue" icon={Calendar} label="Queue" />
          <NavLink href="/analytics" icon={BarChart3} label="Analytics" />
          <NavLink href="/kols" icon={Plug} label="KOLs" />
          <NavLink href="/research" icon={BookOpen} label="Research" />
          <NavLink href="/settings" icon={SettingsIcon} label="Settings" />
        </div>
      </aside>

      {/* Center: composer */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Top bar */}
        <header className="h-12 px-3 sm:px-4 border-b border-line-subtle flex items-center gap-2 bg-bg-base">
          <button
            onClick={() => setShowDrafts((v) => !v)}
            title={showDrafts ? "Hide drafts" : "Show drafts"}
            className="h-8 w-8 inline-flex items-center justify-center rounded-sm text-ink-500 hover:bg-bg-subtle"
          >
            <Menu size={15} />
          </button>
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
          {selected && (
            <>
              <button
                onClick={() => setOpenSchedule(true)}
                title="Schedule"
                className="h-8 px-2.5 sm:px-3 rounded-sm bg-warn text-white text-[12.5px] font-semibold hover:bg-warn-soft inline-flex items-center gap-1.5"
              >
                <CalendarClock size={13} />
                <span className="hidden sm:inline">
                  {selected.scheduled_at ? "Reschedule" : "Schedule"}
                </span>
              </button>
              <button
                onClick={() => save()}
                disabled={saving || !body.trim()}
                className="h-8 px-2.5 sm:px-3 rounded-sm bg-brand text-white text-[12.5px] font-semibold hover:bg-brand-soft disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          )}
          <button
            onClick={() => setShowResearch((v) => !v)}
            title={showResearch ? "Hide research" : "Show research"}
            className="h-8 w-8 hidden md:inline-flex items-center justify-center rounded-sm text-ink-500 hover:bg-bg-subtle"
          >
            {showResearch ? <PanelRightClose size={15} /> : <PanelLeftClose size={15} />}
          </button>
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

      {/* Right: research / assist tabs */}
      {showResearch && (
        <RightRail
          research={research}
          body={body}
          platform={selected?.platform || "x"}
          onApply={(s) => {
            setBody(s);
            setSavedAt(null);
          }}
        />
      )}

      <ScheduleModal
        open={openSchedule}
        onClose={() => setOpenSchedule(false)}
        initial={selected?.scheduled_at}
        onSave={(iso) => save({ scheduled_at: iso, newStatus: iso ? "approved" : status })}
      />
      <NewDraftModal
        open={openNew}
        onClose={() => setOpenNew(false)}
        onCreate={onCreated}
      />
    </div>
  );
}

function RightRail({
  research,
  body,
  platform,
  onApply,
}: {
  research: ResearchNote | null;
  body: string;
  platform: string;
  onApply: (s: string) => void;
}) {
  const [tab, setTab] = useState<"research" | "assist">("research");
  return (
    <aside className="hidden md:flex w-[380px] shrink-0 border-l border-line-subtle flex-col bg-bg-base">
      <header className="h-12 px-5 border-b border-line-subtle flex items-center gap-4">
        <button
          onClick={() => setTab("research")}
          className={clsx(
            "h-12 -mb-px text-[11.5px] font-semibold uppercase tracking-label transition-colors border-b-2",
            tab === "research"
              ? "text-ink-900 border-ink-900"
              : "text-ink-400 border-transparent hover:text-ink-700"
          )}
        >
          Research
          {research && (
            <span className="ml-1.5 font-mono text-[10px] normal-case tracking-normal text-ink-400">
              {research.date.slice(5)}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("assist")}
          className={clsx(
            "h-12 -mb-px text-[11.5px] font-semibold uppercase tracking-label transition-colors border-b-2 inline-flex items-center gap-1.5",
            tab === "assist"
              ? "text-ink-900 border-ink-900"
              : "text-ink-400 border-transparent hover:text-ink-700"
          )}
        >
          AI assist
        </button>
        {tab === "research" && (
          <a
            href="/research"
            className="ml-auto text-[12px] text-brand hover:underline"
          >
            all
          </a>
        )}
      </header>
      <div className="flex-1 overflow-y-auto">
        {tab === "research" ? (
          <div className="px-5 py-4">
            {research ? (
              <MarkdownView body={stripFrontmatter(research.body)} />
            ) : (
              <p className="text-[13px] text-ink-400 italic">
                Run <code className="font-mono text-brand">research-run</code> to
                generate today's note.
              </p>
            )}
          </div>
        ) : (
          <AssistPanel body={body} platform={platform} onApply={onApply} />
        )}
      </div>
    </aside>
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
