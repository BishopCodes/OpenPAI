import type { Plugin } from "@opencode-ai/plugin";
import { paiPath, ensureDir, writeTextFile, readTextFile } from "./lib/utils";
import { join } from "path";
import { execSync } from "child_process";
import { existsSync } from "fs";

function getKittySocket(): string | null {
  const fromEnv = process.env.KITTY_LISTEN_ON;
  if (fromEnv) return fromEnv;

  const persisted = readTextFile(paiPath("MEMORY", "STATE", "kitty-env.json"));
  if (persisted) {
    try {
      const data = JSON.parse(persisted);
      return data.KITTY_LISTEN_ON || null;
    } catch {}
  }
  return null;
}

function setKittyTabTitle(title: string): void {
  const socket = getKittySocket();
  if (!socket) return;

  try {
    execSync(`kitty @ --to="${socket}" set-tab-title "${title.replace(/"/g, '\\"')}"`, {
      timeout: 2000,
      stdio: "ignore",
    });
  } catch {}
}

export const TuiHooksPlugin: Plugin = async ({ project, $ }) => {
  // Persist Kitty env vars for cross-hook access
  if (process.env.KITTY_LISTEN_ON) {
    const stateDir = paiPath("MEMORY", "STATE");
    ensureDir(stateDir);
    writeTextFile(
      join(stateDir, "kitty-env.json"),
      JSON.stringify({
        KITTY_LISTEN_ON: process.env.KITTY_LISTEN_ON,
        KITTY_WINDOW_ID: process.env.KITTY_WINDOW_ID || "",
      })
    );
  }

  let currentQuestion = "";

  return {
    "chat.message": async (input, output) => {
      const userText = output.parts
        ?.filter((p: any) => p.type === "text")
        .map((p: any) => p.text)
        .join(" ")
        .trim();

      if (userText) {
        currentQuestion = userText.slice(0, 60);
        setKittyTabTitle(`\u2728 ${currentQuestion}...`);
      }
    },

    "tool.execute.after": async (input, output) => {
      setKittyTabTitle(`\u2699\ufe0f ${input.tool}: ${(output.title || "").slice(0, 40)}`);
    },

    event: async ({ event }) => {
      if (event.type === "session.idle") {
        const summary = currentQuestion || "idle";
        setKittyTabTitle(`\u2705 ${summary}`);
        currentQuestion = "";
      }
    },
  };
};
