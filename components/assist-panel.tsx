"use client";

import { useState } from "react";
import { Sparkles, Wand2, Scissors, ListChecks, Maximize2, ScrollText, Loader2 } from "lucide-react";

type Props = {
  body: string;
  platform: string;
  onApply: (next: string) => void;
};

type ResultState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "ok"; output?: string; variants?: string[]; preset: string }
  | { status: "err"; error: string };

const ACTIONS = [
  { preset: "punchier", label: "Make punchier", icon: Sparkles },
  { preset: "shorter", label: "Shorten", icon: Scissors },
  { preset: "longer", label: "Expand", icon: Maximize2 },
  { preset: "variants", label: "3 variants", icon: ListChecks },
  { preset: "voicelint", label: "Voice lint", icon: ScrollText },
];

export function AssistPanel({ body, platform, onApply }: Props) {
  const [state, setState] = useState<ResultState>({ status: "idle" });
  const [custom, setCustom] = useState("");

  async function fire(payload: { preset?: string; instruction?: string }) {
    if (!body.trim()) {
      setState({ status: "err", error: "Draft is empty." });
      return;
    }
    setState({ status: "running" });
    try {
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, body, platform }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ status: "err", error: data.error || `HTTP ${res.status}` });
        return;
      }
      setState({
        status: "ok",
        output: data.output,
        variants: data.variants,
        preset: payload.preset || "custom",
      });
    } catch (e: any) {
      setState({ status: "err", error: e?.message || String(e) });
    }
  }

  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <Wand2 size={14} className="text-brand" />
        <span className="text-[12px] font-semibold text-ink-900">AI assist</span>
        <span className="text-[10.5px] uppercase tracking-label text-ink-400 ml-auto">
          claude · sonnet
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {ACTIONS.map((a) => (
          <button
            key={a.preset}
            onClick={() => fire({ preset: a.preset })}
            disabled={state.status === "running"}
            className="h-8 px-2.5 rounded-sm border border-line-subtle bg-bg-base text-[12px] text-ink-700 hover:border-line-strong hover:bg-bg-subtle disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <a.icon size={12} />
            {a.label}
          </button>
        ))}
      </div>

      <div className="space-y-1.5 mb-4">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && custom.trim()) {
              fire({ instruction: custom });
            }
          }}
          placeholder="Or describe a custom edit…"
          className="w-full h-8 px-2.5 rounded-sm bg-bg-base border border-line-subtle text-[12.5px] text-ink-900 placeholder:text-ink-300 focus:outline-none focus:border-line-strong"
        />
      </div>

      {state.status === "running" && (
        <div className="flex items-center gap-2 text-[12px] text-ink-500 italic">
          <Loader2 size={12} className="animate-spin" />
          Calling Claude…
        </div>
      )}
      {state.status === "err" && (
        <div className="text-[12px] text-danger bg-danger/5 border border-danger/30 rounded-xs px-2 py-1.5">
          {state.error}
        </div>
      )}
      {state.status === "ok" && state.output && (
        <div className="space-y-2">
          <div className="text-[10.5px] uppercase tracking-label text-ink-400 font-semibold">
            {state.preset === "voicelint" ? "Voice lint result" : "Suggested rewrite"}
          </div>
          <div className="bg-bg-base border border-line-subtle rounded-sm p-3 text-[13px] text-ink-900 whitespace-pre-wrap">
            {state.output}
          </div>
          {state.preset !== "voicelint" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onApply(state.output!)}
                className="h-7 px-2.5 rounded-xs bg-brand text-white text-[12px] font-semibold hover:bg-brand-soft"
              >
                Apply
              </button>
              <button
                onClick={() => navigator.clipboard?.writeText(state.output!)}
                className="h-7 px-2.5 rounded-xs border border-line-strong text-[12px] text-ink-700 hover:bg-bg-subtle"
              >
                Copy
              </button>
            </div>
          )}
        </div>
      )}
      {state.status === "ok" && state.variants && (
        <div className="space-y-3">
          <div className="text-[10.5px] uppercase tracking-label text-ink-400 font-semibold">
            {state.variants.length} variants
          </div>
          {state.variants.map((v, i) => (
            <div key={i} className="bg-bg-base border border-line-subtle rounded-sm p-3">
              <div className="text-[10.5px] text-ink-400 font-mono mb-1.5">
                variant {i + 1}
              </div>
              <p className="text-[13px] text-ink-900 whitespace-pre-wrap">{v}</p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => onApply(v)}
                  className="h-7 px-2.5 rounded-xs bg-brand text-white text-[11.5px] font-semibold hover:bg-brand-soft"
                >
                  Apply
                </button>
                <button
                  onClick={() => navigator.clipboard?.writeText(v)}
                  className="h-7 px-2.5 rounded-xs border border-line-strong text-[11.5px] text-ink-700 hover:bg-bg-subtle"
                >
                  Copy
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
