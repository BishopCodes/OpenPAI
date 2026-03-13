# Hook System

> **PAI 4.0** — This system is under active development. APIs, configuration formats, and features may change without notice.

**Event-Driven Automation Infrastructure**

**Location:** `~/.config/openpai/plugins/`
**Configuration:** `~/.config/openpai/opencode.jsonc`
**Status:** Active - 20 plugins running in production

---

## Overview

The PAI plugin system is an event-driven automation infrastructure built on OpenCode's native hook support. Plugins are executable scripts (TypeScript/Python) that run automatically in response to specific events during OpenCode sessions.

**Core Capabilities:**
- **Session Management** - Auto-load context, capture summaries, manage state
- **Voice Notifications** - Text-to-speech announcements for task completions
- **History Capture** - Automatic work/learning documentation to `~/.config/openpai/MEMORY/`
- **Multi-Agent Support** - Agent-specific plugins with voice routing
- **Tab Titles** - Dynamic terminal tab updates with task context
- **Unified Event Stream** - All plugins emit structured events to `events.jsonl` for real-time observability

**Key Principle:** Plugins run asynchronously and fail gracefully. They enhance the user experience but never block OpenCode's core functionality.

---

## Available Hook Types

OpenCode supports the following hook events:

### 1. **SessionStart**
**When:** OpenCode session begins (new conversation)
**Use Cases:**
- Load PAI context from `PAI/SKILL.md`
- Initialize session state
- Capture session metadata

**Current Plugins:**
```json
{
  "SessionStart": [
    {
      "plugins": [
        {
          "type": "command",
          "command": "${PAI_DIR}/plugins/KittyEnvPersist.plugin.ts"
        },
        {
          "type": "command",
          "command": "${PAI_DIR}/plugins/LoadContext.plugin.ts"
        }
      ]
    }
  ]
}
```

**What They Do:**
- `KittyEnvPersist.plugin.ts` - Persists Kitty terminal env vars to disk and resets tab title to clean state
- `LoadContext.plugin.ts` - Injects dynamic context (relationship, learning, work summary) as `<system-reminder>` at session start

---

### 2. **SessionEnd**
**When:** OpenCode session terminates (conversation ends)
**Use Cases:**
- Capture work completions and learning moments
- Generate session summaries
- Record relationship context
- Update system counts (skills, plugins, signals)
- Run integrity checks

**Current Plugins:**
```json
{
  "SessionEnd": [
    {
      "plugins": [
        {
          "type": "command",
          "command": "${PAI_DIR}/plugins/WorkCompletionLearning.plugin.ts"
        },
        {
          "type": "command",
          "command": "${PAI_DIR}/plugins/SessionCleanup.plugin.ts"
        },
        {
          "type": "command",
          "command": "${PAI_DIR}/plugins/RelationshipMemory.plugin.ts"
        },
        {
          "type": "command",
          "command": "${PAI_DIR}/plugins/UpdateCounts.plugin.ts"
        },
        {
          "type": "command",
          "command": "${PAI_DIR}/plugins/IntegrityCheck.plugin.ts"
        }
      ]
    }
  ]
}
```

**What They Do:**
- `WorkCompletionLearning.plugin.ts` - Reads PRD.md frontmatter for work metadata and ISC section for criteria status, captures learning to `MEMORY/LEARNING/` for significant work sessions
- `SessionCleanup.plugin.ts` - Marks PRD.md frontmatter status→COMPLETED and sets completed_at timestamp, clears session state, resets tab, cleans session names
- `RelationshipMemory.plugin.ts` - Captures relationship context (observations, behaviors) to `MEMORY/RELATIONSHIP/`
- `UpdateCounts.plugin.ts` - Updates system counts (skills, plugins, signals, workflows, files) displayed in the startup banner
- `IntegrityCheck.plugin.ts` - Runs DocCrossRefIntegrity and SystemIntegrity checks at session end

---

### 3. **UserPromptSubmit**
**When:** User submits a new prompt to Claude
**Use Cases:**
- Update UI indicators
- Pre-process user input
- Capture prompts for analysis
- Detect ratings and sentiment

**Current Plugins:**
```json
{
  "UserPromptSubmit": [
    {
      "plugins": [
        {
          "type": "command",
          "command": "${PAI_DIR}/plugins/RatingCapture.plugin.ts"
        },
        {
          "type": "command",
          "command": "${PAI_DIR}/plugins/UpdateTabTitle.plugin.ts"
        },
        {
          "type": "command",
          "command": "${PAI_DIR}/plugins/SessionAutoName.plugin.ts"
        }
      ]
    }
  ]
}
```

**What They Do:**

**RatingCapture.plugin.ts** - Unified Rating Detection
- Handles both explicit ratings ("7", "8 - good work") and implicit sentiment analysis
- Explicit path: Pattern match first (no inference needed), writes to `ratings.jsonl`
- Implicit path: Haiku inference for sentiment if no explicit match
- Low ratings (<6) auto-capture as learning opportunities
- Writes to `~/.config/openpai/MEMORY/SIGNALS/ratings.jsonl`
- Uses shared libraries: `plugins/lib/learning-utils.ts`, `plugins/lib/time.ts`
- **Inference:** `import { inference } from '../PAI/Tools/Inference'` → `inference({ level: 'fast', expectJson: true })`

