import type { Plugin } from "@opencode-ai/plugin";
import { paiPath, ensureDir, writeTextFile, readTextFile, logEvent, nowISO, loadConfig } from "./lib/utils";
import { join } from "path";
import { existsSync } from "fs";

export const SessionCachePlugin: Plugin = async ({ project }) => {
  const stateDir = paiPath("MEMORY", "STATE");
  ensureDir(stateDir);

  return {
    "experimental.text.complete": async (input, output) => {
      writeTextFile(join(stateDir, "last-response.txt"), output.text);
    },

    "chat.message": async (input, output) => {
      const userText = output.parts
        ?.filter((p: any) => p.type === "text")
        .map((p: any) => p.text)
        .join(" ")
        .trim();

      if (!userText) return;

      const questionState = readTextFile(join(stateDir, "pending-question.txt"));
      if (questionState) {
        logEvent("SESSION", "question_answered", {
          question: questionState.slice(0, 100),
          answer: userText.slice(0, 100),
        });
        try {
          const { unlinkSync } = await import("fs");
          unlinkSync(join(stateDir, "pending-question.txt"));
        } catch {}
      }
    },

    event: async ({ event }) => {
      if (event.type === "session.idle") {
        const config = loadConfig();
        const counts = config?.openpai?.counts;
        if (counts) {
          counts.sessions = (counts.sessions || 0) + 1;
          logEvent("SESSION", "session_count_updated", { total: counts.sessions });
        }
      }
    },
  };
};
