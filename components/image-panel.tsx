"use client";

import { useState } from "react";
import {
  Image as ImageIcon,
  Wand2,
  Loader2,
  Copy,
  ExternalLink,
  Download,
} from "lucide-react";
import clsx from "clsx";

type Aspect = "1:1" | "16:9" | "9:16";

type Props = {
  body: string;
  platform: string;
  draftFilename?: string;
};

type Generated = {
  dataUrl: string;
  filename: string;
  path: string;
  model: string;
};

export function ImagePanel({ body, platform, draftFilename }: Props) {
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState<Aspect>("1:1");
  const [draftingPrompt, setDraftingPrompt] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [image, setImage] = useState<Generated | null>(null);

  async function draftPrompt() {
    if (!body.trim()) {
      setError("Draft body is empty.");
      return;
    }
    setError(null);
    setDraftingPrompt(true);
    try {
      const res = await fetch("/api/image/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, platform }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setPrompt(data.prompt);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setDraftingPrompt(false);
    }
  }

  async function generateGemini() {
    if (!prompt.trim()) {
      setError("Prompt is empty. Draft one first.");
      return;
    }
    setError(null);
    setGenerating(true);
    setImage(null);
    try {
      const res = await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, provider: "gemini", aspect, draftFilename }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setImage({
        dataUrl: data.dataUrl,
        filename: data.filename,
        path: data.path,
        model: data.model,
      });
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setGenerating(false);
    }
  }

  function copyPrompt() {
    if (!prompt) return;
    navigator.clipboard?.writeText(prompt);
  }

  function openInChatGPT() {
    if (!prompt) return;
    navigator.clipboard?.writeText(prompt);
    window.open("https://chatgpt.com/?model=gpt-4o&hints=image", "_blank", "noopener");
  }

  function openInGrok() {
    if (!prompt) return;
    navigator.clipboard?.writeText(prompt);
    window.open("https://grok.com/", "_blank", "noopener");
  }

  return (
    <div className="px-5 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <ImageIcon size={14} className="text-brand" />
        <span className="text-[12px] font-semibold text-ink-900">Image</span>
        <span className="text-[10.5px] uppercase tracking-label text-ink-400 ml-auto">
          gemini / openai / grok
        </span>
      </div>

      {/* Prompt */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10.5px] uppercase tracking-label text-ink-400 font-semibold">
            Prompt
          </span>
          <button
            onClick={draftPrompt}
            disabled={draftingPrompt || !body.trim()}
            className="h-7 px-2 rounded-xs text-[11.5px] text-brand hover:bg-bg-subtle inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {draftingPrompt ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />}
            Draft from post
          </button>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="An image prompt — write your own or click 'Draft from post'."
          className="w-full min-h-[120px] px-2.5 py-2 rounded-sm bg-bg-base border border-line-subtle text-[12.5px] text-ink-900 placeholder:text-ink-300 focus:outline-none focus:border-line-strong resize-y"
        />
        {prompt && (
          <div className="flex items-center gap-1 mt-1.5">
            <button
              onClick={copyPrompt}
              className="h-6 px-2 rounded-xs text-[11px] text-ink-500 hover:bg-bg-subtle inline-flex items-center gap-1"
            >
              <Copy size={10} /> Copy
            </button>
            <span className="text-[10.5px] text-ink-400 font-mono ml-auto">
              {prompt.length} chars
            </span>
          </div>
        )}
      </div>

      {/* Aspect */}
      <div>
        <div className="text-[10.5px] uppercase tracking-label text-ink-400 font-semibold mb-1.5">
          Aspect
        </div>
        <div className="flex gap-1">
          {(["1:1", "16:9", "9:16"] as Aspect[]).map((a) => (
            <button
              key={a}
              onClick={() => setAspect(a)}
              className={clsx(
                "h-7 px-2.5 rounded-xs text-[11.5px] border transition-colors",
                aspect === a
                  ? "bg-ink-900 border-ink-900 text-white"
                  : "border-line-subtle text-ink-700 hover:border-line-strong"
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Generate */}
      <div className="space-y-1.5">
        <button
          onClick={generateGemini}
          disabled={generating || !prompt.trim()}
          className="w-full h-9 rounded-sm bg-brand text-white text-[12.5px] font-semibold hover:bg-brand-soft disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
        >
          {generating ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
          Generate via Imagen (Vertex)
        </button>
        <div className="flex gap-1.5">
          <button
            onClick={openInChatGPT}
            disabled={!prompt.trim()}
            title="Copies prompt + opens ChatGPT in a new tab"
            className="flex-1 h-8 rounded-sm border border-line-strong text-[12px] text-ink-700 hover:bg-bg-subtle disabled:opacity-50 inline-flex items-center justify-center gap-1"
          >
            <ExternalLink size={11} />
            Open in ChatGPT
          </button>
          <button
            onClick={openInGrok}
            disabled={!prompt.trim()}
            title="Copies prompt + opens Grok in a new tab"
            className="flex-1 h-8 rounded-sm border border-line-strong text-[12px] text-ink-700 hover:bg-bg-subtle disabled:opacity-50 inline-flex items-center justify-center gap-1"
          >
            <ExternalLink size={11} />
            Open in Grok
          </button>
        </div>
        <p className="text-[10.5px] text-ink-400">
          Imagen runs server-side via your existing GCP ADC (no extra API key). ChatGPT/Grok hand off the prompt to those tabs — your Pro/free sessions handle generation there.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="text-[12px] text-danger bg-danger/5 border border-danger/30 rounded-xs px-2 py-1.5">
          {error}
        </div>
      )}

      {/* Result */}
      {image && (
        <div className="space-y-2">
          <div className="text-[10.5px] uppercase tracking-label text-ink-400 font-semibold">
            Generated · {image.model}
          </div>
          <div className="bg-bg-base border border-line-subtle rounded-sm p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.dataUrl}
              alt="generated"
              className="w-full rounded-xs"
            />
          </div>
          <div className="flex items-center gap-2 text-[11px] text-ink-500">
            <a
              href={image.dataUrl}
              download={image.filename}
              className="inline-flex items-center gap-1 hover:text-ink-900"
            >
              <Download size={11} /> {image.filename}
            </a>
            <span className="ml-auto font-mono text-[10.5px] text-ink-400 truncate">
              {image.path.replace(process.env.NEXT_PUBLIC_HOME || "", "~")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