**UpdateTabTitle.plugin.ts** - Tab Title + Working State
- Updates Kitty terminal tab title with task summary + `…` suffix
- Sets tab to **orange background** (working state)
- Announces via voice server with context-appropriate gerund
- See `TERMINALTABS.md` for full state system documentation
- **Inference:** `import { inference } from '../PAI/Tools/Inference'` → `inference({ level: 'fast' })`

**SessionAutoName.plugin.ts** - Automatic Session Naming
- Infers a short descriptive name for the session from the first substantive prompt
- Updates `MEMORY/STATE/session-names.json` with the session ID → name mapping
- Used by the startup banner and session management tools
- **Inference:** `import { inference } from '../PAI/Tools/Inference'` → `inference({ level: 'fast' })`

---

### 4. **Stop**
**When:** Main agent ({DAIDENTITY.NAME}) completes a response
**Use Cases:**
- Voice notifications for task completion
- Capture work summaries and learnings
- **Update terminal tab with final state** (color + suffix based on outcome)

**Current Plugins:**
```json
{
  "Stop": [
    {
      "plugins": [
        { "type": "command", "command": "${PAI_DIR}/plugins/LastResponseCache.plugin.ts" },
        { "type": "command", "command": "${PAI_DIR}/plugins/ResponseTabReset.plugin.ts" },
        { "type": "command", "command": "${PAI_DIR}/plugins/VoiceCompletion.plugin.ts" },
        { "type": "command", "command": "${PAI_DIR}/plugins/DocIntegrity.plugin.ts" },
        { "type": "command", "command": "${PAI_DIR}/plugins/AlgorithmTab.plugin.ts" }
      ]
    }
  ]
}
```

**What They Do:**

Each Stop hook is a self-contained `.plugin.ts` file that reads stdin via shared `plugins/lib/hook-io.ts`, calls its handler, and exits. Handlers in `plugins/handlers/` are unchanged — each hook is a thin wrapper.

**`LastResponseCache.plugin.ts`** — Cache last response for RatingCapture bridge
- Writes `last_assistant_message` (or transcript fallback) to `MEMORY/STATE/last-response.txt`
- RatingCapture reads this on the next UserPromptSubmit to access the previous response

**`ResponseTabReset.plugin.ts`** — Reset Kitty tab title/color after response
- Calls `handlers/TabState.ts` to set completed state
- Converts working gerund title to past tense

**`VoiceCompletion.plugin.ts`** — Send 🗣️ voice line to TTS server
- Calls `handlers/VoiceNotification.ts` for voice delivery
- Voice gate: only main sessions (checks `kitty-sessions/{sessionId}.json`)
- Subagents have no kitty-sessions file → voice blocked

**`AlgorithmTab.plugin.ts`** — Show Algorithm phase + progress in Kitty tab title
- Reads `work.json`, finds most recently updated active session, sets tab title

**`DocIntegrity.plugin.ts`** — Cross-reference + semantic drift checks
- Calls `handlers/DocCrossRefIntegrity.ts` — deterministic + inference-powered doc updates
- Self-gating: returns instantly when no system files were modified

**Tab State System:** See `TERMINALTABS.md` for complete documentation

---

### 5. **PreToolUse**
**When:** Before Claude executes any tool
**Use Cases:**
- Voice curl gating (prevent background agents from speaking)
- Security validation across file operations (Bash, Edit, Write, Read)
- Tab state updates on questions
- Agent execution guardrails
- Skill invocation validation

**Current Plugins:**
```json
{
  "PreToolUse": [
    {
      "matcher": "Bash",
      "plugins": [
        { "type": "command", "command": "${PAI_DIR}/plugins/SecurityValidator.plugin.ts" }
      ]
    },
    {
      "matcher": "Edit",
      "plugins": [
        { "type": "command", "command": "${PAI_DIR}/plugins/SecurityValidator.plugin.ts" }
      ]
    },
    {
      "matcher": "Write",
      "plugins": [
        { "type": "command", "command": "${PAI_DIR}/plugins/SecurityValidator.plugin.ts" }
      ]
    },
    {
      "matcher": "Read",
      "plugins": [
        { "type": "command", "command": "${PAI_DIR}/plugins/SecurityValidator.plugin.ts" }
      ]
    },
    {
      "matcher": "AskUserQuestion",
      "plugins": [
        { "type": "command", "command": "${PAI_DIR}/plugins/SetQuestionTab.plugin.ts" }
      ]
    },
    {
      "matcher": "Task",
      "plugins": [
        { "type": "command", "command": "${PAI_DIR}/plugins/AgentExecutionGuard.plugin.ts" }
      ]
    },
    {
      "matcher": "Skill",
      "plugins": [
        { "type": "command", "command": "${PAI_DIR}/plugins/SkillGuard.plugin.ts" }
      ]
    }
  ]
}
```

**What They Do:**
- `SecurityValidator.plugin.ts` - Validates operations against security patterns. Runs on **4 matchers**: Bash (dangerous commands), Edit (sensitive file protection), Write (sensitive file protection), Read (sensitive path access)
- `SetQuestionTab.plugin.ts` - Updates tab state to "awaiting input" when AskUserQuestion is invoked
- `AgentExecutionGuard.plugin.ts` - Validates agent spawning (Task tool) against execution policies
- `SkillGuard.plugin.ts` - Prevents false skill invocations (e.g., blocks keybindings-help unless explicitly requested)

---

### 6. **PostToolUse**
**When:** After Claude executes any tool
**Status:** Active - Algorithm state tracking

