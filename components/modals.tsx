"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import clsx from "clsx";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-ink-900/15 backdrop-blur-[1px] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-bg-surface border border-line-subtle rounded-md shadow-lg w-full max-w-md overflow-hidden"
      >
        <header className="flex items-center justify-between h-11 px-4 border-b border-line-subtle">
          <h2 className="text-[14px] font-semibold text-ink-900">{title}</h2>
          <button
            onClick={onClose}
            className="h-7 w-7 inline-flex items-center justify-center rounded-xs text-ink-500 hover:bg-bg-subtle"
          >
            <X size={14} />
          </button>
        </header>
        <div className="px-4 py-4">{children}</div>
        {footer && (
          <div className="px-4 py-3 border-t border-line-subtle bg-bg-base flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Schedule picker ──────────────────────────────────────────────

function localISO(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const PRESETS: { label: string; offsetMin: number; weekday?: number; hour?: number }[] = [
  { label: "in 1 hour", offsetMin: 60 },
  { label: "in 4 hours", offsetMin: 240 },
  { label: "tomorrow 9am", offsetMin: 0, weekday: -1, hour: 9 },
  { label: "next Monday 9am", offsetMin: 0, weekday: 1, hour: 9 },
];

function presetTime(p: (typeof PRESETS)[number]): Date {
  const now = new Date();
  if (p.weekday === -1 && typeof p.hour === "number") {
    const d = new Date(now);
    d.setDate(now.getDate() + 1);
    d.setHours(p.hour, 0, 0, 0);
    return d;
  }
  if (typeof p.weekday === "number" && p.weekday >= 0 && typeof p.hour === "number") {
    const d = new Date(now);
    const dow = now.getDay();
    let add = (p.weekday - dow + 7) % 7;
    if (add === 0) add = 7;
    d.setDate(now.getDate() + add);
    d.setHours(p.hour, 0, 0, 0);
    return d;
  }
  return new Date(now.getTime() + p.offsetMin * 60_000);
}

export function ScheduleModal({
  open,
  onClose,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial?: string | null;
  onSave: (iso: string | null) => void;
}) {
  const [value, setValue] = useState<string>(() => {
    if (initial) {
      try {
        return localISO(new Date(initial));
      } catch {
        return localISO(new Date(Date.now() + 3600_000));
      }
    }
    return localISO(new Date(Date.now() + 3600_000));
  });
  useEffect(() => {
    if (!open) return;
    setValue(
      initial
        ? localISO(new Date(initial))
        : localISO(new Date(Date.now() + 3600_000))
    );
  }, [open, initial]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule post"
      footer={
        <>
          <button
            onClick={() => {
              onSave(null);
              onClose();
            }}
            className="h-8 px-3 rounded-sm text-[12.5px] text-ink-500 hover:text-ink-900 hover:bg-bg-subtle"
          >
            Clear schedule
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="h-8 px-3 rounded-sm border border-line-strong text-[12.5px] text-ink-700 hover:bg-bg-subtle"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const iso = new Date(value).toISOString();
              onSave(iso);
              onClose();
            }}
            className="h-8 px-3 rounded-sm bg-brand text-white text-[12.5px] font-semibold hover:bg-brand-soft"
          >
            Save schedule
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="text-[10.5px] uppercase tracking-label text-ink-400 font-semibold">
            Date and time (local)
          </label>
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-1.5 w-full h-9 px-2.5 rounded-sm border border-line-subtle bg-bg-base text-ink-900 text-[13.5px] focus:outline-none focus:border-line-strong"
          />
        </div>
        <div>
          <div className="text-[10.5px] uppercase tracking-label text-ink-400 font-semibold mb-1.5">
            Presets
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setValue(localISO(presetTime(p)))}
                className="h-7 px-2.5 rounded-xs text-[12px] border border-line-subtle text-ink-700 hover:border-line-strong hover:bg-bg-subtle"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── New draft picker ─────────────────────────────────────────────

export function NewDraftModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (filename: string) => void;
}) {
  const [platform, setPlatform] = useState<"x" | "linkedin">("x");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setSlug("");
      setPlatform("x");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  async function go() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, slug: slug || "draft" }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { filename } = await res.json();
      onCreate(filename);
      onClose();
    } catch (e: any) {
      alert("Failed to create draft: " + (e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New draft"
      footer={
        <>
          <button
            onClick={onClose}
            className="h-8 px-3 rounded-sm border border-line-strong text-[12.5px] text-ink-700 hover:bg-bg-subtle"
          >
            Cancel
          </button>
          <button
            onClick={go}
            disabled={busy}
            className="h-8 px-3 rounded-sm bg-brand text-white text-[12.5px] font-semibold hover:bg-brand-soft disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create & open"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <div className="text-[10.5px] uppercase tracking-label text-ink-400 font-semibold mb-1.5">
            Platform
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPlatform("x")}
              className={clsx(
                "h-16 rounded-sm border text-[13px] font-medium transition-colors flex flex-col items-center justify-center gap-1",
                platform === "x"
                  ? "border-ink-900 bg-ink-900 text-white"
                  : "border-line-subtle bg-bg-base text-ink-700 hover:border-line-strong"
              )}
            >
              <span className="text-[15px] font-semibold">X</span>
              <span className="text-[10.5px] opacity-70">≤ 280 chars · plaintext</span>
            </button>
            <button
              onClick={() => setPlatform("linkedin")}
              className={clsx(
                "h-16 rounded-sm border text-[13px] font-medium transition-colors flex flex-col items-center justify-center gap-1",
                platform === "linkedin"
                  ? "border-[#0a66c2] bg-[#0a66c2] text-white"
                  : "border-line-subtle bg-bg-base text-ink-700 hover:border-line-strong"
              )}
            >
              <span className="text-[15px] font-semibold">in</span>
              <span className="text-[10.5px] opacity-70">assist mode · Unicode formatter</span>
            </button>
          </div>
        </div>
        <div>
          <label className="text-[10.5px] uppercase tracking-label text-ink-400 font-semibold">
            Slug (optional)
          </label>
          <input
            ref={inputRef}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go()}
            placeholder="mica-update"
            className="mt-1.5 w-full h-9 px-2.5 rounded-sm border border-line-subtle bg-bg-base text-ink-900 text-[13.5px] placeholder:text-ink-300 focus:outline-none focus:border-line-strong"
          />
          <p className="mt-1 text-[11.5px] text-ink-400">
            File name: <code className="font-mono text-ink-500">YYYY-MM-DD-{slug || "draft"}-{platform}.md</code>
          </p>
        </div>
      </div>
    </Modal>
  );
}
