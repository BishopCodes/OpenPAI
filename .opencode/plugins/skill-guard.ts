import type { Plugin } from "@opencode-ai/plugin";
import { paiPath, logEvent } from "./lib/utils";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";

function skillExists(skillName: string): boolean {
  const skillsDir = paiPath("skills");
  if (!existsSync(skillsDir)) return false;

  for (const category of readdirSync(skillsDir)) {
    const skillPath = join(skillsDir, category, skillName);
    if (existsSync(skillPath) && existsSync(join(skillPath, "SKILL.md"))) {
      return true;
    }
  }

  const directPath = join(skillsDir, skillName);
  if (existsSync(directPath) && existsSync(join(directPath, "SKILL.md"))) {
    return true;
  }

  return false;
}

function agentExists(agentName: string): boolean {
  const agentsDir = paiPath(".opencode", "agents");
  if (!existsSync(agentsDir)) return false;

  const agentFile = join(agentsDir, `${agentName}.md`);
  return existsSync(agentFile);
}

export const SkillGuardPlugin: Plugin = async ({ project }) => {
  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool !== "Task" && input.tool !== "task") return;

      const args = output.args || {};

      if (args.skill || args.skillName) {
        const skillName = args.skill || args.skillName;
        if (!skillExists(skillName)) {
          logEvent("SECURITY", "skill_not_found", { skillName });
          throw new Error(
            `[SkillGuard] Skill "${skillName}" not found. Available skills are in ${paiPath("skills")}`
          );
        }
      }

      if (args.agent || args.agentName) {
        const agentName = args.agent || args.agentName;
        if (!agentExists(agentName)) {
          logEvent("SECURITY", "agent_not_found", { agentName });
          throw new Error(
            `[AgentGuard] Agent "${agentName}" not found. Available agents are in ${paiPath(".opencode", "agents")}`
          );
        }
      }
    },
  };
};