**Current Plugins:**
```json
{
  "PostToolUse": [
    {
      "matcher": "AskUserQuestion",
      "plugins": [
        { "type": "command", "command": "${PAI_DIR}/plugins/QuestionAnswered.plugin.ts" }
      ]
    },
    {
      "matcher": "Write",
      "plugins": [
        { "type": "command", "command": "${PAI_DIR}/plugins/PRDSync.plugin.ts" }
      ]
    },
    {
      "matcher": "Edit",
      "plugins": [
        { "type": "command", "command": "${PAI_DIR}/plugins/PRDSync.plugin.ts" }
      ]
    }
  ]
}
```

**What They Do:**

**QuestionAnswered.plugin.ts** - Post-Question Processing
- Fires after AskUserQuestion completes (user has answered)
- Captures the question and answer for session context
- Used for analytics and learning from user preferences

**PRDSync.plugin.ts** - PRD Frontmatter → work.json Sync
- Fires after Write/Edit to PRD files in `MEMORY/WORK/`
- Syncs PRD frontmatter (status, title, effort) to `MEMORY/STATE/work.json`
- Keeps work registry in sync without manual updates
- Non-blocking, fire-and-forget

---

### 7. **PreCompact**
**When:** Before Claude compacts context (long conversations)
**Status:** Not currently configured

**Potential Use Cases:**
- Preserve important context before compaction
- Log compaction events

---

## Configuration

### Location
**File:** `~/.config/openpai/opencode.jsonc`
**Section:** `"plugins": { ... }`

### Environment Variables
Plugins have access to all environment variables from `~/.config/openpai/openpai.json` `"env"` section:

```json
{
  "env": {
    "PAI_DIR": "$HOME/.config/openpai",
    "OPENCODE_MAX_OUTPUT_TOKENS": "64000"
  }
}
```

**Key Variables:**
- `PAI_DIR` - PAI installation directory (typically `~/.config/openpai`)
- Hook scripts reference `${PAI_DIR}` in command paths

### Identity Configuration (Central to Install Wizard)

**openpai.json is the single source of truth for all daidentity/configuration.**

```json
{
  "daidentity": {
    "name": "PAI",
    "fullName": "Personal AI",
    "displayName": "PAI",
    "color": "#3B82F6",
    "voiceId": "{YourKokoroVoiceId}"
  },
  "principal": {
    "name": "{YourName}",
    "pronunciation": "{YourName}",
    "timezone": "America/Los_Angeles"
  }
}
```

**Using the Identity Module:**
```typescript
import { getIdentity, getPrincipal, getDAName, getPrincipalName, getVoiceId } from './lib/identity';

// Get full identity objects
const identity = getIdentity();    // { name, fullName, displayName, voiceId, color }
const principal = getPrincipal();  // { name, pronunciation, timezone }

// Convenience functions
const DA_NAME = getDAName();        // "PAI"
const USER_NAME = getPrincipalName(); // "{YourName}"
const VOICE_ID = getVoiceId();        // from openpai.json daidentity.voiceId
```

**Why openpai.json?**
- Programmatic access via `JSON.parse()` - no regex parsing markdown
- Central to the PAI install wizard
- Single source of truth for all configuration
- Tool-friendly: easy to read/write from any language

### Hook Configuration Structure

```json
{
  "plugins": {
    "HookEventName": [
      {
        "matcher": "pattern",  // Optional: filter which tools/events trigger hook
        "plugins": [
          {
            "type": "command",
            "command": "${PAI_DIR}/plugins/my-plugin.ts --arg value"
          }
        ]
      }
    ]
  }
}
```

**Fields:**
- `HookEventName` - One of: SessionStart, SessionEnd, UserPromptSubmit, Stop, PreToolUse, PostToolUse, PreCompact
- `matcher` - Pattern to match (use `"*"` for all tools, or specific tool names)
- `type` - Always `"command"` (executes external script)
- Plugin scripts reference `${PAI_DIR}` in command paths
- `command` - Path to executable hook script (TypeScript/Python/Bash)

### Hook Input (stdin)
All plugins receive JSON data on stdin:

```typescript
{
  session_id: string;         // Unique session identifier
  transcript_path: string;    // Path to JSONL transcript
  hook_event_name: string;    // Event that triggered hook
  prompt?: string;            // User prompt (UserPromptSubmit only)
  tool_name?: string;         // Tool name (PreToolUse/PostToolUse)
  tool_input?: any;           // Tool parameters (PreToolUse)
  tool_output?: any;          // Tool result (PostToolUse)
  // ... event-specific fields
}
```

---

## Common Patterns

### 1. Voice Notifications

**Pattern:** Extract completion message → Send to voice server

```typescript
// handlers/VoiceNotification.ts pattern
import { getIdentity } from './lib/identity';

const identity = getIdentity();
const completionMessage = extractCompletionMessage(lastMessage);

const payload = {
  title: identity.name,
  message: completionMessage,
  voice_enabled: true,
  voice_id: identity.voiceId  // From openpai.json
};

await fetch('http://localhost:8888/notify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
```

**Agent-Specific Voices:**
Configure voice IDs via `openpai.json` daidentity section or environment variables.
Each agent can have a unique Kokoro voice configured. See the Agents skill for voice registry.

---

### 2. History Capture (UOCS Pattern)

**Pattern:** Parse structured response → Save to appropriate history directory

**File Naming Convention:**
```
YYYY-MM-DD-HHMMSS_TYPE_description.md
```

