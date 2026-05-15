"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import {
  applyTransform,
  toBold,
  toItalic,
  toBoldItalic,
  toPlain,
  toBulletList,
  toNumberedList,
  stripMarkdown,
} from "@/lib/li-format";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Eraser,
  Copy,
  RotateCcw,
  ThumbsUp,
  MessageCircle,
  Repeat2,
  Send,
  Globe,
} from "lucide-react";
import clsx from "clsx";

const STORAGE_KEY = "li-formatter-v1";
const LINKEDIN_LIMIT = 3000;
const TRUNCATE_AT = 210;

export default function FormatPage() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setText(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, text);
    } catch {}
  }, [text]);

  function getSelection() {
    const ta = ref.current;
    if (!ta) return { start: text.length, end: text.length };
    return { start: ta.selectionStart, end: ta.selectionEnd };
  }

  function applyToSelection(fn: (s: string) => string) {
    const { start, end } = getSelection();
    const target = start === end ? { start: 0, end: text.length } : { start, end };
    const { value, selStart, selEnd } = applyTransform(text, target.start, target.end, fn);
    setText(value);
    requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.setSelectionRange(selStart, selEnd);
    });
  }

  function applyToLines(fn: (lines: string[]) => string[]) {
    const ta = ref.current;
    if (!ta) {
      const transformed = fn(text.split("\n")).join("\n");
      setText(transformed);
      return;
    }
    const { start, end } = getSelection();
    const range =
      start === end
        ? { start: 0, end: text.length }
        : {
            start: text.lastIndexOf("\n", start - 1) + 1,
            end: (() => {
              const i = text.indexOf("\n", end);
              return i === -1 ? text.length : i;
            })(),
          };
    const block = text.slice(range.start, range.end);
    const transformed = fn(block.split("\n")).join("\n");
    const newText = text.slice(0, range.start) + transformed + text.slice(range.end);
    setText(newText);
    requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.setSelectionRange(range.start, range.start + transformed.length);
    });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  }

  function clearAll() {
    if (text.trim() && !window.confirm("Clear the formatter?")) return;
    setText("");
    requestAnimationFrame(() => ref.current?.focus());
  }

  const charCount = useMemo(() => [...text].length, [text]);
  const charColor =
    charCount > 2700
      ? "text-danger"
      : charCount > 1500
      ? "text-warn"
      : "text-ink-400";

  return (
    <div>
      <PageHeader label="LinkedIn formatter" title="Format & preview" />
      <div className="px-6 py-4 max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col min-w-0">
          <Toolbar
            onBold={() => applyToSelection(toBold)}
            onItalic={() => applyToSelection(toItalic)}
            onBoldItalic={() => applyToSelection(toBoldItalic)}
            onPlain={() => applyToSelection(toPlain)}
            onBullet={() => applyToLines(toBulletList)}
            onNumbered={() => applyToLines(toNumberedList)}
            onStrip={() => setText(stripMarkdown(text))}
            onClear={clearAll}
          />
          <textarea
            ref={ref}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your LinkedIn draft (markdown OK). Select text and click Bold / Italic to apply Unicode styling that renders on LinkedIn."
            spellCheck={false}
            className="mt-2 w-full h-[60vh] resize-y bg-bg-surface border border-line-subtle rounded-md p-4 text-[14px] leading-6 font-sans text-ink-900 placeholder:text-ink-300 focus:outline-none focus:border-brand"
          />
          <div className="flex items-center justify-between mt-2 text-[11.5px]">
            <div className="flex items-center gap-2">
              <span className={clsx("font-mono", charColor)}>
                {charCount.toLocaleString()} / {LINKEDIN_LIMIT.toLocaleString()}
              </span>
              {charCount > 2700 && charCount <= LINKEDIN_LIMIT && (
                <span className="text-danger uppercase tracking-label font-semibold">
                  near LinkedIn limit
                </span>
              )}
              {charCount > LINKEDIN_LIMIT && (
                <span className="text-danger uppercase tracking-label font-semibold">
                  over {LINKEDIN_LIMIT.toLocaleString()} limit
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={copy}
                disabled={!text}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-sm bg-brand text-white text-[12.5px] font-semibold hover:bg-brand-soft disabled:opacity-40"
              >
                <Copy size={13} />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center justify-between h-9 mb-2">
            <span className="text-[10.5px] uppercase tracking-label text-ink-400 font-semibold">
              LinkedIn preview
            </span>
            <span className="text-[11px] text-ink-400">Personal feed</span>
          </div>
          <LinkedInPreview text={text} />
          <p className="mt-3 text-[11.5px] text-ink-400 leading-snug">
            LinkedIn truncates personal-feed posts after ~210 chars and renders
            Unicode bold / italic as styled text. Markdown (<code className="font-mono text-ink-500">**</code>,{" "}
            <code className="font-mono text-ink-500">*</code>,{" "}
            <code className="font-mono text-ink-500">#</code>) is not rendered —
            apply the Bold / Italic toolbar buttons or "Strip MD" before
            pasting.
          </p>
        </div>
      </div>
    </div>
  );
}

function Toolbar({
  onBold,
  onItalic,
  onBoldItalic,
  onPlain,
  onBullet,
  onNumbered,
  onStrip,
  onClear,
}: {
  onBold: () => void;
  onItalic: () => void;
  onBoldItalic: () => void;
  onPlain: () => void;
  onBullet: () => void;
  onNumbered: () => void;
  onStrip: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap bg-bg-surface border border-line-subtle rounded-md p-1.5">
      <ToolBtn onClick={onBold} title="Bold (selection or whole text)">
        <Bold size={13} />
        Bold
      </ToolBtn>
      <ToolBtn onClick={onItalic} title="Italic (selection or whole text)">
        <Italic size={13} />
        Italic
      </ToolBtn>
      <ToolBtn onClick={onBoldItalic} title="Bold italic (selection or whole text)">
        <span className="font-bold italic text-[12px] leading-none w-3 inline-block text-center">
          B
        </span>
        Bold italic
      </ToolBtn>
      <ToolBtn onClick={onPlain} title="Convert styled selection back to plain ASCII">
        <RotateCcw size={12} />
        Plain
      </ToolBtn>
      <Sep />
      <ToolBtn onClick={onBullet} title="Convert lines to • bullets">
        <List size={13} />
        Bullets
      </ToolBtn>
      <ToolBtn onClick={onNumbered} title="Convert lines to 1. 2. 3. numbered list">
        <ListOrdered size={13} />
        Numbered
      </ToolBtn>
      <Sep />
      <ToolBtn onClick={onStrip} title="Strip markdown syntax (whole document)">
        <Eraser size={13} />
        Strip MD
      </ToolBtn>
      <span className="flex-1 min-w-2" />
      <ToolBtn onClick={onClear} title="Clear all" muted>
        Clear
      </ToolBtn>
    </div>
  );
}

function Sep() {
  return <span className="w-px h-5 bg-line-subtle mx-1" aria-hidden />;
}

function ToolBtn({
  children,
  onClick,
  title,
  muted = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  muted?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      type="button"
      className={clsx(
        "inline-flex items-center gap-1.5 px-2 h-7 rounded-sm border text-[12px] font-medium transition-colors",
        muted
          ? "border-line-subtle text-ink-400 hover:bg-bg-subtle hover:text-ink-700"
          : "border-line-subtle text-ink-700 hover:bg-bg-subtle"
      )}
    >
      {children}
    </button>
  );
}

function LinkedInPreview({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    setExpanded(false);
  }, [text]);

  const chars = useMemo(() => Array.from(text), [text]);
  const truncated = !expanded && chars.length > TRUNCATE_AT;
  const visibleText = truncated ? chars.slice(0, TRUNCATE_AT).join("").replace(/\s+$/, "") : text;

  return (
    <div className="rounded-lg border border-line-strong bg-white shadow-card overflow-hidden">
      <div className="flex items-start gap-2 px-4 pt-3 pb-2">
        <div
          className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0a66c2] to-[#1f4e8f] text-white inline-flex items-center justify-center font-semibold text-[18px] shrink-0"
          aria-hidden
        >
          SH
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold text-[#000000e6] leading-tight truncate">
            Sebastian Heine
          </div>
          <div className="text-[12px] text-[#00000099] leading-tight mt-0.5 truncate">
            Founder, sheine.ai · Crypto compliance for VASPs
          </div>
          <div className="text-[12px] text-[#00000099] leading-tight mt-0.5 inline-flex items-center gap-1">
            now · <Globe size={11} />
          </div>
        </div>
      </div>

      <div className="px-4 pb-3">
        {text.trim() ? (
          <div className="text-[14px] text-[#000000e6] leading-[1.5] whitespace-pre-wrap break-words font-sans">
            {visibleText}
            {truncated && (
              <>
                …{" "}
                <button
                  onClick={() => setExpanded(true)}
                  className="text-[#00000099] hover:text-[#0a66c2] hover:underline font-medium"
                  type="button"
                >
                  see more
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="text-[13px] text-[#00000066] italic">
            Your formatted post will preview here.
          </div>
        )}
      </div>

      <div className="border-t border-[#0000001a] px-4 py-1.5 flex items-center justify-around text-[12.5px] text-[#00000099] font-semibold">
        <FauxAction icon={ThumbsUp} label="Like" />
        <FauxAction icon={MessageCircle} label="Comment" />
        <FauxAction icon={Repeat2} label="Repost" />
        <FauxAction icon={Send} label="Send" />
      </div>
    </div>
  );
}

function FauxAction({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1.5">
      <Icon size={16} strokeWidth={2} />
      <span>{label}</span>
    </span>
  );
}
