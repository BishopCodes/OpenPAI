/**
 * OpenPAI Shared Plugin Utilities
 * Equivalent of PAI plugins/lib/ — shared helpers for all plugins.
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { join, resolve } from "path";
import { homedir, platform } from "os";

// ─── Paths ───

export const PAI_DIR = process.env.PAI_DIR || join(homedir(), ".config", "openpai");

export function paiPath(...segments: string[]): string {
  return join(PAI_DIR, ...segments);
}

export function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

// ─── Config ───

let _config: Record<string, any> | null = null;

export function loadConfig(): Record<string, any> {
  if (_config) return _config;
  const configPath = paiPath("opencode.json");
  if (existsSync(configPath)) {
    // Strip JSONC comments before parsing
    const raw = readFileSync(configPath, "utf-8");
    const stripped = raw.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
    _config = JSON.parse(stripped);
  } else {
    _config = {};
  }
  return _config!;
}

export function getConfigValue(path: string, defaultValue?: any): any {
  const config = loadConfig();
  const keys = path.split(".");
  let current: any = config;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return defaultValue;
    current = current[key];
  }
  return current ?? defaultValue;
}

// ─── Identity ───

export function getAssistantName(): string {
  return getConfigValue("openpai.assistant.name", "DA");
}

export function getPrincipalName(): string {
  return getConfigValue("openpai.principal.name", "User");
}

export function getPrincipalTimezone(): string {
  return getConfigValue("openpai.principal.timezone", "America/Los_Angeles");
}

// ─── Time ───

export function nowISO(): string {
  return new Date().toISOString();
}

export function nowLocal(timezone?: string): string {
  const tz = timezone || getPrincipalTimezone();
  return new Date().toLocaleString("en-US", { timeZone: tz });
}

export function todayDate(): string {
  return new Date().toISOString().split("T")[0];
}

// ─── File I/O ───

export function readJsonFile<T = any>(filePath: string): T | null {
  try {
    if (!existsSync(filePath)) return null;
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

export function writeJsonFile(filePath: string, data: any): void {
  ensureDir(join(filePath, ".."));
  writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

export function readTextFile(filePath: string): string | null {
  try {
    if (!existsSync(filePath)) return null;
    return readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

export function writeTextFile(filePath: string, content: string): void {
  ensureDir(join(filePath, ".."));
  writeFileSync(filePath, content, "utf-8");
}

export function appendTextFile(filePath: string, content: string): void {
  ensureDir(join(filePath, ".."));
  const existing = readTextFile(filePath) || "";
  writeFileSync(filePath, existing + content, "utf-8");
}

// ─── Platform ───

export function isMac(): boolean {
  return platform() === "darwin";
}

export function isLinux(): boolean {
  return platform() === "linux";
}

// ─── Notifications ───

export async function sendNotification(title: string, message: string): Promise<void> {
  const config = loadConfig();
  const ntfy = config?.openpai?.notifications?.ntfy;
  const discord = config?.openpai?.notifications?.discord;

  // Desktop notification
  if (isMac()) {
    const { execSync } = await import("child_process");
    try {
      execSync(`osascript -e 'display notification "${message}" with title "${title}"'`);
    } catch {}
  } else if (isLinux()) {
    const { execSync } = await import("child_process");
    try {
      execSync(`notify-send "${title}" "${message}"`);
    } catch {}
  }

  // ntfy push notification
  if (ntfy?.enabled && ntfy?.topic) {
    try {
      await fetch(`${ntfy.server || "https://ntfy.sh"}/${ntfy.topic}`, {
        method: "POST",
        headers: { Title: title },
        body: message,
      });
    } catch {}
  }

  // Discord webhook
  if (discord?.enabled && discord?.webhookUrl) {
    try {
      await fetch(discord.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `**${title}**\n${message}` }),
      });
    } catch {}
  }
}

// ─── Logging ───

export function logEvent(category: string, event: string, data?: Record<string, any>): void {
  const logDir = paiPath("MEMORY", "LOGS", category);
  ensureDir(logDir);
  const entry = {
    timestamp: nowISO(),
    event,
    ...data,
  };
  const logFile = join(logDir, `${todayDate()}.jsonl`);
  appendTextFile(logFile, JSON.stringify(entry) + "\n");
}