**Types:**
- `WORK` - General task completions
- `LEARNING` - Problem-solving learnings
- `SESSION` - Session summaries
- `RESEARCH` - Research findings (from agents)
- `FEATURE` - Feature implementations (from agents)
- `DECISION` - Architectural decisions (from agents)

**Example pattern (from WorkCompletionLearning.plugin.ts):**
```typescript
import { getLearningCategory, isLearningCapture } from './lib/learning-utils';
import { getPSTTimestamp, getYearMonth } from './lib/time';

const structured = extractStructuredSections(lastMessage);
const isLearning = isLearningCapture(text, structured.summary, structured.analysis);

// If learning content detected, capture to LEARNING/
if (isLearning) {
  const category = getLearningCategory(text);  // 'SYSTEM' or 'ALGORITHM'
  const targetDir = join(baseDir, 'MEMORY', 'LEARNING', category, getYearMonth());
  const filename = generateFilename(description, 'LEARNING');
  writeFileSync(join(targetDir, filename), content);
}
```

**Structured Sections Parsed:**
- `📋 SUMMARY:` - Brief overview
- `🔍 ANALYSIS:` - Key findings
- `⚡ ACTIONS:` - Steps taken
- `✅ RESULTS:` - Outcomes
- `📊 STATUS:` - Current state
- `➡️ NEXT:` - Follow-up actions
- `🎯 COMPLETED:` - **Voice notification line**

---

### 3. Agent Type Detection

**Pattern:** Identify which agent is executing → Route appropriately

```typescript
// Agent detection pattern
let agentName = getAgentForSession(sessionId);

// Detect from Task tool
if (hookData.tool_name === 'Task' && hookData.tool_input?.subagent_type) {
  agentName = hookData.tool_input.subagent_type;
  setAgentForSession(sessionId, agentName);
}

// Detect from OPENCODE_AGENT env variable
else if (process.env.OPENCODE_AGENT) {
  agentName = process.env.OPENCODE_AGENT;
}

// Detect from path (subagents run in /agents/name/)
else if (hookData.cwd && hookData.cwd.includes('/agents/')) {
  const agentMatch = hookData.cwd.match(/\/agents\/([^\/]+)/);
  if (agentMatch) agentName = agentMatch[1];
}
```

**Session Mapping:** `~/.config/openpai/MEMORY/STATE/agent-sessions.json`
```json
{
  "session-id-abc123": "engineer",
  "session-id-def456": "researcher"
}
```

---

### 4. Tab Title + Color State Architecture

**Pattern:** Visual state feedback through tab colors and title suffixes

**State Flow:**

| Event | Hook | Tab Title | Inactive Color | State |
|-------|------|-----------|----------------|-------|
| UserPromptSubmit | `UpdateTabTitle.plugin.ts` | `⚙️ Summary…` | Orange `#B35A00` | Working |
| Inference | `UpdateTabTitle.plugin.ts` | `🧠 Analyzing…` | Orange `#B35A00` | Inference |
| Stop (success) | `handlers/TabState.ts` | `Summary` | Green `#022800` | Completed |
| Stop (question) | `handlers/TabState.ts` | `Summary?` | Teal `#0D4F4F` | Awaiting Input |
| Stop (error) | `handlers/TabState.ts` | `Summary!` | Orange `#B35A00` | Error |

**Active Tab:** Always Dark Blue `#002B80` (state colors only affect inactive tabs)

**Why This Design:**
- **Instant visual feedback** - See state at a glance without reading
- **Color-coded priority** - Teal tabs need attention, green tabs are done
- **Suffix as state indicator** - Works even in narrow tab bars
- **Haiku only on user input** - One AI call per prompt (not per tool)

**State Detection (in Stop hook):**
1. Check transcript for `AskUserQuestion` tool → `awaitingInput`
2. Check `📊 STATUS:` for error patterns → `error`
3. Default → `completed`

**Text Colors:**
- Active tab: White `#FFFFFF` (always)
- Inactive tab: Gray `#A0A0A0` (always)

**Active Tab Background:** Dark Blue `#002B80` (always - state colors only affect inactive tabs)

**Tab Icons:**
- 🧠 Brain - AI inference in progress (Haiku/Sonnet thinking)
- ⚙️ Gear - Processing/working state

**Full Documentation:** See `~/.config/openpai/PAI/TERMINALTABS.md`

---

### 5. Async Non-Blocking Execution

**Pattern:** Hook executes quickly → Launch background processes for slow operations

```typescript
// update-tab-titles.ts pattern
// Set immediate tab title (fast)
execSync(`printf '\\033]0;${titleWithEmoji}\\007' >&2`);

// Launch background process for Haiku summary (slow)
Bun.spawn(['bun', `${paiDir}/plugins/UpdateTabTitle.ts`, prompt], {
  stdout: 'ignore',
  stderr: 'ignore',
  stdin: 'ignore'
});

process.exit(0);  // Exit immediately
```

**Key Principle:** Plugins must never block OpenCode. Always exit quickly, use background processes for slow work.

---

### 6. Graceful Failure

**Pattern:** Wrap everything in try/catch → Log errors → Exit successfully

```typescript
async function main() {
  try {
    // Hook logic here
  } catch (error) {
    // Log but don't fail
    console.error('Hook error:', error);
  }

  process.exit(0);  // Always exit 0
}
```

**Why:** If plugins crash, OpenCode may freeze. Always exit cleanly.

