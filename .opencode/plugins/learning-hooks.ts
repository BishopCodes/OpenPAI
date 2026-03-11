import type { Plugin } from "@opencode-ai/plugin";
import {
  paiPath,
  ensureDir,
  appendTextFile,
  readTextFile,
  writeTextFile,
  logEvent,
  nowISO,
  todayDate,
} from "./lib/utils";
import { existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

function captureRelationshipEvent(eventType: string, content: string): void {
  const relDir = paiPath("MEMORY", "RELATIONSHIP");
  ensureDir(relDir);
  const entry = {
    timestamp: nowISO(),
    type: eventType,
    content: content.slice(0, 500),
  };
  appendTextFile(join(relDir, `${todayDate()}.jsonl`), JSON.stringify(entry) + "\n");
}

function captureWorkLearning(sessionId: string): void {
  const stateDir = paiPath("MEMORY", "STATE");
  const workFiles = existsSync(stateDir)
    ? readdirSync(stateDir).filter((f) => f.startsWith("current-work") && f.endsWith(".json"))
    : [];

  if (workFiles.length === 0) return;

  const learningDir = paiPath("MEMORY", "LEARNING", "SESSIONS");
  ensureDir(learningDir);

  for (const wf of workFiles) {
    const content = readTextFile(join(stateDir, wf));
    if (!content) continue;
    try {
      const data = JSON.parse(content);
      const learning = {
        timestamp: nowISO(),
        sessionId,
        workItem: data.name || data.title || wf,
        status: data.status || "unknown",
        learnings: data.learnings || [],
        filesModified: data.filesModified || [],
      };
      appendTextFile(
        join(learningDir, `${todayDate()}.jsonl`),
        JSON.stringify(learning) + "\n"
      );
    } catch {}
  }
}

export const LearningHooksPlugin: Plugin = async ({ project }) => {
  const sessionId = `ses_${Date.now().toString(36)}`;

  return {
    "chat.message": async (input, output) => {
      const userText = output.parts
        ?.filter((p: any) => p.type === "text")
        .map((p: any) => p.text)
        .join(" ")
        .trim();

      if (!userText) return;

      const relationshipKeywords = [
        "thank",
        "appreciate",
        "sorry",
        "frustrated",
        "love",
        "hate",
        "prefer",
        "like when",
        "don't like",
        "remember",
        "you always",
        "you never",
      ];

      const lower = userText.toLowerCase();
      const isRelationship = relationshipKeywords.some((kw) => lower.includes(kw));

      if (isRelationship) {
        captureRelationshipEvent("user_sentiment", userText);
      }
    },

    event: async ({ event }) => {
      if (event.type === "session.idle") {
        captureWorkLearning(sessionId);
        logEvent("LEARNING", "session_learning_captured", { sessionId });
      }
    },
  };
};
