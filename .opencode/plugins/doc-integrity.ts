import type { Plugin } from "@opencode-ai/plugin";
import { paiPath, logEvent } from "./lib/utils";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

interface DocDependency {
  source: string;
  targets: string[];
}

function loadDocDependencies(): DocDependency[] {
  const depPath = paiPath("PAI", "doc-dependencies.json");
  if (!existsSync(depPath)) return [];
  try {
    return JSON.parse(readFileSync(depPath, "utf-8"));
  } catch {
    return [];
  }
}

function getAffectedDocs(changedFile: string, deps: DocDependency[]): string[] {
  const affected: string[] = [];
  for (const dep of deps) {
    if (changedFile.includes(dep.source)) {
      affected.push(...dep.targets);
    }
  }
  return [...new Set(affected)];
}

export const DocIntegrityPlugin: Plugin = async ({ project }) => {
  const deps = loadDocDependencies();

  return {
    "tool.execute.after": async (input, output) => {
      if (!["Write", "Edit", "MultiEdit", "write", "edit"].includes(input.tool)) return;

      const filePath = input.args?.filePath || input.args?.file_path || "";
      if (!filePath.endsWith(".md")) return;

      const affected = getAffectedDocs(filePath, deps);
      if (affected.length === 0) return;

      logEvent("DOCS", "cross_ref_check_needed", {
        modifiedDoc: filePath,
        affectedDocs: affected,
      });

      output.metadata = output.metadata || {};
      output.metadata.docIntegrityWarning = `Modified ${filePath} — check cross-references in: ${affected.join(", ")}`;
    },

    event: async ({ event }) => {
      if (event.type === "file.edited") {
        const filePath = (event.properties as any)?.file || "";
        if (!filePath.endsWith(".md")) return;

        const affected = getAffectedDocs(filePath, deps);
        if (affected.length > 0) {
          logEvent("DOCS", "file_edited_cross_ref", {
            file: filePath,
            affectedDocs: affected,
          });
        }
      }
    },
  };
};