---

## Creating Custom Plugins

### Step 1: Choose Plugin Event
Decide which event should trigger your plugin (SessionStart, Stop, PostToolUse, etc.)

### Step 2: Create Plugin Script
**Location:** `~/.config/openpai/plugins/my-custom-plugin.ts`

**Template:**
```typescript
#!/usr/bin/env bun

interface PluginInput {
  session_id: string;
  transcript_path: string;
  hook_event_name: string;
  // ... event-specific fields
}

async function main() {
  try {
    // Read stdin
    const input = await Bun.stdin.text();
    const data: HookInput = JSON.parse(input);

    // Your hook logic here
    console.log(`Hook triggered: ${data.hook_event_name}`);

    // Example: Read transcript
    const fs = require('fs');
    const transcript = fs.readFileSync(data.transcript_path, 'utf-8');

    // Do something with the data

  } catch (error) {
    // Log but don't fail
    console.error('Hook error:', error);
  }

  process.exit(0);  // Always exit 0
}

main();
```

### Step 3: Make Executable
```bash
chmod +x ~/.config/openpai/plugins/my-custom-plugin.ts
```

### Step 4: Add to opencode.jsonc
```json
{
  "plugins": {
    "Stop": [
      {
        "plugins": [
          {
            "type": "command",
            "command": "${PAI_DIR}/plugins/my-custom-plugin.ts"
          }
        ]
      }
    ]
  }
}
```

### Step 5: Test
```bash
# Test hook directly
echo '{"session_id":"test","transcript_path":"/tmp/test.jsonl","hook_event_name":"Stop"}' | bun ~/.config/openpai/plugins/my-custom-plugin.ts
```

### Step 6: Restart OpenCode
Plugins are loaded at startup. Restart to apply changes.

---

## Hook Development Best Practices

### 1. **Fast Execution**
- Plugins should complete in < 500ms
- Use background processes for slow work (Haiku API calls, file processing)
- Exit immediately after launching background work

### 2. **Graceful Failure**
- Always wrap in try/catch
- Log errors to stderr (available in hook debug logs)
- Always `process.exit(0)` - never throw or exit(1)

### 3. **Non-Blocking**
- Never wait for external services (unless they respond quickly)
- Use `.catch(() => {})` for async operations
- Fail silently if optional services are offline

### 4. **Stdin Reading**
- Use timeout when reading stdin (OpenCode may not send data immediately)
- Handle empty/invalid input gracefully

```typescript
const decoder = new TextDecoder();
const reader = Bun.stdin.stream().getReader();

const timeoutPromise = new Promise<void>((resolve) => {
  setTimeout(() => resolve(), 500);  // 500ms timeout
});

await Promise.race([readPromise, timeoutPromise]);
```

### 5. **File I/O**
- Check `existsSync()` before reading files
- Create directories with `{ recursive: true }`
- Use PST timestamps for consistency

### 6. **Environment Access**
- All `openpai.json` env vars available via `process.env`
- Use `${PAI_DIR}` in opencode.jsonc for portability
- Access in code via `process.env.PAI_DIR`

### 7. **Logging**
- Log useful debug info to stderr for troubleshooting
- Include relevant metadata (session_id, tool_name, etc.)
- Never log sensitive data (API keys, user content)

---

## Troubleshooting

### Hook Not Running

**Check:**
1. Is hook script executable? `chmod +x ~/.config/openpai/plugins/my-hook.ts`
2. Is path correct in opencode.jsonc? Use `${PAI_DIR}/plugins/...`
3. Is opencode.jsonc valid JSON? `jq . ~/.config/openpai/opencode.jsonc`
4. Did you restart OpenCode after editing opencode.jsonc?

**Debug:**
```bash
# Test hook directly
echo '{"session_id":"test","transcript_path":"/tmp/test.jsonl","hook_event_name":"Stop"}' | bun ~/.config/openpai/plugins/my-hook.ts

# Check hook logs (stderr output)
tail -f ~/.config/openpai/plugins/debug.log  # If you add logging
```

---

### Hook Hangs/Freezes OpenCode

**Cause:** Hook not exiting (infinite loop, waiting for input, blocking operation)

**Fix:**
1. Add timeouts to all blocking operations
2. Ensure `process.exit(0)` is always reached
3. Use background processes for long operations
4. Check stdin reading has timeout

**Prevention:**
```typescript
// Always use timeout
setTimeout(() => {
  console.error('Hook timeout - exiting');
  process.exit(0);
}, 5000);  // 5 second max
```

---

### Voice Notifications Not Working

**Check:**
1. Is voice server running? `curl http://localhost:8888/health`
2. Is voice_id correct? See `PAI/SKILL.md` for mappings
3. Is message format correct? `{"message":"...", "voice_id":"...", "title":"..."}`
4. Is Kokoro API key in `${PAI_DIR}/.env`?

**Debug:**
```bash
# Test voice server directly
curl -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message":"Test message","voice_id":"[YOUR_VOICE_ID]","title":"Test"}'
```

**Common Issues:**
- Wrong voice_id → Silent failure (invalid ID)
- Voice server offline → Hook continues (graceful failure)
- No `🎯 COMPLETED:` line → No voice notification extracted

---

### Work Not Capturing

**Check:**
1. Does `~/.config/openpai/MEMORY/` directory exist?
2. Does current-work file exist? Check `~/.config/openpai/MEMORY/STATE/current-work.json`
3. Is hook actually running? Check `~/.config/openpai/MEMORY/RAW/` for events
4. File permissions? `ls -la ~/.config/openpai/MEMORY/WORK/`

