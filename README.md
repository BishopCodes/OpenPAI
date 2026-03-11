<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./images/pai-logo-v7.png">
  <source media="(prefers-color-scheme: light)" srcset="./images/pai-logo-v7.png">
  <img alt="PAI Logo" src="./images/pai-logo-v7.png" width="300">
</picture>

<br/>
<br/>

# OpenPAI — Personal AI Infrastructure

> **🔱 Fork of [PAI](https://github.com/danielmiessler/Personal_AI_Infrastructure) by [Daniel Miessler](https://danielmiessler.com)**
> Free, open-source variant — replaces paid services with local alternatives and Claude Code with [OpenCode](https://opencode.ai).

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&weight=500&size=24&pause=1000&color=60A5FA&center=true&vCenter=true&width=600&lines=Everyone+needs+access+to+the+best+AI.;AI+should+magnify+everyone.;Your+personal+AI+stack.)](https://github.com/BishopCodes/OpenPAI)

<br/>

<!-- Social Proof -->
![Stars](https://img.shields.io/github/stars/BishopCodes/OpenPAI?style=social)
![Forks](https://img.shields.io/github/forks/BishopCodes/OpenPAI?style=social)
![Watchers](https://img.shields.io/github/watchers/BishopCodes/OpenPAI?style=social)

<!-- Project Health -->
![Release](https://img.shields.io/github/v/release/BishopCodes/OpenPAI?style=flat&logo=github&color=8B5CF6)
![Last Commit](https://img.shields.io/github/last-commit/BishopCodes/OpenPAI?style=flat&logo=git&color=22C55E)
![Open Issues](https://img.shields.io/github/issues/BishopCodes/OpenPAI?style=flat&logo=github&color=F97316)
![Open PRs](https://img.shields.io/github/issues-pr/BishopCodes/OpenPAI?style=flat&logo=github&color=EC4899)
![License](https://img.shields.io/github/license/BishopCodes/OpenPAI?style=flat&color=60A5FA)

<!-- Metrics -->
![Discussions](https://img.shields.io/github/discussions/BishopCodes/OpenPAI?style=flat&logo=github&label=Discussions&color=EAB308)
![Commit Activity](https://img.shields.io/github/commit-activity/m/BishopCodes/OpenPAI?style=flat&logo=git&label=Commits%2Fmo&color=F59E0B)
![Repo Size](https://img.shields.io/github/repo-size/BishopCodes/OpenPAI?style=flat&logo=database&label=Repo%20Size&color=D97706)

<!-- Content -->
[![Get Started](https://img.shields.io/badge/🚀_Get_Started-Install-22C55E?style=flat)](#-installation)
[![Release v4.0.3](https://img.shields.io/badge/📦_Release-v4.0.3-8B5CF6?style=flat)](Releases/v4.0.3/)
[![Contributors](https://img.shields.io/github/contributors/BishopCodes/OpenPAI?style=flat&logo=githubsponsors&logoColor=white&label=Contributors&color=EC4899)](https://github.com/BishopCodes/OpenPAI/graphs/contributors)

<!-- Tech Stack -->
[![Built with OpenCode](https://img.shields.io/badge/Built_with-OpenCode-22C55E?style=flat&logo=data:image/svg+xml;base64,&logoColor=white)](https://opencode.ai)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=flat&logo=bun&logoColor=white)](https://bun.sh)
[![Community](https://img.shields.io/badge/Community-5865F2?style=flat&logo=discord&logoColor=white)](https://github.com/BishopCodes/OpenPAI/discussions)

<br/>

**Overview:** [Purpose](#the-purpose-of-this-project) · [What is PAI?](#what-is-pai) · [New to AI?](#new-to-this-start-here) · [Principles](#the-pai-principles) · [Primitives](#pai-primitives)

**Get Started:** [Installation](#-installation) · [Releases](Releases/)

**Resources:** [FAQ](#-faq) · [Roadmap](#-roadmap) · [Community](#-community) · [Contributing](#-contributing)

<br/>

[![PAI Overview Video](https://img.youtube.com/vi/Le0DLrn7ta0/maxresdefault.jpg)](https://youtu.be/Le0DLrn7ta0)

**[Watch the full PAI walkthrough](https://youtu.be/Le0DLrn7ta0)** | **[Read: The Real Internet of Things](https://danielmiessler.com/blog/real-internet-of-things)**

---

</div>

> [!IMPORTANT]
> **OpenPAI v4.0.3 Released** — 3 patch updates since v4.0.0 with 30+ community-contributed fixes: Linux compatibility, JSON parsing, installer improvements, portability, and upgrade migration.
>
> **[Release notes →](Releases/v4.0.3/README.md)** | **[All releases →](Releases/)**

### What's Different in OpenPAI?

OpenPAI is a free, community fork of Daniel Miessler's PAI. Key changes:

| Original PAI | OpenPAI |
|---|---|
| Claude Code (paid) | [OpenCode](https://opencode.ai) (free, open-source) |
| ElevenLabs TTS (paid API) | [Kokoro 82M](https://github.com/hexgrad/kokoro) (local, free) |
| Hooks system | Plugins system (OpenCode native) |
| `~/.claude/` config | `~/.config/openpai/` config |
| `CLAUDE.md` | `AGENTS.md` |
| `settings.json` | `opencode.json` |

Same skills, same agents, same philosophy — zero paid API dependencies for core functionality.

<div align="center">

# AI should magnify everyone—not just the top 1%.

</div>

## The Purpose of This Project

**PAI exists to solve what I believe is the [P0 problem](https://danielmiessler.com/blog/telos) in the world:**

### Only a tiny fraction of humanity's creative potential is activated on Earth.

Most people don't believe they have valuable contributions to make. They think there are "special" people—and they aren't one of them. They've never asked who they are, what they're about, and have never articulated or written it down. This makes them catastrophically vulnerable to AI displacement. Without activation, there is no high-agency.

So our goal with OpenPAI is to activate people.

**PAI's mission is twofold:**

1. **Activate as many people as possible** — Help people identify, articulate, and pursue their own purpose in life through AI-augmented self-discovery
2. **Make the best AI available in the world accessible to everyone** — Ensure this quality of AI infrastructure isn't reserved for just the rich or technical elite.

That's why this is an open-source project instead of private.

---

## New to This? Start Here

You've probably used ChatGPT or Claude. Type a question, get an answer. Simple.

You can think of AI systems as **three levels**:

<p align="center">
  <img src="./images/pai-eli5-diagram.png" alt="The AI Evolution - From chatbots to your personal AI system" width="800">
</p>

### Chatbots

ChatGPT, Claude, Gemini—you ask something, it answers, and then it forgets everything. Next conversation starts fresh. No memory of you, your preferences, or what you talked about yesterday.

**The pattern:** Ask → Answer → Forget

### Agentic Platforms

Tools like OpenCode. The AI can actually *do* things—write code, browse the web, edit files, run commands.

**The pattern:** Ask → Use tools → Get result

More capable, but it still doesn't know *you*—your goals, your preferences, your history.

### PAI (Personal AI Infrastructure)

Now your DA **learns and improves**:
- **Captures every signal** — Ratings, sentiment, verification outcomes
- **Learns from mistakes** — Failures get analyzed and fixed
- **Gets better over time** — Success patterns get reinforced
- **Upgrades itself** — Skills, workflows, even the core behavior evolves

Plus it knows:
- **Your goals** — What you're working toward
- **Your preferences** — How you like things done
- **Your history** — Past decisions and learnings

**The pattern:** Observe → Think → Plan → Execute → Verify → **Learn** → Improve

The key difference: **PAI learns from feedback**. Every interaction makes it better at helping *you* specifically.

---

## What is PAI?

OpenPAI is a Personalized AI Platform designed to magnify your capabilities.

It's designed for humans most of all, but can be used by teams, companies, or Federations of Planets desiring to be better versions of themselves.

The scale of the entity doesn't matter: It's a system for understanding, articulating, and realizing its principal's goals using a full-featured Agentic AI Platform.

### Who is PAI for?

**Everyone, full stop.** It's the anti-gatekeeping AI project.

- **Small business owners** who aren't technical but want AI to handle invoicing, scheduling, customer follow-ups, and marketing
- **Companies** who want to understand their data, optimize operations, and make better decisions
- **Managers** who want to run their teams more effectively—tracking projects, preparing for reviews, and communicating clearly
- **Artists and creatives** who want to find local events, galleries, and opportunities to showcase their work
- **Everyday people** who want to improve their lives—better fitness routines, stronger social connections, personal finance, or just getting organized
- **Developers** using AI coding assistants who want persistent memory and custom workflows
- **Power users** who want their AI to know their goals, preferences, and context
- **Teams** building shared AI infrastructure with consistent capabilities
- **Experimenters** interested in AI system design and personal AI patterns

### What makes PAI different?

The first thing people ask is:

> How is this different from OpenCode, or any of the other agentic systems?

Most agentic systems are built around tools with the user being an afterthought. They are also mostly task-based instead of being goal-based using all the context available to them. OpenPAI is the opposite.

**Three core differentiators:**

1. **Goal Orientation** — PAI's primary focus is on the human running it and what they're trying to do in the world, not the tech. This is built into how the system executes all tasks.

2. **Pursuit of Optimal Output** — The system's outer loop and everything it does is trying to produce the exact right output given the current situation and all the contexts around it.

3. **Continuous Learning** — The system constantly captures signals about what was done, what changes were made, what outputs were produced for each request, and then how you liked or disliked the results.

---

## The PAI Principles

These principles guide how OpenPAI systems are designed and built. **[Full breakdown →](https://danielmiessler.com/blog/personal-ai-infrastructure)**

| # | Principle | Summary |
|---|-----------|---------|
| 1 | **User Centricity** | OpenPAI is built around you, not tooling. Your goals, preferences, and context come first—the infrastructure exists to serve them. |
| 2 | **The Foundational Algorithm** | The scientific method as a universal problem-solving loop: Observe → Think → Plan → Build → Execute → Verify → Learn. Define the ideal state, iterate until you reach it. |
| 3 | **Clear Thinking First** | Good prompts come from clear thinking. Clarify the problem before writing the prompt. |
| 4 | **Scaffolding > Model** | System architecture matters more than which model you use. |
| 5 | **Deterministic Infrastructure** | AI is probabilistic; your infrastructure shouldn't be. Use templates and patterns. |
| 6 | **Code Before Prompts** | If you can solve it with a bash script, don't use AI. |
| 7 | **Spec / Test / Evals First** | Write specifications and tests before building. Measure if the system works. |
| 8 | **UNIX Philosophy** | Do one thing well. Make tools composable. Use text interfaces. |
| 9 | **ENG / SRE Principles** | Treat AI infrastructure like production software: version control, automation, monitoring. |
| 10 | **CLI as Interface** | Command-line interfaces are faster, more scriptable, and more reliable than GUIs. |
| 11 | **Goal → Code → CLI → Prompts → Agents** | The decision hierarchy: clarify goal, then code, then CLI, then prompts, then agents. |
| 12 | **Skill Management** | Modular capabilities that route intelligently based on context. |
| 13 | **Memory System** | Everything worth knowing gets captured. History feeds future context. |
| 14 | **Agent Personalities** | Different work needs different approaches. Specialized agents with unique voices. |
| 15 | **Science as Meta-Loop** | Hypothesis → Experiment → Measure → Iterate. |
| 16 | **Permission to Fail** | Explicit permission to say "I don't know" prevents hallucinations. |

---

## OpenPAI Primitives

While the Principles describe the *philosophy* of PAI, the Primitives are the *architecture*—the core systems that make everything work.

<p align="center">
  <img src="./images/pai-unique-components-diagram.png" alt="PAI Primitives - A system that knows you, not a tool harness" width="800">
</p>

These primitives work together to create the experience of working with a system that understands and knows you—as opposed to a tool harness that just executes commands.

---

<p align="center">
  <img src="./images/pai-component-1-assistant-vs-agent.png" alt="Assistant vs Agent-Based Interaction" width="700">
</p>

### Assistant vs. Agent-Based AI Interaction

PAI treats AI as a [persistent assistant, friend, coach, and mentor](https://danielmiessler.com/blog/personal-ai-maturity-model) rather than a stateless agent that runs tasks. An assistant knows your goals, remembers your preferences, and improves over time. An agent executes commands and forgets.

---

<p align="center">
  <img src="./images/pai-primitive-telos.png" alt="TELOS - Deep Goal Understanding" width="700">
</p>

### TELOS (Deep Goal Understanding)

10 files that capture who you are: MISSION.md, GOALS.md, PROJECTS.md, BELIEFS.md, MODELS.md, STRATEGIES.md, NARRATIVES.md, LEARNED.md, CHALLENGES.md, IDEAS.md. Your DA knows what you're working toward because it's all documented.

---

<p align="center">
  <img src="./images/pai-primitive-user-system-separation.png" alt="User/System Separation" width="700">
</p>

### User/System Separation

Your customizations live in USER/. PAI infrastructure lives in SYSTEM/. When PAI upgrades, your files are untouched. Portable identity, upgrade-safe.

---

<p align="center">
  <img src="./images/pai-primitive-customization.png" alt="Granular Customization" width="700">
</p>

### Granular Customization

Six layers of customization: Identity (name, voice, personality), Preferences (tech stack, tools), Workflows (how skills execute), Skills (what capabilities exist), Hooks (how events are handled), and Memory (what gets captured). Start with defaults, customize when needed.

---

<p align="center">
  <img src="./images/pai-component-2-skill-system.png" alt="Skill System" width="700">
</p>

### Skill System

Highly focused on consistent results. It has a structure that puts *deterministic outcomes first* by going from CODE -> CLI-BASED-TOOL -> PROMPT -> SKILL instead of a haphazard structure.

---

<p align="center">
  <img src="./images/pai-component-3-memory-system.png" alt="Memory System" width="700">
</p>

### Memory System

Focused on continuous learning. Every interaction generates signals—ratings, sentiment, successes, failures—that feed back into improving the system. Three-tier architecture (hot/warm/cold) with phase-based learning directories.

---

<p align="center">
  <img src="./images/pai-component-6-hook-system.png" alt="Hook System" width="700">
</p>

### Plugin System

Responds to lifecycle events—session start, tool use, task completion, and more. 15+ event types enable voice notifications, automatic context loading, session capture, security validation, and observability.

---

<p align="center">
  <img src="./images/pai-component-5-security-system.png" alt="Security System" width="700">
</p>

### Security System

Defines system and user-level security policies by default. You don't have to run with `--dangerously-skip-permissions` to have an uninterrupted experience. PAI's security plugins validate commands before execution, blocking dangerous operations while allowing normal workflows to proceed smoothly.

---

<p align="center">
  <img src="./images/pai-component-4-ai-installation.png" alt="AI-Based Installation" width="700">
</p>

### AI-Based Installation

The GUI installer handles everything—prerequisites, configuration, and setup. No manual configuration, no guessing.

---

<p align="center">
  <img src="./images/pai-component-8-notification-system.png" alt="Notification System" width="700">
</p>

### Notification System

Keeps you informed without being intrusive. Push notifications via ntfy for mobile alerts, Discord integration for team updates, and duration-aware routing that escalates for long-running tasks. Fire-and-forget design means notifications never block your workflow.

---

<p align="center">
  <img src="./images/pai-component-9-voice-system.png" alt="Voice System" width="700">
</p>

### Voice System

Powered by Kokoro TTS. Hear task completions, session summaries, and important updates spoken aloud. Prosody enhancement makes speech sound natural. Your AI has a voice.

---

<p align="center">
  <img src="./images/pai-component-7-terminal-ui.png" alt="Terminal-Based UI" width="700">
</p>

### Terminal-Based UI

Rich tab titles and pane management. Dynamic status lines show learning signals, context usage, and current task state. Your terminal is a command center.

---

## 🚀 Installation

> [!CAUTION]
> **Project in Active Development** — OpenPAI is evolving rapidly. Expect breaking changes, restructuring, and frequent updates. We are working on stable and development branches, but currently it's all combined.

### Fresh Install

```bash
# Clone the repo
git clone https://github.com/BishopCodes/OpenPAI.git
cd OpenPAI/Releases/v4.0.3

# Copy the release and run the installer
cp -r .opencode ~/ && cd ~/.opencode && bash install.sh
```

**The installer will:**
- Detect your system and install prerequisites (Bun, Git, OpenCode)
- Ask for your name, AI assistant name, timezone, and temperature unit preference
- Clone/configure the OpenPAI repository into `~/.config/openpai/`
- Set up voice features with Kokoro (optional)
- Configure your shell alias and verify the installation

**After installation:** Run `source ~/.zshrc && pai` to launch PAI.

### Upgrading from a Previous Version

```bash
# 1. Back up your current installation
cp -r ~/.opencode ~/.opencode-backup-$(date +%Y%m%d)

# 2. Clone and copy the new release over your installation
git clone https://github.com/BishopCodes/OpenPAI.git
cd OpenPAI/Releases/v4.0.3
cp -r .opencode ~/

# 3. Run the installer (detects existing installation, preserves your data)
cd ~/.opencode && bash install.sh

# 4. Rebuild your AGENTS.md
bun ~/.config/openpai/PAI/Tools/BuildAGENTS.ts
```

> [!TIP]
> The installer **auto-detects** existing installations. It preserves your `USER/` files, merges `opencode.json` (only updating installer-managed fields like identity and version), and never overwrites your plugins, statusline, or custom configuration.

**Post-upgrade checklist:**
- [ ] Verify your identity in `opencode.json` (name, AI name, timezone)
- [ ] Confirm the statusline displays correctly
- [ ] Test voice notifications (if enabled)
- [ ] Run a simple prompt to confirm PAI responds correctly

---

## ❓ FAQ

### How is PAI different from just using OpenCode?

OpenPAI is built natively on OpenCode and designed to stay that way. We chose OpenCode because its plugin system, context management, and agentic architecture are the best foundation available for personal AI infrastructure.

PAI isn't a replacement for OpenCode — it's the layer on top that makes OpenCode *yours*:

- **Persistent memory** — Your DA remembers past sessions, decisions, and learnings
- **Custom skills** — Specialized capabilities for the things you do most
- **Your context** — Goals, contacts, preferences—all available without re-explaining
- **Intelligent routing** — Say "research this" and the right workflow triggers automatically
- **Self-improvement** — The system modifies itself based on what it learns

Think of it this way: OpenCode is the engine. OpenPAI is everything else that makes it *your* car.

### What's the difference between PAI and OpenCode's built-in features?

OpenCode provides powerful primitives — plugins, slash commands, MCP servers, context files. These are individual building blocks.

OpenPAI is the complete system built on those primitives. It connects everything together: your goals inform your skills, your skills generate memory, your memory improves future responses. PAI turns OpenCode's building blocks into a coherent personal AI platform.

### Is PAI only for OpenCode?

OpenPAI is OpenCode native. We believe OpenCode's plugin system, context management, and agentic capabilities make it the best platform for personal AI infrastructure, and OpenPAI is designed to take full advantage of those features.

That said, PAI's concepts (skills, memory, algorithms) are universal, and the code is TypeScript and Bash — so community members are welcome to adapt it for other platforms.

### How is this different from fabric?

[Fabric](https://github.com/danielmiessler/fabric) is a collection of AI prompts (patterns) for specific tasks. It's focused on *what to ask AI*.

OpenPAI is infrastructure for *how your DA operates*—memory, skills, routing, context, self-improvement. They're complementary. Many PAI users integrate Fabric patterns into their skills.

### What if I break something?

Recovery is straightforward:

- **Back up first** — Before any upgrade: `cp -r ~/.opencode ~/.opencode-backup-$(date +%Y%m%d)`
- **USER/ is safe** — Your customizations in `USER/` are never touched by the installer or upgrades
- **Settings merge, not overwrite** — The installer only updates identity and version fields; your plugins, statusline, and custom config are preserved
- **Git-backed** — Version control everything, roll back when needed
- **History is preserved** — Your DA's memory survives mistakes
- **DA can fix it** — Your DA helped build it, it can help repair it
- **Re-install** — Run the installer again; it detects existing installations and merges intelligently

---

## 🎯 Roadmap

| Feature | Description |
|---------|-------------|
| **Local Model Support** | Run PAI with local models (Ollama, llama.cpp) for privacy and cost control |
| **Granular Model Routing** | Route different tasks to different models based on complexity |
| **Remote Access** | Access your PAI from anywhere—mobile, web, other devices |
| **Outbound Phone Calling** | Voice capabilities for outbound calls |
| **External Notifications** | Robust notification system for Email, Discord, Telegram, Slack |

---

## 🌐 Community

**GitHub Discussions:** [Join the conversation](https://github.com/BishopCodes/OpenPAI/discussions)

**Community Discord:** OpenPAI is discussed in the [GitHub Discussions](https://github.com/BishopCodes/OpenPAI/discussions) along with other AI projects

**Twitter/X:** [@BishopCodes](https://github.com/BishopCodes)

**Blog:** [danielmiessler.com](https://danielmiessler.com)

### Star History

<a href="https://star-history.com/#BishopCodes/OpenPAI&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=BishopCodes/OpenPAI&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=BishopCodes/OpenPAI&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=BishopCodes/OpenPAI&type=Date" />
 </picture>
</a>

---

## 🤝 Contributing

We welcome contributions! See our [GitHub Issues](https://github.com/BishopCodes/OpenPAI/issues) for open tasks.

1. **Fork the repository**
2. **Make your changes** — Bug fixes, new skills, documentation improvements
3. **Test thoroughly** — Install in a fresh system to verify
4. **Submit a PR** with examples and testing evidence

---

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Credits

**[Daniel Miessler](https://danielmiessler.com)** — Creator of the original [PAI (Personal AI Infrastructure)](https://github.com/danielmiessler/Personal_AI_Infrastructure). OpenPAI is a fork of PAI v4.0.3. Daniel's vision of AI that magnifies everyone—not just the top 1%—is the foundation this project stands on.

**Anthropic and the Claude team** — The AI models powering the intelligence behind PAI.

**The [OpenCode](https://opencode.ai) team** — The agentic coding platform that OpenPAI is built on.

**[IndyDevDan](https://www.youtube.com/@indydevdan)** — For great videos on meta-prompting and custom agents that have inspired parts of PAI.

### Contributors

**[fayerman-source](https://github.com/fayerman-source)** — Google Cloud TTS provider integration and Linux audio support for the voice system.

**Matt Espinoza** — Extensive testing, ideas, and feedback for the PAI 2.3 release, plus roadmap contributions.

---

## 💜 Support This Project

<div align="center">

<a href="https://github.com/sponsors/BishopCodes"><img src="https://img.shields.io/badge/Sponsor-❤️-EA4AAA?style=for-the-badge&logo=github-sponsors&logoColor=white" alt="Sponsor"></a>

**OpenPAI is free and open-source forever. If you find it valuable, you can [sponsor the project](https://github.com/sponsors/BishopCodes).**

</div>

---

## 📚 Related Reading

- [The Real Internet of Things](https://danielmiessler.com/blog/real-internet-of-things) — The vision behind PAI
- [AI's Predictable Path: 7 Components](https://danielmiessler.com/blog/ai-predictable-path-7-components-2024) — Visual walkthrough of where AI is heading
- [Building a Personal AI Infrastructure](https://danielmiessler.com/blog/personal-ai-infrastructure) — Full PAI walkthrough with examples

---

<details>
<summary><strong>📜 Update History</strong></summary>

<br/>

**v4.0.3 (2026-03-01) — Community PR Patch**
- JSON array parsing fix in Inference.ts
- 29 dead references removed from CONTEXT_ROUTING.md
- WorldThreatModelHarness PAI_DIR portability
- User context migration for v2.5/v3.0 upgraders
- [Release Notes](Releases/v4.0.3/README.md)

**v4.0.2 (2026-03-01) — Bug Fix Patch**
- 13 surgical fixes: Linux compatibility, installer, statusline, plugins
- Cross-platform OAuth token extraction, GNU coreutils tr fix
- Inference guard (~15s savings), lineage tracking, dead code removal
- [Release Notes](Releases/v4.0.2/README.md)

**v4.0.1 (2026-02-28) — Upgrade Path & Preferences**
- Upgrade documentation with backup, merge, and post-upgrade checklist
- Configurable temperature unit (Fahrenheit/Celsius) in statusline and installer
- FAQ fixes: removed stale Python reference, improved recovery guidance
- [Release Notes](Releases/v4.0.1/README.md)

**v4.0.0 (2026-02-27) — Lean and Mean**
- 38 flat skill directories → 12 hierarchical categories (-68% top-level dirs)
- Dead systems removed: Components/, DocRebuild, RebuildSkill
- AGENTS.md template system with BuildAGENTS.ts + SessionStart plugin
- Algorithm v3.5.0 (up from v1.4.0)
- Comprehensive security sanitization (33+ files cleaned)
- All version refs updated, Electron crash fix
- 63 skills, 21 plugins, 180 workflows, 14 agents
- [Release Notes](Releases/v4.0.0/README.md)

**v3.0.0 (2026-02-15) — The Algorithm Matures**
- Algorithm v1.4.0 with constraint extraction and build drift prevention
- Persistent PRDs and parallel loop execution
- Full installer with GUI wizard
- 10 new skills, agent teams/swarm, voice personality system
- 38 skills, 20 plugins, 162 workflows
- [Release Notes](Releases/v3.0/README.md)

**v2.5.0 (2026-01-30) — Think Deeper, Execute Faster**
- Two-Pass Capability Selection: Hook hints validated against ISC in THINK phase
- Thinking Tools with Justify-Exclusion: Opt-OUT, not opt-IN for Council, RedTeam, FirstPrinciples, etc.
- Parallel-by-Default Execution: Independent tasks run concurrently via parallel agent spawning
- 28 skills, 17 plugins, 356 workflows
- [Release Notes](Releases/v2.5/README.md)

**v2.4.0 (2026-01-23) — The Algorithm**
- Universal problem-solving system with ISC (Ideal State Criteria) tracking
- 29 skills, 15 plugins, 331 workflows
- Euphoric Surprise as the outcome metric
- Enhanced security with AllowList enforcement
- [Release Notes](Releases/v2.4/README.md)

**v2.3.0 (2026-01-15) — Full Releases Return**
- Complete `.opencode/` directory releases with continuous learning
- Explicit and implicit rating capture
- Enhanced plugin system with 14 production plugins
- Status line with learning signal display
- [Release Notes](Releases/v2.3/README.md)

**v2.1.1 (2026-01-09) — MEMORY System Migration**
- History system merged into core as MEMORY System

**v2.1.0 (2025-12-31) — Modular Architecture**
- Source code in real files instead of embedded markdown

**v2.0.0 (2025-12-28) — PAI v2 Launch**
- Modular architecture with independent skills
- OpenCode native design

</details>

---

<div align="center">

**Built with ❤️ by the OpenPAI community — forked from [PAI](https://github.com/danielmiessler/Personal_AI_Infrastructure) by [Daniel Miessler](https://danielmiessler.com)**

*Augment yourself.*

</div>
