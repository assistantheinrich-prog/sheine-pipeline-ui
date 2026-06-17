import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { loadEnvOnce } from "@/lib/env";

export const dynamic = "force-dynamic";
export const maxDuration = 240;

const IMAGES_DIR = path.join(
  os.homedir(),
  "Documents/ObsidianVault/00-memory/inbox/social-drafts/images"
);

// Gemini 3 Pro Image ("Nano Banana Pro", gemini-3-pro-image) via Vertex AI.
// Auth: shell out to `gcloud auth print-access-token` (active gcloud account),
// rather than wiring the Google Auth lib through the Next bundle.
async function vertexAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    const c = spawn("gcloud", ["auth", "print-access-token"], { env: { ...process.env, NODE_NO_WARNINGS: "1" } });
    let out = "";
    let err = "";
    c.stdout.on("data", (b) => (out += b));
    c.stderr.on("data", (b) => (err += b));
    c.on("close", (code) => (code === 0 ? resolve(out.trim()) : reject(new Error(err || `gcloud exit ${code}`))));
    c.on("error", reject);
  });
}

async function generateImage(prompt: string, aspect: "1:1" | "16:9" | "9:16" = "1:1"): Promise<{ b64: string; model: string }> {
  loadEnvOnce();
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  if (!project) throw new Error("GOOGLE_CLOUD_PROJECT not set");

  const model = "gemini-3-pro-image";
  // Nano Banana Pro is served ONLY on the global endpoint (404s on regional
  // endpoints), so pin global regardless of GOOGLE_CLOUD_LOCATION.
  const url = `https://aiplatform.googleapis.com/v1/projects/${project}/locations/global/publishers/google/models/${model}:generateContent`;

  const token = await vertexAccessToken();
  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: { aspectRatio: aspect },
    },
  });

  // Nano Banana Pro's global endpoint is rate-limit sensitive and returns an
  // HTML 404/429 page under throttle. Retry transient failures with exponential
  // backoff; do NOT retry a genuine JSON error (real 404 model-not-found, 400, 401).
  const maxAttempts = 4;
  let lastErr = "";
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body,
    });
    if (res.ok) {
      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts ?? [];
      const b64 = parts.find((p: any) => p?.inlineData?.data)?.inlineData?.data;
      if (b64) return { b64, model };
      lastErr = "no image in response: " + JSON.stringify(data).slice(0, 300);
    } else {
      const t = await res.text();
      lastErr = `vertex ${res.status}: ${t.slice(0, 300)}`;
      const htmlThrottle = res.status === 404 && t.trimStart().startsWith("<");
      const transient = res.status === 429 || res.status === 408 || res.status >= 500 || htmlThrottle;
      if (!transient) throw new Error(lastErr); // genuine error — fail fast
    }
    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, 800 * 2 ** (attempt - 1) + Math.floor(Math.random() * 400)));
    }
  }
  throw new Error(`image gen failed after ${maxAttempts} attempts — ${lastErr}`);
}

export async function POST(req: NextRequest) {
  const { prompt, provider, aspect, draftFilename } = await req.json().catch(() => ({}));
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "prompt required" }, { status: 400 });
  }
  if (provider !== "gemini") {
    return NextResponse.json(
      {
        error:
          "only provider='gemini' supports direct API generation. For OpenAI, use the 'Open in ChatGPT' button to hand the prompt to your Pro session.",
      },
      { status: 400 }
    );
  }

  try {
    const { b64, model } = await generateImage(prompt, aspect || "1:1");
    await fs.mkdir(IMAGES_DIR, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const slugBase = (draftFilename || "image").replace(/\.md$/, "").replace(/[^a-z0-9-]+/gi, "-");
    const filename = `${ts}-${slugBase}.png`;
    const full = path.join(IMAGES_DIR, filename);
    await fs.writeFile(full, Buffer.from(b64, "base64"));
    return NextResponse.json({
      ok: true,
      provider,
      model,
      filename,
      path: full,
      // dataUrl for immediate preview in the UI
      dataUrl: `data:image/png;base64,${b64}`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