**Debug:**
```bash
# Check current work
cat ~/.config/openpai/MEMORY/STATE/current-work.json

# Check recent work directories
ls -lt ~/.config/openpai/MEMORY/WORK/ | head -10
ls -lt ~/.config/openpai/MEMORY/LEARNING/$(date +%Y-%m)/ | head -10

# Check raw events
tail ~/.config/openpai/MEMORY/RAW/$(date +%Y-%m)/$(date +%Y-%m-%d)_all-events.jsonl
```

**Common Issues:**
- Missing current-work.json → Work not being tracked for this session
- Work not updating → capture handler not finding current work
- Learning detection too strict → Adjust `isLearningCapture()` logic

---

### Stop Event Not Firing (RESOLVED)

**Original Issue:** Stop events were not firing consistently in earlier OpenCode versions, causing voice notifications and work capture to fail silently.

**Resolution:** Fixed in OpenCode updates. The Stop plugins now fires reliably. The unified orchestrator pattern (`Stop plugins.plugin.ts` delegating to `handlers/`) was implemented in part to work around this — and remains the production architecture.

**Status:** RESOLVED — Stop events now fire reliably. Stop plugins handles all post-response work.

---

### Agent Detection Failing

**Check:**
1. Is `~/.config/openpai/MEMORY/STATE/agent-sessions.json` writable?
2. Is `[AGENT:type]` tag in `🎯 COMPLETED:` line?
3. Is agent running from correct directory? (`/agents/name/`)

**Debug:**
```bash
# Check session mappings
cat ~/.config/openpai/MEMORY/STATE/agent-sessions.json | jq .

# Check subagent-stop debug log
tail -f ~/.config/openpai/plugins/subagent-stop-debug.log
```

**Fix:**
- Ensure agents include `[AGENT:type]` in completion line
- Verify Task tool passes `subagent_type` parameter
- Check cwd includes `/agents/` in path

---

### Transcript Type Mismatch (Fixed 2026-01-11)

**Symptom:** Context reading functions return empty results even though transcript has data

**Root Cause:** OpenCode transcripts use `type: "user"` but plugins were checking for `type: "human"`.

**Affected Plugins:**
- `UpdateTabTitle.plugin.ts` - Couldn't read user messages for context
- `RatingCapture.plugin.ts` - Same issue

**Fix Applied:**
1. Changed `entry.type === 'human'` → `entry.type === 'user'`
2. Improved content extraction to skip `tool_result` blocks and only capture actual text

**Verification:**
```bash
# Check transcript type field
grep '"type":"user"' ~/.config/openpai/projects/-Users-username--claude/*.jsonl | head -1 | jq '.type'
# Should output: "user" (not "human")
```

**Prevention:** When parsing transcripts, always verify the actual JSON structure first.

---

### Context Loading Issues (SessionStart)

**Check:**
1. Does `~/.config/openpai/PAI/SKILL.md` exist?
2. Is `LoadContext.plugin.ts` executable?
3. Is `PAI_DIR` env variable set correctly?

**Debug:**
```bash
# Test context loading directly
bun ~/.config/openpai/plugins/LoadContext.plugin.ts

# Should output <system-reminder> with SKILL.md content
```

**Common Issues:**
- Subagent sessions loading main context → Fixed (subagent detection in hook)
- File not found → Check `PAI_DIR` environment variable
- Permission denied → `chmod +x ~/.config/openpai/plugins/LoadContext.plugin.ts`

---

## Advanced Topics

### Multi-Hook Execution Order

Plugins in same event execute **sequentially** in order defined in opencode.jsonc:

```json
{
  "Stop": [
    {
      "plugins": [
        { "command": "${PAI_DIR}/plugins/Stop plugins.plugin.ts" }  // Single orchestrator
      ]
    }
  ]
}
```

**Note:** If first hook hangs, second won't run. Keep plugins fast!

---

### Matcher Patterns

`"matcher"` field filters which events trigger hook:

```json
{
  "PostToolUse": [
    {
      "matcher": "Bash",  // Only Bash tool executions
      "plugins": [...]
    },
    {
      "matcher": "*",     // All tool executions
      "plugins": [...]
    }
  ]
}
```

**Patterns:**
- `"*"` - All events
- `"Bash"` - Specific tool name
- `""` - Empty (all events, same as `*`)

---

### Hook Data Payloads by Event Type

**SessionStart:**
```typescript
{
  session_id: string;
  transcript_path: string;
  hook_event_name: "SessionStart";
  cwd: string;
}
```

**UserPromptSubmit:**
```typescript
{
  session_id: string;
  transcript_path: string;
  hook_event_name: "UserPromptSubmit";
  prompt: string;  // The user's prompt text
}
```

**PreToolUse:**
```typescript
{
  session_id: string;
  transcript_path: string;
  hook_event_name: "PreToolUse";
  tool_name: string;
  tool_input: any;  // Tool parameters
}
```

**PostToolUse:**
```typescript
{
  session_id: string;
  transcript_path: string;
  hook_event_name: "PostToolUse";
  tool_name: string;
  tool_input: any;
  tool_output: any;  // Tool result
  error?: string;    // If tool failed
}
```

**Stop:**
```typescript
{
  session_id: string;
  transcript_path: string;
  hook_event_name: "Stop";
}
```

