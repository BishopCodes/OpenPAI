# PAI — Personal AI Infrastructure

PAI is a general problem-solving system that magnifies human capabilities. It runs inside OpenCode as an interconnected set of skills, plugins, tools, memory, and configuration — all orchestrated by The Algorithm.

## How It Works

**AGENTS.md** is the master config — generated from `AGENTS.md.template` via `BuildAGENTS.ts`. It defines execution modes, The Algorithm, and the context routing table. OpenCode loads it natively every session. A SessionStart hook keeps it fresh automatically.

**This directory (`PAI/`)** contains all system documentation, tools, user context, and the SKILL.md that defines PAI as a skill. The rest of the system lives alongside it under `~/.config/openpai/` (plugins, skills, settings, memory).

## Directory Structure

```
~/.config/openpai/
  AGENTS.md                    # Master config (generated from template)
  AGENTS.md.template           # Source template with variables
  opencode.json                # Single source of truth for all configuration
  plugins/                       # Event lifecycle plugins (21+)
  skills/                      # 12 categories, 49 skills — each with SKILL.md
  MEMORY/                      # Persistent memory (work, learning, relationship, state)
  PAI/                         # This directory — system docs + tools + user context
    Algorithm/                 # Versioned algorithm files + LATEST pointer
```

## Core Subsystems

### The Algorithm (`PAI/Algorithm/`)
The 7-phase execution engine: Observe, Think, Plan, Build, Execute, Verify, Learn. Transitions from CURRENT STATE to IDEAL STATE via verifiable criteria (ISC). Current version: v3.7.0.

### Skills (`SKILLSYSTEM.md`)
12 hierarchical categories with 49 total skills in `~/.config/openpai/skills/`, each with a `SKILL.md` defining triggers, workflows, and tools. Skills are the primary capability unit.

### Plugins (`THEPLUGINSYSTEM.md`)
21+ event plugins across the session lifecycle: SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, Stop, SessionEnd. Defined in `opencode.json`, implemented in `~/.config/openpai/plugins/`.

### Memory (`MEMORYSYSTEM.md`)
Persistent storage across sessions:
- **WORK/** — Session artifacts, PRDs, transcripts
- **LEARNING/** — Failure patterns, algorithm reflections, signals
- **RELATIONSHIP/** — Daily interaction patterns, preferences
- **STATE/** — Session names, algorithm state, caches
- **WISDOM/** — Domain knowledge frames that compound over time

### Tools (`Tools/`)
TypeScript utilities in `PAI/Tools/`: `BuildAGENTS.ts` (generate AGENTS.md from template), `Inference.ts` (AI calls), `GenerateSkillIndex.ts`, `SessionProgress.ts`, `Banner.ts`, and more.

### Agents (`PAIAGENTSYSTEM.md`)
14 specialized agent types (Algorithm, Engineer, Architect, Designer, Researcher variants). Custom agents via the Agents skill. Agent teams for coordinated multi-agent work.

### Security
Hook-based security: `SecurityValidator.plugin.ts` guards Bash, Edit, Write, Read. Path validation, command injection prevention, secret scanning.

### Notifications (`THENOTIFICATIONSYSTEM.md`)
Multi-channel: ntfy, Discord, Twilio. Voice announcements via Kokoro at localhost:8888.

### Configuration (`opencode.json`)
Single source of truth: identity (daidentity, principal), environment, permissions, plugins, notifications, status line, spinner verbs, counts, startup file loading (`loadAtStartup`), dynamic context toggles (`dynamicContext`).

## User Context (`USER/`)

Personal data directory. See `USER/README.md` for full index:
- **Identity:** `ABOUTME.md`, `DAIDENTITY.md`, `WRITINGSTYLE.md`
- **Rules:** `AISTEERINGRULES.md` (personal overrides)
- **Projects:** `PROJECTS/`
- **Life Goals:** `TELOS/` (via Telos skill)
- **Work:** `WORK/`, `BUSINESS/`
- **Skill Overrides:** `SKILLCUSTOMIZATIONS/`

## Startup & Context Loading

At session start, three things happen:
1. **AGENTS.md** loads natively (identity, algorithm, routing table)
2. **`loadAtStartup` files** from `opencode.json` are force-loaded by `LoadContext.plugin.ts`
3. **Dynamic context** injected by `LoadContext.plugin.ts`: relationship context, learning readback, active work summary (each toggleable in `opencode.json → dynamicContext`)

All other documentation loads on-demand based on the routing table in AGENTS.md.

## Build System

| Target | Source | Builder | Trigger |
|--------|--------|---------|---------|
| `AGENTS.md` | `AGENTS.md.template` + `opencode.json` + `PAI/Algorithm/LATEST` | `bun PAI/Tools/BuildAGENTS.ts` | SessionStart hook + manual |

## Extending PAI

- **Add a skill:** Use the CreateSkill skill under Utilities
- **Add a plugin:** Create handler in `~/.config/openpai/plugins/handlers/`, register in `opencode.json`
- **Add startup files:** Append to `opencode.json → loadAtStartup.files`
- **Add user context:** Create files in `PAI/USER/`
