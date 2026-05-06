"use client";

import { useRef, useState, useEffect } from "react";
import {
  Bold,
  Italic,
  List,
  Link as LinkIcon,
  RotateCcw,
  Save,
  CalendarClock,
  Quote,
} from "lucide-react";
import { Button, Empty, PlatformBadge, StatusBadge } from "@/components/ui";
import {
  applyTransform,
  toBold,
  toItalic,
  toPlain,
} from "@/lib/li-format";
import type { Draft } from "@/lib/drafts";

const X_LIMIT = 280;
// UI highlight subset. Canonical list lives in
// ~/agent-harness/tools/humanize/banned-words.json (ui_highlight_subset).
// We fetch /api/voice-rules at mount and update; this fallback is used
// only if the fetch fails.
const BANNED_FALLBACK = [
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
  "ecosystem",
  "holistic",
  "paradigm",
  "synergy",
  "innovative",
  "innovation",
  "transformative",
  "empower",
  "streamline",
];

type Props = {
  selected: Draft | null;
  reviewable: Draft[];
  onPick: (d: Draft) => void;
  body: string;
  setBody: (s: string) => void;
  status: string;
  setStatus: (s: string) => void;
  saving: boolean;
  savedAt: string | null;
  save: (opts?: { newStatus?: string; scheduled_at?: string | null; quote_tweet_url?: string | null }) => void;
};

const X_URL_RE = /https?:\/\/(?:x|twitter)\.com\/[^/\s]+\/status\/(\d+)/i;

