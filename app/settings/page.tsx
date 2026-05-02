"use client";

import { useState } from "react";
import { Empty } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import {
  Sparkles,
  PenLine,
  CalendarClock,
  Mail,
  ScrollText,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

type Cmd = {
  id: string;
  label: string;
  desc: string;
  icon: any;
};

const COMMANDS: Cmd[] = [
  {
    id: "research-run",
    label: "research-run",
    desc: "Pull X scanner + scan-regulatory + Telegram + Gmail snapshot → write today's research note.",
    icon: ScrollText,
  },
  {
    id: "research-draft",
    label: "research-draft",
    desc: "LLM-draft 2-3 X + 1 LinkedIn candidates from the latest research note.",
    icon: PenLine,
  },
  {
    id: "social-due",
    label: "social-due (dry-run)",
    desc: "List approved drafts past their scheduled_at. Dry-run only from the UI; flip to a real run via launchd.",
    icon: CalendarClock,
  },
  {
    id: "refresh-gmail-snapshot",
    label: "refresh-gmail-snapshot",
    desc: "Headless `claude -p` calls the Gmail MCP to refresh the newsletter snapshot.",
    icon: Mail,
  },
  {
    id: "x-digest",
    label: "x-digest",
    desc: "Write today's `00-memory/x-scan-YYYY-MM-DD.md` digest (mentions + niche queries + own engagement).",
    icon: Sparkles,
  },
];

type RunState =
  | { status: "idle" }
  | { status: "running"; startedAt: number }
  | { status: "ok"; stdout: string; stderr: string; durationMs: number }
  | { status: "err"; stdout: string; stderr: string; code: number | null; durationMs: number };

export default function SettingsPage() {
  const [runs, setRuns] = useState<Record<string, RunState>>({});

  async function fire(cmd: string) {
    setRuns((r) => ({ ...r, [cmd]: { status: "running", startedAt: Date.now() } }));
    try {
      const t0 = Date.now();
      const res = await fetch(`/api/run/${cmd}`, { method: "POST" });
      const data = await res.json();
      const durationMs = Date.now() - t0;
      setRuns((r) => ({
        ...r,
        [cmd]: data.ok
          ? { status: "ok", stdout: data.stdout, stderr: data.stderr, durationMs }
          : { status: "err", stdout: data.stdout, stderr: data.stderr, code: data.code, durationMs },
      }));
    } catch (e: any) {
      setRuns((r) => ({
        ...r,
        [cmd]: { status: "err", stdout: "", stderr: String(e?.message || e), code: -1, durationMs: 0 },
      }));
    }
  }

  return (
    <div>
      <PageHeader label="Settings" title="Pipeline runs + configuration" />
      <div className="px-6 py-6 max-w-3xl mx-auto">
        <h2 className="text-[10.5px] uppercase tracking-label text-ink-400 font-semibold mb-3">
          Run commands
        </h2>
        <p className="text-[13px] text-ink-500 mb-4">
          One-click triggers for the pipeline scripts. They run server-side under your
          shell — same as invoking from the terminal. No external posting happens here;
          posting goes through the composer.
        </p>

        <div className="space-y-2">
          {COMMANDS.map((c) => {
            const state = runs[c.id] || { status: "idle" };
            return (
              <div
                key={c.id}
                className="bg-bg-surface border border-line-subtle rounded-md shadow-card p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-sm bg-bg-subtle border border-line-subtle text-ink-500 inline-flex items-center justify-center shrink-0">
                    <c.icon size={16} strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[13px] text-ink-900">{c.label}</span>
                      {state.status === "running" && (
                        <Loader2 size={12} className="animate-spin text-ink-500" />
                      )}
                      {state.status === "ok" && (
                        <CheckCircle2 size={13} className="text-success" />
                      )}
                      {state.status === "err" && (
                        <XCircle size={13} className="text-danger" />
                      )}
                      {(state.status === "ok" || state.status === "err") && (
                        <span className="text-[11px] font-mono text-ink-400">
                          {Math.round(state.durationMs / 100) / 10}s
                          {state.status === "err" && state.code !== null && ` · exit ${state.code}`}
                        </span>
                      )}
                    </div>
                    <p className="text-[12.5px] text-ink-500 mt-1 leading-snug">{c.desc}</p>
                  </div>
                  <button
                    onClick={() => fire(c.id)}
                    disabled={state.status === "running"}
                    className="h-8 px-3 rounded-sm bg-brand text-white text-[12.5px] font-semibold hover:bg-brand-soft disabled:opacity-50"
                  >
                    {state.status === "running" ? "Running…" : "Run"}
                  </button>
                </div>
                {(state.status === "ok" || state.status === "err") &&
                  (state.stdout || state.stderr) && (
                    <details className="mt-3" open={state.status === "err"}>
                      <summary className="cursor-pointer text-[11.5px] uppercase tracking-label text-ink-400 font-semibold">
                        Output
                      </summary>
                      {state.stdout && (
                        <pre className="mt-2 bg-bg-base border border-line-subtle rounded-xs p-2 text-[11.5px] font-mono text-ink-700 max-h-60 overflow-auto whitespace-pre-wrap break-all">
                          {state.stdout}
                        </pre>
                      )}
                      {state.stderr && (
                        <pre className="mt-2 bg-danger/5 border border-danger/30 rounded-xs p-2 text-[11.5px] font-mono text-danger max-h-60 overflow-auto whitespace-pre-wrap break-all">
                          {state.stderr}
                        </pre>
                      )}
                    </details>
                  )}
              </div>
            );
          })}
        </div>

        <h2 className="text-[10.5px] uppercase tracking-label text-ink-400 font-semibold mt-8 mb-3">
          Voice rules
        </h2>
        <div className="bg-bg-surface border border-line-subtle rounded-md shadow-card p-4 text-[13px] text-ink-500">
          Banned words live in <code className="font-mono text-ink-900">app/composer.tsx</code>{" "}
          (BANNED constant). Editable list comes in a future iteration.
        </div>

        <h2 className="text-[10.5px] uppercase tracking-label text-ink-400 font-semibold mt-8 mb-3">
          Keyboard shortcuts
        </h2>
        <div className="bg-bg-surface border border-line-subtle rounded-md shadow-card p-4">
          <ul className="text-[13px] text-ink-700 space-y-1.5">
            <Shortcut keys="⌘N">New draft</Shortcut>
            <Shortcut keys="⌘S">Save current draft</Shortcut>
            <Shortcut keys="⌘K">Toggle drafts panel</Shortcut>
            <Shortcut keys="⌘.">Toggle research panel</Shortcut>
            <Shortcut keys="⌘1 / ⌘2 / ⌘3">Switch tabs (Drafts / Scheduled / Posted)</Shortcut>
            <Shortcut keys="esc">Close modal</Shortcut>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Shortcut({ keys, children }: { keys: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between">
      <span>{children}</span>
      <kbd className="font-mono text-[11.5px] text-ink-500 bg-bg-base border border-line-subtle rounded-xs px-1.5 py-0.5">
        {keys}
      </kbd>
    </li>
  );
}
