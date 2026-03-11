import { readFileSync } from "fs";
import { join, dirname } from "path";
import { spawn } from "child_process";
import { tmpdir, platform } from "os";
import { KokoroTTS } from "kokoro-js";

const PORT = 8888;
const SCRIPT_DIR = dirname(new URL(import.meta.url).pathname);
const VOICES_PATH = join(SCRIPT_DIR, "voices.json");

// ─── TTS Engine (lazy-initialized on first request) ──────
let tts: Awaited<ReturnType<typeof KokoroTTS.from_pretrained>> | null = null;
let ttsLoading: Promise<typeof tts> | null = null;

async function getTTS() {
  if (tts) return tts;
  if (ttsLoading) return ttsLoading;

  ttsLoading = KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
    dtype: "q8",
    device: "cpu",
  }).then((instance) => {
    tts = instance;
    console.log("Kokoro TTS model loaded");
    return instance;
  });

  return ttsLoading;
}

// ─── Voice Config ────────────────────────────────────────
function loadVoices(): Record<string, any> {
  try {
    return JSON.parse(readFileSync(VOICES_PATH, "utf-8")).voices || {};
  } catch {
    return {};
  }
}

function getDefaultVoice(): string {
  try {
    const config = JSON.parse(readFileSync(VOICES_PATH, "utf-8"));
    return config.default_voice || "af_heart";
  } catch {
    return "af_heart";
  }
}

// ─── Generate & Play ─────────────────────────────────────
async function generateAndPlayAudio(
  text: string,
  voiceId: string,
  speed: number = 1.0
): Promise<{ success: boolean; error?: string }> {
  try {
    const engine = await getTTS();
    const audio = await engine.generate(text, { voice: voiceId, speed });

    // Write WAV to temp file for playback
    const tempPath = join(tmpdir(), `openpai-tts-${Date.now()}.wav`);
    await audio.save(tempPath);

    const playCmd = platform() === "darwin" ? "afplay" : "mpv";
    const playArgs = platform() === "darwin" ? [tempPath] : ["--no-terminal", tempPath];

    const player = spawn(playCmd, playArgs, {
      stdio: "ignore",
      detached: true,
    });

    player.on("close", () => {
      try {
        require("fs").unlinkSync(tempPath);
      } catch {}
    });

    player.unref();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "TTS generation failed" };
  }
}

// ─── HTTP Server ─────────────────────────────────────────
const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/health") {
      return Response.json({
        status: "ok",
        provider: "kokoro-js",
        model: "Kokoro-82M-v1.0-ONNX",
        loaded: tts !== null,
        port: PORT,
      });
    }

    if (url.pathname === "/voices") {
      return Response.json(loadVoices());
    }

    if (url.pathname === "/notify" && req.method === "POST") {
      try {
        const body = await req.json();
        const message = body.message || body.text || "";
        const voiceId = body.voice_id || body.voiceId || getDefaultVoice();
        const speed = body.speed || 1.0;
        const voiceEnabled = body.voice_enabled !== false;

        if (!message) {
          return Response.json({ error: "No message provided" }, { status: 400 });
        }

        if (!voiceEnabled) {
          return Response.json({ status: "skipped", reason: "voice_disabled" });
        }

        const result = await generateAndPlayAudio(message, voiceId, speed);
        return Response.json(result, { status: result.success ? 200 : 500 });
      } catch (err: any) {
        return Response.json({ error: err.message }, { status: 500 });
      }
    }

    if (url.pathname === "/notify/personality" && req.method === "POST") {
      try {
        const body = await req.json();
        const message = body.message || "";
        const voiceId = body.voice_id || getDefaultVoice();
        const speed = body.speed || 1.0;

        if (!message) {
          return Response.json({ error: "No message" }, { status: 400 });
        }

        const result = await generateAndPlayAudio(message, voiceId, speed);
        return Response.json(result, { status: result.success ? 200 : 500 });
      } catch (err: any) {
        return Response.json({ error: err.message }, { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`OpenPAI VoiceServer running on http://localhost:${PORT}`);
console.log(`Provider: Kokoro 82M via kokoro-js (native Bun)`);
console.log(`Default voice: ${getDefaultVoice()}`);
console.log(`Model loads on first TTS request`);
