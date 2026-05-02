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

// Imagen via Vertex AI — uses ADC (`gcloud auth application-default login`).
// We shell out to `gcloud auth print-access-token` rather than wiring the
// Google Auth lib through the Next bundle.
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

async function generateImagen(prompt: string, aspect: "1:1" | "16:9" | "9:16" = "1:1"): Promise<{ b64: string; model: string }> {
  loadEnvOnce();
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
  if (!project) throw new Error("GOOGLE_CLOUD_PROJECT not set");

  const model = "imagen-4.0-generate-001";
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:predict`;

  const token = await vertexAccessToken();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: aspect,
        safetySetting: "block_only_high",
        personGeneration: "allow_adult",
      },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`vertex ${res.status}: ${t.slice(0, 400)}`);
  }
  const data = await res.json();
  const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) throw new Error("no image in response: " + JSON.stringify(data).slice(0, 300));
  return { b64, model };
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
    const { b64, model } = await generateImagen(prompt, aspect || "1:1");
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
