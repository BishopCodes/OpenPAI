import type { Plugin } from "@opencode-ai/plugin";
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join } from "path";
import {
  paiPath,
  loadConfig,
  getAssistantName,
  getPrincipalName,
  getPrincipalTimezone,
  nowLocal,
  readTextFile,
} from "./lib/utils";

function loadFileIfExists(filePath: string): string | null {
  if (!existsSync(filePath)) return null;
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

function buildRelationshipContext(): string | null {
  const config = loadConfig();
  if (!config?.openpai?.dynamicContext?.relationshipContext) return null;

  const parts: string[] = [];

  const opinions = loadFileIfExists(paiPath("MEMORY", "RELATIONSHIP", "OPINIONS.md"));
  if (opinions) {
    const highConfidence = opinions
      .split("\n")
      .filter((line) => {
        const match = line.match(/confidence:\s*([\d.]+)/);
        return match && parseFloat(match[1]) >= 0.85;
      });
    if (highConfidence.length) {
      parts.push("## High-Confidence Opinions\n" + highConfidence.join("\n"));
    }
  }

  const relDir = paiPath("MEMORY", "RELATIONSHIP");
  if (existsSync(relDir)) {
    try {
      const files = readdirSync(relDir)
        .filter((f) => f.endsWith(".md") && f !== "OPINIONS.md")
        .sort()
        .slice(-3);
      for (const f of files) {
        const content = loadFileIfExists(join(relDir, f));
        if (content) parts.push(content.slice(0, 500));
      }
    } catch {}
  }

  return parts.length ? parts.join("\n\n") : null;
}

function buildLearningContext(): string | null {
  const config = loadConfig();
  if (!config?.openpai?.dynamicContext?.learningReadback) return null;

  const parts: string[] = [];

  const digestPath = paiPath("MEMORY", "LEARNING", "DIGEST.md");
  const digest = loadFileIfExists(digestPath);
  if (digest) parts.push("## Learning Digest\n" + digest.slice(0, 1000));

  const wisdomDir = paiPath("MEMORY", "LEARNING", "SYNTHESIS");
  if (existsSync(wisdomDir)) {
    try {
      const frames = readdirSync(wisdomDir)
        .filter((f) => f.endsWith(".md"))
        .sort()
        .slice(-2);
      for (const f of frames) {
        const content = loadFileIfExists(join(wisdomDir, f));
        if (content) parts.push(content.slice(0, 500));
      }
    } catch {}
  }

  const failuresPath = paiPath("MEMORY", "LEARNING", "FAILURES");
  if (existsSync(failuresPath)) {
    try {
      const recent = readdirSync(failuresPath)
        .filter((f) => f.endsWith(".md"))
        .sort()
        .slice(-3);
      for (const f of recent) {
        const content = loadFileIfExists(join(failuresPath, f));
        if (content) parts.push("### Failure Pattern: " + f + "\n" + content.slice(0, 300));
      }
    } catch {}
  }

  return parts.length ? parts.join("\n\n") : null;
}

function buildActiveWorkContext(): string | null {
  const config = loadConfig();
  if (!config?.openpai?.dynamicContext?.activeWorkSummary) return null;

  const parts: string[] = [];
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;

  const workDir = paiPath("MEMORY", "WORK");
  if (existsSync(workDir)) {
    try {
      const sessions = readdirSync(workDir)
        .filter((d) => {
          const stat = statSync(join(workDir, d));
          return stat.isDirectory() && stat.mtimeMs > cutoff;
        })
        .slice(-5);
      if (sessions.length) {
        parts.push("## Active Work Sessions (last 48h)\n" + sessions.map((s) => `- ${s}`).join("\n"));
      }
    } catch {}
  }

  const progressDir = paiPath("MEMORY", "STATE", "progress");
  if (existsSync(progressDir)) {
    try {
      const projects = readdirSync(progressDir).filter((f) => f.endsWith(".json"));
      for (const p of projects.slice(-5)) {
        const content = loadFileIfExists(join(progressDir, p));
        if (content) {
          try {
            const data = JSON.parse(content);
            parts.push(`### ${data.name || p}: ${data.status || "in progress"}`);
          } catch {}
        }
      }
    } catch {}
  }

  return parts.length ? parts.join("\n\n") : null;
}

export const LoadContextPlugin: Plugin = async ({ project, directory }) => {
  const config = loadConfig();
  const daName = getAssistantName();
  const principalName = getPrincipalName();
  const tz = getPrincipalTimezone();

  const startupFiles: string[] = config?.instructions || [];
  let startupContent = "";
  for (const relPath of startupFiles) {
    const fullPath = paiPath(relPath);
    const content = loadFileIfExists(fullPath);
    if (content) {
      startupContent += `\n<!-- Loaded: ${relPath} -->\n${content}\n`;
    }
  }

  return {
    "experimental.chat.system.transform": async (input, output) => {
      const contextParts: string[] = [];

      contextParts.push(`Current time: ${nowLocal(tz)} | Assistant: ${daName} | User: ${principalName}`);

      if (startupContent) {
        contextParts.push(startupContent);
      }

      const relationship = buildRelationshipContext();
      if (relationship) contextParts.push(`<relationship-context>\n${relationship}\n</relationship-context>`);

      const learning = buildLearningContext();
      if (learning) contextParts.push(`<learning-context>\n${learning}\n</learning-context>`);

      const activeWork = buildActiveWorkContext();
      if (activeWork) contextParts.push(`<active-work>\n${activeWork}\n</active-work>`);

      if (contextParts.length) {
        output.system.push(contextParts.join("\n\n"));
      }
    },
  };
};
