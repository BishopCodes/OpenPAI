import type { Plugin } from "@opencode-ai/plugin";
import {
  paiPath,
  logEvent,
  nowISO,
  ensureDir,
  readJsonFile,
  writeJsonFile,
} from "./lib/utils";
import { existsSync, unlinkSync, readdirSync } from "fs";
import { join } from "path";

const STOP_WORDS = new Set([
  "a","an","the","is","are","was","were","be","been","being","have","has","had",
  "do","does","did","will","would","shall","should","may","might","must","can",
  "could","i","me","my","we","our","you","your","he","him","his","she","her",
  "it","its","they","them","their","this","that","these","those","what","which",
  "who","whom","how","when","where","why","and","but","or","nor","not","no",
  "so","if","then","than","too","very","just","about","above","after","again",
  "all","also","am","any","as","at","because","before","between","both","by",
  "down","during","each","few","for","from","further","get","got","here",
  "in","into","more","most","of","off","on","once","only","other","out","over",
  "own","same","some","such","there","through","to","under","until","up","with",
  "please","help","want","need","make","like","know","think","thing","things",
  "use","using","used","really","actually","basically","let","lets","going",
]);

interface SessionEntry {
  id: string;
  title: string;
  started: string;
  ended?: string;
  messageCount: number;
}

interface SessionRegistry {
  sessions: SessionEntry[];
}

interface SystemCounts {
  skills: number;
  agents: number;
  plugins: number;
  timestamp: string;
}

function extractKeywords(text: string, maxWords: number): string[] {
  const cleaned = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = cleaned.split(" ").filter(
    (w) => w.length > 2 && !STOP_WORDS.has(w)
  );

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const w of words) {
    if (!seen.has(w)) {
      seen.add(w);
      unique.push(w);
    }
    if (unique.length >= maxWords) break;
  }
  return unique;
}

function generateSessionTitle(firstMessage: string): string {
  const keywords = extractKeywords(firstMessage, 4);
  if (keywords.length === 0) return "untitled-session";
  return keywords.join("-");
}

function countDirectory(dirPath: string): number {
  if (!existsSync(dirPath)) return 0;
  try {
    return readdirSync(dirPath).filter(
      (f) => !f.startsWith(".") && !f.startsWith("_")
    ).length;
  } catch {
    return 0;
  }
}

function updateSystemCounts(): SystemCounts {
  const counts: SystemCounts = {
    skills: 0,
    agents: 0,
    plugins: 0,
    timestamp: nowISO(),
  };

  const skillsDir = paiPath("skills");
  if (existsSync(skillsDir)) {
    try {
      const categories = readdirSync(skillsDir).filter((d) => {
        const fullPath = join(skillsDir, d);
        return !d.startsWith(".") && existsSync(join(fullPath));
      });
      let total = 0;
      for (const cat of categories) {
        total += countDirectory(join(skillsDir, cat));
      }
      counts.skills = total || categories.length;
    } catch {}
  }

  counts.agents = countDirectory(paiPath(".opencode", "agents"));
  if (counts.agents === 0) {
    counts.agents = countDirectory(
      join(process.cwd(), ".opencode", "agents")
    );
  }

  counts.plugins = countDirectory(paiPath(".opencode", "plugins"));
  if (counts.plugins === 0) {
    counts.plugins = countDirectory(
      join(process.cwd(), ".opencode", "plugins")
    );
  }

  const countsPath = paiPath("MEMORY", "STATE", "system-counts.json");
  writeJsonFile(countsPath, counts);

  return counts;
}

export const SessionManagerPlugin: Plugin = async ({ project, $ }) => {
  const sessionId = `ses_${Date.now().toString(36)}`;
  const stateDir = paiPath("MEMORY", "STATE");
  const registryPath = paiPath("MEMORY", "STATE", "sessions.json");
  ensureDir(stateDir);

  let sessionTitle = "untitled-session";
  let messageCount = 0;
  let titled = false;

  const registry: SessionRegistry = readJsonFile<SessionRegistry>(registryPath) || { sessions: [] };

  const entry: SessionEntry = {
    id: sessionId,
    title: sessionTitle,
    started: nowISO(),
    messageCount: 0,
  };
  registry.sessions.push(entry);

  if (registry.sessions.length > 200) {
    registry.sessions = registry.sessions.slice(-200);
  }
  writeJsonFile(registryPath, registry);

  logEvent("SESSION", "session_created", { sessionId });

  updateSystemCounts();

  return {
    event: async ({ event }) => {
      if (event.type === "session.created") {
        logEvent("SESSION", "session_started", { sessionId });
      }

      if (event.type === "session.idle") {
        const idx = registry.sessions.findIndex((s) => s.id === sessionId);
        if (idx !== -1) {
          registry.sessions[idx].ended = nowISO();
          registry.sessions[idx].messageCount = messageCount;
          writeJsonFile(registryPath, registry);
        }

        if (existsSync(stateDir)) {
          try {
            const tempFiles = readdirSync(stateDir).filter(
              (f) => f.includes(sessionId) && f.endsWith(".tmp.json")
            );
            for (const f of tempFiles) {
              try { unlinkSync(join(stateDir, f)); } catch {}
            }
          } catch {}
        }

        logEvent("SESSION", "session_ended", {
          sessionId,
          title: sessionTitle,
          messageCount,
        });
      }
    },

    "chat.message": async (input, output) => {
      messageCount++;

      if (!titled && output.parts?.length) {
        const textParts = output.parts.filter(
          (p): p is typeof p & { type: "text"; text: string } =>
            "type" in p && p.type === "text" && "text" in p
        );
        const userText = textParts.map((p) => p.text).join(" ").trim();
        if (userText.length > 0) {
          sessionTitle = generateSessionTitle(userText);
          titled = true;

          const idx = registry.sessions.findIndex((s) => s.id === sessionId);
          if (idx !== -1) {
            registry.sessions[idx].title = sessionTitle;
            writeJsonFile(registryPath, registry);
          }

          logEvent("SESSION", "session_titled", { sessionId, title: sessionTitle });
        }
      }
    },
  };
};
