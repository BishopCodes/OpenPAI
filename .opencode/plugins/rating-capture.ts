import type { Plugin } from "@opencode-ai/plugin";
import { paiPath, logEvent, nowISO, todayDate, appendTextFile, ensureDir } from "./lib/utils";
import { join } from "path";

const RATING_REGEX = /^(10|[1-9])(\s|$|\.|,|!|\?|\/)/;

function parseRating(text: string): { score: number; comment: string } | null {
  const match = text.match(RATING_REGEX);
  if (!match) return null;

  const score = parseInt(match[1], 10);
  const comment = text.slice(match[0].length).trim();

  // Reject false positives: bare numbers in longer technical context
  if (text.match(/^\d+\s*(px|em|rem|%|ms|kb|mb|gb|x\d|\.[\d])/i)) return null;
  if (text.match(/^\d+\s*[+\-*/=<>]/)) return null;

  return { score, comment };
}

export const RatingCapturePlugin: Plugin = async ({ project }) => {
  return {
    "chat.message": async (input, output) => {
      const userText = output.parts
        ?.filter((p: any) => p.type === "text")
        .map((p: any) => p.text)
        .join(" ")
        .trim();

      if (!userText) return;

      const rating = parseRating(userText);
      if (!rating) return;

      const signalsDir = paiPath("MEMORY", "LEARNING", "SIGNALS");
      ensureDir(signalsDir);

      const entry = {
        timestamp: nowISO(),
        score: rating.score,
        comment: rating.comment,
        sessionId: input.sessionID || "unknown",
      };

      appendTextFile(join(signalsDir, "ratings.jsonl"), JSON.stringify(entry) + "\n");

      logEvent("LEARNING", "rating_captured", {
        score: rating.score,
        hasComment: rating.comment.length > 0,
      });

      if (rating.score <= 3) {
        const failureDir = paiPath("MEMORY", "LEARNING", "FAILURES");
        ensureDir(failureDir);
        const failureEntry = {
          ...entry,
          severity: rating.score <= 1 ? "critical" : "significant",
          requiresAnalysis: true,
        };
        appendTextFile(
          join(failureDir, `${todayDate()}-failures.jsonl`),
          JSON.stringify(failureEntry) + "\n"
        );
      }
    },
  };
};