export function ComposerCanvas({
  selected,
  reviewable,
  onPick,
  body,
  setBody,
  status,
  setStatus,
  saving,
  savedAt,
  save,
}: Props) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const [banned, setBanned] = useState<string[]>(BANNED_FALLBACK);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/voice-rules")
      .then((r) => r.ok ? r.json() : null)
      .then((doc) => {
        if (!cancelled && doc?.ui_highlight_subset && Array.isArray(doc.ui_highlight_subset)) {
          setBanned(doc.ui_highlight_subset);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!selected) {
    return (
      <div className="flex-1 overflow-y-auto px-10 py-7">
        <Empty>
          No reviewable drafts. Generate via{" "}
          <code className="font-mono text-brand">research-draft</code> or write
          one with <code className="font-mono text-brand">social-draft</code>.
        </Empty>
      </div>
    );
  }

  const xCount = body.length;
  const xOver = selected.platform === "x" && xCount > X_LIMIT;

  // Detect an X URL inside the body — offer to convert into a quote tweet.
  const detectedXUrl = selected.platform === "x" && !selected.quote_tweet_url
    ? (body.match(X_URL_RE)?.[0] ?? null)
    : null;

  function makeQuoteTweet() {
    if (!detectedXUrl) return;
    const stripped = body.replace(X_URL_RE, "").replace(/\s{2,}/g, " ").trim();
    setBody(stripped);
    save({ quote_tweet_url: detectedXUrl });
  }

  function transformSel(fn: (s: string) => string) {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const { value, selStart, selEnd } = applyTransform(body, start, end, fn);
    setBody(value);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(selStart, selEnd);
    });
  }

  function insertList() {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = body.slice(0, start);
    const sel = body.slice(start, end) || "item";
    const after = body.slice(end);
    const lines = sel.split("\n").map((l) => (l.trim() ? `• ${l}` : l)).join("\n");
    setBody(before + lines + after);
  }

  function insertLink() {
    const url = prompt("URL:");
    if (!url) return;
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = body.slice(0, start);
    const sel = body.slice(start, end);
    const after = body.slice(end);
    if (selected.platform === "linkedin") {
      // LinkedIn rendering puts the URL inline; pair with selected text.
      setBody(before + (sel ? `${sel} (${url})` : url) + after);
    } else {
      // X: just inline the URL.
      setBody(before + (sel ? `${sel} ${url}` : url) + after);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-8 py-6">
        {/* Picker — segmented chips */}
        {reviewable.length > 1 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {reviewable.slice(0, 12).map((d) => (
              <button
                key={d.filename}
                onClick={() => onPick(d)}
                className={
                  "h-7 px-2.5 rounded-sm text-[11.5px] border transition-all " +
                  (selected.filename === d.filename
                    ? "bg-ink-900 border-ink-900 text-white"
                    : "bg-bg-surface border-line-subtle text-ink-500 hover:border-line-strong hover:text-ink-900")
                }
              >
                <span className="font-mono mr-1.5 opacity-70">
                  {d.platform === "x" ? "X" : "LI"}
                </span>
                {d.slug || d.filename.slice(0, 22)}
              </button>
            ))}
          </div>
        )}

        {/* Context strip */}
        {(selected.based_on || selected.reply_to_id || selected.source_label || selected.source_url || selected.quote_tweet_url) && (
          <div className="mb-3 space-y-1">
            {selected.reply_to_id && (
              <p className="text-[12px] text-brand">
                ↳ Replying to{" "}
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
            {selected.quote_tweet_url && (
              <p className="text-[12px] text-warn">
                ◳ Quote-tweeting{" "}
                <a
                  href={selected.quote_tweet_url}
                  target="_blank"
                  rel="noopener"
                  className="font-mono hover:underline"
                >
                  {selected.quote_tweet_url.replace("https://", "")}
                </a>
              </p>
            )}
          </div>
        )}

        {/* COMPOSER CARD */}
        <div className="bg-bg-surface border border-line-subtle rounded-md shadow-card overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-0.5 px-2 h-9 border-b border-line-subtle bg-bg-base">
            {selected.platform === "linkedin" ? (
              <>
                <ToolBtn label="Bold (Unicode)" onClick={() => transformSel(toBold)}>
                  <Bold size={14} strokeWidth={2.25} />
                </ToolBtn>
                <ToolBtn label="Italic (Unicode)" onClick={() => transformSel(toItalic)}>
                  <Italic size={14} strokeWidth={2.25} />
                </ToolBtn>
                <ToolBtn label="Plain text" onClick={() => transformSel(toPlain)}>
                  <RotateCcw size={14} strokeWidth={2} />
                </ToolBtn>
                <Sep />
                <ToolBtn label="Bullet list" onClick={insertList}>
                  <List size={14} />
                </ToolBtn>
                <ToolBtn label="Insert link" onClick={insertLink}>
                  <LinkIcon size={14} />
                </ToolBtn>
                <span className="ml-auto text-[10.5px] uppercase tracking-label text-ink-400 mr-2">
                  LinkedIn formatting · Unicode glyphs
                </span>
              </>
            ) : (
              <>
                <ToolBtn label="Insert link" onClick={insertLink}>
                  <LinkIcon size={14} />
                </ToolBtn>
                <span className="ml-auto text-[10.5px] uppercase tracking-label text-ink-400 mr-2">
                  X · plaintext, no formatting
                </span>
              </>
            )}
          </div>

          {/* Textarea */}
          <textarea
            ref={ref}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              selected.platform === "x"
                ? "Write your X post here. ≤ 280 chars."
                : "Write your LinkedIn post here. Lead with the punchline; line breaks > bullets."
            }
            className="w-full min-h-[260px] px-5 py-4 bg-bg-surface text-ink-900 text-[15px] leading-[1.55] resize-y focus:outline-none placeholder:text-ink-300"
          />

          {/* Quote-tweet detection banner */}
          {detectedXUrl && (
            <div className="px-3 py-2 border-t border-line-subtle bg-warn/5 flex items-center gap-2">
              <Quote size={13} className="text-warn shrink-0" />
              <span className="text-[12px] text-ink-700">
                Detected an X URL in the body. Convert to a quote tweet?
              </span>
              <span className="font-mono text-[10.5px] text-ink-400 truncate flex-1">
                {detectedXUrl.replace("https://", "")}
              </span>
              <button
                onClick={makeQuoteTweet}
                className="h-6 px-2 rounded-xs bg-warn text-white text-[11px] font-semibold hover:bg-warn-soft"
              >
                Make quote
              </button>
            </div>
          )}
          {/* Footer: counter + schedule + save indicator */}
          <div className="flex items-center justify-between px-3 h-9 border-t border-line-subtle bg-bg-base text-[11.5px]">
            <div className="flex items-center gap-3">
              {selected.platform === "x" ? (
                <CharArc count={xCount} limit={X_LIMIT} />
              ) : (
                <span className="text-ink-500 font-mono">
                  {wordCount(body)} words · {body.length} chars
                </span>
              )}
              {savedAt && (
                <span className="text-success font-medium">saved {timeAgo(savedAt)}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-ink-400">
              <CalendarClock size={11} />
              {selected.scheduled_at ? (
                <span className="font-mono">{selected.scheduled_at}</span>
              ) : (
                <span className="italic">no schedule</span>
              )}
            </div>
          </div>
        </div>

        {/* Live preview */}
        <Preview platform={selected.platform} body={body} />

        {/* Source attribution — always visible below the draft */}
        {(selected.source_url || selected.source_label || selected.based_on) && (
          <div className="mt-4 border-l-2 border-line-strong pl-3 py-1.5">
            <div className="text-[10.5px] uppercase tracking-label text-ink-400 font-semibold mb-0.5">
              Source
            </div>
            {selected.source_label && (
              <p className="text-[12px] text-ink-700">{selected.source_label}</p>
            )}
            {selected.source_url && (
              <a
                href={selected.source_url}
                target="_blank"
                rel="noopener"
                className="text-[11.5px] text-brand font-mono hover:underline break-all"
              >
                {selected.source_url}
              </a>
            )}
            {!selected.source_label && selected.based_on && (
              <p className="text-[12px] text-ink-500 italic">{selected.based_on}</p>
            )}
          </div>
        )}

        {/* Voice lints */}
        <VoiceLints body={body} banned={banned} />

        {/* Action bar */}
        <div className="mt-6 flex items-center gap-2">
          <Button onClick={() => save()} disabled={saving} variant="secondary" className="!h-10">
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
              className="!h-10 !px-4"
            >
              {selected.platform === "linkedin" ? "Approve for assist" : "Approve"}
            </Button>
          ) : (
            <Button
              onClick={() => {
                setStatus("pending");
                save({ newStatus: "pending" });
              }}
              disabled={saving}
              className="!h-10"
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
            className="!h-10 ml-auto"
          >
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}

function ToolBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className="h-7 w-7 inline-flex items-center justify-center rounded-xs text-ink-500 hover:bg-bg-subtle hover:text-ink-900 transition-colors"
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="mx-1 w-px h-4 bg-line-subtle" />;
}

function CharArc({ count, limit }: { count: number; limit: number }) {
  const pct = Math.min(1, count / limit);
  const radius = 8;
  const stroke = 2;
  const c = 2 * Math.PI * radius;
  const offset = c - pct * c;
  const over = count > limit;
  const remaining = limit - count;
  const color = over ? "#dc2626" : remaining < 20 ? "#d97706" : "#52525b";
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width="20" height="20" viewBox="0 0 20 20" className="-rotate-90">
        <circle cx="10" cy="10" r={radius} stroke="#e4e4e7" strokeWidth={stroke} fill="none" />
        <circle
          cx="10"
          cy="10"
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="font-mono text-ink-500" style={{ color }}>
        {over ? `+${count - limit} over` : `${remaining} left`}
      </span>
    </span>
  );
}

function Preview({ platform, body }: { platform: string; body: string }) {
  if (!body.trim()) return null;
  return (
    <div className="mt-5">
      <div className="text-[10.5px] uppercase tracking-label text-ink-400 mb-2 px-1">
        Preview · {platform === "linkedin" ? "LinkedIn" : "X"}
      </div>
      {platform === "linkedin" ? <LinkedInPreview body={body} /> : <XPreview body={body} />}
    </div>
  );
}

function XPreview({ body }: { body: string }) {
  return (
    <div className="bg-bg-surface border border-line-subtle rounded-md p-4 shadow-card">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-ink-900 text-white flex items-center justify-center font-semibold text-sm shrink-0">
          S
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 text-[13.5px]">
            <span className="font-semibold text-ink-900">Sebastian Heine</span>
            <span className="text-ink-400">@s3bastian_w3</span>
            <span className="text-ink-400">·</span>
            <span className="text-ink-400">now</span>
          </div>
          <p className="mt-1 text-[14.5px] leading-[1.45] text-ink-900 whitespace-pre-wrap break-words">
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}

function LinkedInPreview({ body }: { body: string }) {
  // Truncate body at the typical LinkedIn 'see more' threshold (~210 chars
  // before line breaks compress; using char-count for simplicity).
  const SEE_MORE = 210;
  const isLong = body.length > SEE_MORE;
  return (
    <div className="bg-white border border-[#e6e6e6] rounded-[10px] shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)] overflow-hidden font-sans">
      {/* Author row */}
      <div className="px-4 pt-3 pb-2 flex items-start gap-2">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0a66c2] to-[#004182] text-white flex items-center justify-center font-semibold shrink-0 text-[15px]">
          SH
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold text-[#000000e6] leading-tight hover:underline cursor-pointer">
            Sebastian Heine
          </div>
          <div className="text-[12px] text-[#00000099] leading-tight truncate">
            CCO &amp; MLRO · sheine.ai · author of The SHeine Brief
          </div>
          <div className="text-[12px] text-[#00000099] leading-tight mt-0.5 inline-flex items-center gap-1">
            <span>now</span>
            <span>·</span>
            <span aria-label="Visible to anyone">🌐</span>
          </div>
        </div>
        <button className="text-[#00000099] hover:bg-[#0000000a] rounded-full w-8 h-8 inline-flex items-center justify-center text-[18px] leading-none">
          ⋯
        </button>
      </div>

      {/* Body */}
      <div className="px-4 pb-3">
        <p className="text-[14px] leading-[1.43] text-[#000000e6] whitespace-pre-wrap break-words">
          {isLong ? (
            <>
              {body.slice(0, SEE_MORE)}
              <span className="text-[#00000099]">…</span>{" "}
              <span className="text-[#00000099] hover:underline cursor-pointer text-[13.5px]">
                see more
              </span>
            </>
          ) : (
            body
          )}
        </p>
      </div>

      {/* Reaction count strip */}
      <div className="px-4 py-1.5 flex items-center justify-between text-[12px] text-[#00000099] border-t border-[#0000000d]">
        <span className="inline-flex items-center gap-0.5">
          <span className="inline-block w-4 h-4 rounded-full bg-[#0a66c2] text-white text-[9px] inline-flex items-center justify-center">
            👍
          </span>
          <span className="hover:underline cursor-pointer">12</span>
        </span>
        <span className="hover:underline cursor-pointer">2 comments</span>
      </div>

      {/* Action bar */}
      <div className="grid grid-cols-4 border-t border-[#0000000d]">
        {[
          { label: "Like", icon: "👍" },
          { label: "Comment", icon: "💬" },
          { label: "Repost", icon: "🔄" },
          { label: "Send", icon: "📤" },
        ].map((a) => (
          <button
            key={a.label}
            className="h-10 inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold text-[#00000099] hover:bg-[#0000000a]"
          >
            <span className="text-[14px] grayscale opacity-80">{a.icon}</span>
            <span className="hidden sm:inline">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function VoiceLints({ body, banned }: { body: string; banned: string[] }) {
  const lower = body.toLowerCase();
  const hits = banned.filter((w) => lower.includes(w));
  const hasEmoji = /\p{Extended_Pictographic}/u.test(body);
  if (!hits.length && !hasEmoji) return null;
  return (
    <div className="mt-4 bg-warn/5 border border-warn/30 rounded-sm px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-label text-warn font-semibold mb-1.5">
        Voice lints
      </div>
      <ul className="text-[12.5px] text-ink-700 space-y-0.5">
        {hasEmoji && <li>Contains emoji — voice rule says no emojis.</li>}
        {hits.map((w) => (
          <li key={w}>
            Banned word: <span className="font-mono">{w}</span>
          </li>
        ))}
      </ul>
    </div>
  );
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