**SessionEnd:**
```typescript
{
  conversation_id: string;  // Note: different field name
  timestamp: string;
}
```

---

## Related Documentation

- **Voice System:** `~/.config/openpai/VoiceServer/SKILL.md`
- **Agent System:** `~/.config/openpai/skills/Agents/SKILL.md`
- **History/Memory:** `~/.config/openpai/PAI/MEMORYSYSTEM.md`

---

## Quick Reference Card

```
HOOK LIFECYCLE:
1. Event occurs (SessionStart, Stop, etc.)
2. OpenCode writes hook data to stdin
3. Hook script executes
4. Hook reads stdin (with timeout)
5. Hook performs actions (voice, capture, etc.)
6. Hook exits 0 (always succeeds)
7. OpenCode continues

HOOKS BY EVENT (22 plugins total):

SESSION START (2 plugins):
  KittyEnvPersist.plugin.ts        Persist Kitty env vars + tab reset
  LoadContext.plugin.ts             Dynamic context injection (relationship, learning, work)

SESSION END (5 plugins):
  WorkCompletionLearning.plugin.ts Work/learning capture to MEMORY/
  SessionCleanup.plugin.ts         Mark WORK dir complete, clear state, reset tab
  RelationshipMemory.plugin.ts     Relationship context to MEMORY/RELATIONSHIP/
  UpdateCounts.plugin.ts           Refresh system counts (skills, plugins, signals)
  IntegrityCheck.plugin.ts         System integrity checks

USER PROMPT SUBMIT (3 plugins):
  RatingCapture.plugin.ts          Unified rating capture (explicit + implicit)
  UpdateTabTitle.plugin.ts         Tab title + working state (orange)
  SessionAutoName.plugin.ts        Auto-name session from first prompt

STOP (5 plugins):
  LastResponseCache.plugin.ts      Cache response for RatingCapture bridge
  ResponseTabReset.plugin.ts       Tab title/color reset after response
  VoiceCompletion.plugin.ts        Voice TTS (main sessions only)
  DocIntegrity.plugin.ts           Cross-ref + semantic drift checks
  AlgorithmTab.plugin.ts           Algorithm phase + progress in tab

PRE TOOL USE (4 plugins):
  SecurityValidator.plugin.ts      Security validation [Bash, Edit, Write, Read]
  SetQuestionTab.plugin.ts         Tab state on question [AskUserQuestion]
  AgentExecutionGuard.plugin.ts    Agent spawn guardrails [Task]
  SkillGuard.plugin.ts             Skill invocation validation [Skill]

POST TOOL USE (2 plugins):
  QuestionAnswered.plugin.ts       Post-question tab reset [AskUserQuestion]
  PRDSync.plugin.ts                PRD → work.json sync [Write, Edit]

KEY FILES:
~/.config/openpai/opencode.jsonc             Hook configuration
~/.config/openpai/plugins/                     Hook scripts (22 files)
~/.config/openpai/plugins/handlers/            Handler modules (6 files)
~/.config/openpai/plugins/lib/                 Shared libraries (13 files)
~/.config/openpai/plugins/lib/learning-utils.ts Learning categorization
~/.config/openpai/plugins/lib/time.ts          PST timestamp utilities
~/.config/openpai/plugins/lib/event-types.ts   Typed event definitions (22 interfaces)
~/.config/openpai/plugins/lib/event-emitter.ts appendEvent() → events.jsonl
~/.config/openpai/MEMORY/WORK/               Work tracking
~/.config/openpai/MEMORY/LEARNING/           Learning captures
~/.config/openpai/MEMORY/STATE/              Runtime state
~/.config/openpai/MEMORY/STATE/events.jsonl  Unified event log (append-only)

INFERENCE TOOL (for plugins needing AI):
Path: ~/.config/openpai/PAI/Tools/Inference.ts
Import: import { inference } from '../PAI/Tools/Inference'
Levels: fast (~15s) | standard (~30s) | smart (~90s) — models discovered at runtime from configured providers

TAB STATE SYSTEM:
Inference: 🧠…  Orange #B35A00  (AI thinking)
Working:   ⚙️…  Orange #B35A00  (processing)
Completed:      Green  #022800  (task done)
Awaiting:  ?    Teal   #0D4F4F  (needs input)
Error:     !    Orange #B35A00  (problem detected)
Active Tab: Always Dark Blue #002B80 (state colors = inactive only)

VOICE SERVER:
URL: http://localhost:8888/notify
Payload: {"message":"...", "voice_id":"...", "title":"..."}
Configure voice IDs in individual agent files (`agents/*.md` persona frontmatter)

```

---

## Shared Libraries

The plugin system uses shared TypeScript libraries to eliminate code duplication:

### `plugins/lib/learning-utils.ts`
Shared learning categorization logic.

```typescript
import { getLearningCategory, isLearningCapture } from './lib/learning-utils';

// Categorize learning as SYSTEM (tooling/infra) or ALGORITHM (task execution)
const category = getLearningCategory(content, comment);
// Returns: 'SYSTEM' | 'ALGORITHM'

// Check if response contains learning indicators
const isLearning = isLearningCapture(text, summary, analysis);
// Returns: boolean (true if 2+ learning indicators found)
```

**Used by:** RatingCapture, WorkCompletionLearning

### `plugins/lib/time.ts`
Shared PST timestamp utilities.

```typescript
import {
  getPSTTimestamp,    // "2026-01-10 20:30:00 PST"
  getPSTDate,         // "2026-01-10"
  getYearMonth,       // "2026-01"
  getISOTimestamp,    // ISO8601 with offset
  getFilenameTimestamp, // "2026-01-10-203000"
  getPSTComponents    // { year, month, day, hours, minutes, seconds }
} from './lib/time';
```

**Used by:** RatingCapture, WorkCompletionLearning, SessionSummary

### `plugins/lib/identity.ts`
Identity and principal configuration from openpai.json.

```typescript
import { getIdentity, getPrincipal, getDAName, getPrincipalName, getVoiceId } from './lib/identity';

const identity = getIdentity();    // { name, fullName, displayName, voiceId, color }
const principal = getPrincipal();  // { name, pronunciation, timezone }
```

**Used by:** handlers/VoiceNotification.ts, RatingCapture, handlers/TabState.ts

### `PAI/Tools/Inference.ts`
Unified AI inference with three run levels.

```typescript
import { inference } from '../PAI/Tools/Inference';

// Fast (Haiku) - quick tasks, 15s timeout
const result = await inference({
  systemPrompt: 'Summarize in 3 words',
  userPrompt: text,
  level: 'fast',
});

// Standard (Sonnet) - balanced reasoning, 30s timeout
const result = await inference({
  systemPrompt: 'Analyze sentiment',
  userPrompt: text,
  level: 'standard',
  expectJson: true,
});

// Smart (Opus) - deep reasoning, 90s timeout
const result = await inference({
  systemPrompt: 'Strategic analysis',
  userPrompt: text,
  level: 'smart',
});

// Result shape
interface InferenceResult {
  success: boolean;
  output: string;
  parsed?: unknown;  // if expectJson: true
  error?: string;
  latencyMs: number;
  level: 'fast' | 'standard' | 'smart';
}
```

**Used by:** RatingCapture, UpdateTabTitle, SessionAutoName

---

## Unified Event System

Alongside existing filesystem state writes (algorithm-state JSON, PRDs, session-names.json, etc.), plugins can emit structured events to a single append-only JSONL log. This provides a unified observability layer without replacing any existing state management.

### Components

| File | Purpose |
|------|---------|
| `${PAI_DIR}/plugins/lib/event-types.ts` | TypeScript discriminated union of all PAI event types (22 interfaces covering algorithm, work, session, rating, learning, voice, PRD, doc, build, system, tab, hook error, and custom events) |
| `${PAI_DIR}/plugins/lib/event-emitter.ts` | `appendEvent()` utility that writes typed events to `${PAI_DIR}/MEMORY/STATE/events.jsonl` |

### Usage in Plugins

Plugins call `appendEvent()` as a secondary write **alongside** their existing state writes. The emitter is synchronous, fire-and-forget, and silently swallows errors so it never blocks or crashes a hook.

```typescript
import { appendEvent } from './lib/event-emitter';

// Inside an existing hook, AFTER the normal state write:
appendEvent({ type: 'work.created', source: 'PRDSync', slug: 'my-task' });
```

### Event Structure

Every event has a common base shape plus type-specific fields:
- `timestamp` (ISO 8601) -- auto-injected by `appendEvent()`
- `session_id` -- auto-injected from `OPENCODE_SESSION_ID` env
- `source` -- the hook or handler name that emitted the event
- `type` -- dot-separated topic (e.g., `algorithm.phase`, `work.created`, `voice.sent`, `rating.captured`)

Events use a dot-separated topic hierarchy for filtering. A `custom.*` escape hatch allows arbitrary extension without modifying the type system.

### Event Type Categories

| Category | Types | Emitting Plugins |
|----------|-------|----------------|
| `work.*` | created, completed | PRDSync, SessionCleanup |
| `session.*` | named, completed | SessionCleanup |
| `rating.*` | captured | RatingCapture |
| `learning.*` | captured | WorkCompletionLearning |
| `voice.*` | sent | VoiceNotification |
| `prd.*` | synced | PRDSync |
| `doc.*` | integrity | DocIntegrity |
| `build.*` | rebuild | BuildAGENTS (SessionStart handler) |
| `system.*` | integrity | IntegrityCheck |
| `settings.*` | counts_updated | UpdateCounts |
| `tab.*` | updated | TabState, UpdateTabTitle |
| `hook.*` | error | Any hook (error reporting) |
| `custom.*` | user-defined | Extensibility escape hatch |

### Consuming Events

```bash
# Live tail (real-time monitoring)
tail -f ~/.config/openpai/MEMORY/STATE/events.jsonl | jq

# Filter by type
tail -f ~/.config/openpai/MEMORY/STATE/events.jsonl | jq 'select(.type | startswith("algorithm."))'

# Programmatic (Node/Bun fs.watch)
import { watch } from 'fs';
import { getEventsPath } from './plugins/lib/event-emitter';
watch(getEventsPath(), (eventType) => { /* read new lines */ });
```

### Key Principles

- **Additive only** -- events supplement existing state files, they never replace them
- **Append-only** -- `events.jsonl` is an immutable log, never rewritten or truncated by plugins
- **Graceful failure** -- write errors are swallowed; events are observability, not critical path
- **One file** -- all event types go to a single `events.jsonl` for simple tailing and watching

---

**Last Updated:** 2026-02-25
**Status:** Production - 15 plugins emitting 22 event types across 14 categories
**Maintainer:** PAI System
