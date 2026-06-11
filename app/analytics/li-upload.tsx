"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

// Upload a LinkedIn analytics .xlsx export → /api/analytics/upload parses it
// into social-posts.sqlite, then we refresh the page to show the new numbers.
export function LiUpload() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/analytics/upload", { method: "POST", body: fd });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.result?.ok) {
        const res = data.result;
        setMsg({
          ok: true,
          text: `Imported ${res.daily_rows} days, ${res.top_posts} top posts, ${res.follower_rows} follower rows.`,
        });
        router.refresh();
      } else {
        setMsg({ ok: false, text: data.detail || data.error || "import failed" });
      }
    } catch (err: any) {
      setMsg({ ok: false, text: String(err) });
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex items-center gap-3">
      <label className="inline-flex items-center gap-1.5 rounded-sm px-3 h-9 text-sm font-medium cursor-pointer bg-bg-surface border border-line-strong text-ink-900 hover:bg-bg-subtle aria-disabled:opacity-50">
        <input
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={onPick}
          disabled={busy}
        />
        <Upload size={14} /> {busy ? "Importing…" : "Import LinkedIn xlsx"}
      </label>
      {msg && (
        <span className={`text-[12px] ${msg.ok ? "text-success" : "text-danger"}`}>
          {msg.text}
        </span>
      )}
    </div>
  );
}
