import type { Plugin } from "@opencode-ai/plugin";
import { paiPath, loadConfig, logEvent } from "./lib/utils";

const VOICE_SERVER_URL = "http://localhost:8888";

async function sendVoiceLine(message: string, voiceId?: string): Promise<void> {
  const config = loadConfig();
  const defaultVoice = config?.openpai?.assistant?.voice?.voiceId || "af_heart";

  try {
    await fetch(`${VOICE_SERVER_URL}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        voice_id: voiceId || defaultVoice,
        voice_enabled: true,
      }),
    });
  } catch {
    // Voice server not running — silently skip
  }
}

function extractVoiceLine(text: string): string | null {
  const match = text.match(/\u{1F5E3}\uFE0F\s*(?:Assistant:\s*)?(.+)/u);
  return match ? match[1].trim() : null;
}

export const VoiceCompletionPlugin: Plugin = async ({ project }) => {
  return {
    "experimental.text.complete": async (input, output) => {
      const voiceLine = extractVoiceLine(output.text);
      if (voiceLine) {
        await sendVoiceLine(voiceLine);
      }
    },

    event: async ({ event }) => {
      if (event.type === "session.idle") {
        // Session completed — fire any pending voice
      }
    },
  };
};
