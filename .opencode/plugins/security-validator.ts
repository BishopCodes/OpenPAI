import type { Plugin } from "@opencode-ai/plugin";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { parse as parseYAML } from "yaml";
import { paiPath, logEvent, loadConfig } from "./lib/utils";

interface SecurityPattern {
  bash?: {
    trusted?: string[];
    blocked?: string[];
    confirm?: string[];
    alert?: string[];
  };
  files?: {
    zeroAccess?: string[];
    readOnly?: string[];
    confirmWrite?: string[];
    noDelete?: string[];
  };
}

function loadSecurityPatterns(): SecurityPattern {
  const patterns: SecurityPattern = { bash: {}, files: {} };

  for (const scope of ["PAI", "PAI/USER"] as const) {
    const yamlPath = paiPath(scope, "SECURITY", "patterns.yaml");
    if (!existsSync(yamlPath)) continue;
    try {
      const parsed = parseYAML(readFileSync(yamlPath, "utf-8")) as SecurityPattern;
      if (parsed.bash) {
        for (const key of ["trusted", "blocked", "confirm", "alert"] as const) {
          patterns.bash![key] = [...(patterns.bash![key] || []), ...(parsed.bash[key] || [])];
        }
      }
      if (parsed.files) {
        for (const key of ["zeroAccess", "readOnly", "confirmWrite", "noDelete"] as const) {
          patterns.files![key] = [...(patterns.files![key] || []), ...(parsed.files[key] || [])];
        }
      }
    } catch {}
  }
  return patterns;
}

function matchesAnyPattern(value: string, patterns: string[]): boolean {
  return patterns.some((p) => {
    if (p.includes("*")) {
      const regex = new RegExp("^" + p.replace(/\*/g, ".*") + "$");
      return regex.test(value);
    }
    return value.includes(p);
  });
}

function validateBashCommand(
  command: string,
  patterns: SecurityPattern
): { allowed: boolean; reason?: string; confirm?: boolean } {
  const bash = patterns.bash || {};

  if (bash.trusted?.length && matchesAnyPattern(command, bash.trusted)) {
    return { allowed: true };
  }

  if (bash.blocked?.length && matchesAnyPattern(command, bash.blocked)) {
    logEvent("SECURITY", "blocked_command", { command });
    return { allowed: false, reason: `Blocked command pattern detected: ${command.slice(0, 80)}` };
  }

  if (bash.confirm?.length && matchesAnyPattern(command, bash.confirm)) {
    return { allowed: false, confirm: true, reason: `Requires confirmation: ${command.slice(0, 80)}` };
  }

  if (bash.alert?.length && matchesAnyPattern(command, bash.alert)) {
    logEvent("SECURITY", "alert_command", { command });
  }

  return { allowed: true };
}

function validateFilePath(
  filePath: string,
  operation: "read" | "write" | "delete",
  patterns: SecurityPattern
): { allowed: boolean; reason?: string; confirm?: boolean } {
  const files = patterns.files || {};

  if (files.zeroAccess?.length && matchesAnyPattern(filePath, files.zeroAccess)) {
    logEvent("SECURITY", "zero_access_blocked", { filePath, operation });
    return { allowed: false, reason: `Zero access: ${filePath}` };
  }

  if (operation === "write" || operation === "delete") {
    if (files.readOnly?.length && matchesAnyPattern(filePath, files.readOnly)) {
      return { allowed: false, reason: `Read-only file: ${filePath}` };
    }
  }

  if (operation === "write") {
    if (files.confirmWrite?.length && matchesAnyPattern(filePath, files.confirmWrite)) {
      return { allowed: false, confirm: true, reason: `Confirm write to: ${filePath}` };
    }
  }

  if (operation === "delete") {
    if (files.noDelete?.length && matchesAnyPattern(filePath, files.noDelete)) {
      return { allowed: false, reason: `Cannot delete: ${filePath}` };
    }
  }

  return { allowed: true };
}

export const SecurityValidatorPlugin: Plugin = async ({ project, $ }) => {
  const patterns = loadSecurityPatterns();

  return {
    "tool.execute.before": async (input, output) => {
      const toolName = input.tool;

      if (toolName === "Bash" || toolName === "bash") {
        const command = output.args?.command || output.args?.input || "";
        const result = validateBashCommand(command, patterns);
        if (!result.allowed && !result.confirm) {
          throw new Error(`[SecurityValidator] ${result.reason}`);
        }
        if (result.confirm) {
          // OpenCode's permission system will handle the ask flow
          // We log and let the permission.ask hook handle it
          logEvent("SECURITY", "confirm_required", { command, reason: result.reason });
        }
      }

      if (["Write", "Edit", "MultiEdit", "write", "edit"].includes(toolName)) {
        const filePath = output.args?.filePath || output.args?.file_path || "";
        const result = validateFilePath(filePath, "write", patterns);
        if (!result.allowed && !result.confirm) {
          throw new Error(`[SecurityValidator] ${result.reason}`);
        }
      }

      if (["Read", "read"].includes(toolName)) {
        const filePath = output.args?.filePath || output.args?.file_path || "";
        const result = validateFilePath(filePath, "read", patterns);
        if (!result.allowed) {
          throw new Error(`[SecurityValidator] ${result.reason}`);
        }
      }
    },

    "permission.ask": async (input, output) => {
      // Allow security validator to override permission decisions
      const toolName = input.type;
      if (toolName === "Bash" || toolName === "bash") {
        const command = (input.metadata?.command as string) || input.title || "";
        const result = validateBashCommand(command, patterns);
        if (!result.allowed && !result.confirm) {
          output.status = "deny";
        }
      }
    },
  };
};
