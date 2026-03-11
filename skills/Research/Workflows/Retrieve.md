# Retrieve Workflow

Intelligent multi-layer content retrieval system for DIFFICULT content retrieval. Uses built-in tools (WebFetch, WebSearch) and Playwright browser automation for JavaScript rendering and dynamic content. USE ONLY WHEN user indicates difficulty: 'can't get this', 'having trouble', 'site is blocking', 'protected site', 'won't let me scrape'. DO NOT use for simple 'read this page' or 'get content from' without indication of difficulty.

## 🎯 Load Full PAI Context

**Before starting any task with this skill, load complete PAI context:**

`read ~/.config/openpai/PAI/SKILL.md`

This provides access to:
- Complete contact list (Angela, Bunny, Saša, Greg, team members)
- Stack preferences (TypeScript>Python, bun>npm, uv>pip)
- Security rules and repository safety protocols
- Response format requirements (structured emoji format)
- Voice IDs for agent routing (Kokoro)
- Personal preferences and operating instructions

## When to Use This Skill

**⚠️ IMPORTANT:** This skill is for CHALLENGING content retrieval only, not routine fetching.

**✅ DO USE this skill when user indicates difficulty:**
- "I can't get this content"
- "Having trouble retrieving this"
- "Site is blocking me"
- "Protected site" / "CloudFlare protected"
- "Keeps giving me CAPTCHA"
- "Won't let me scrape this"
- "Bot detection blocking me"
- "Rate limited when trying to get this"
- "Tried to fetch but failed"
- "Need advanced scraping for this"

**❌ DO NOT use this skill for simple requests:**
- "Read this page" → Use WebFetch directly
- "Get content from [URL]" → Use WebFetch directly
- "What does this site say" → Use WebFetch directly
- "Fetch this article" → Use WebFetch directly
- "Check this URL" → Use WebFetch directly

**Simple rule:** Only activate when user signals DIFFICULTY, not for routine content requests.

**NOT for research questions** - use the research skill instead for "research X" or "find information about X"

## 🎯 Intelligent Retrieval Strategy

The Retrieve skill uses a **2-layer fallback strategy** to ensure content can always be retrieved:

```
Layer 1: Built-in Tools (Fast, Simple)
  ↓ (If blocked, rate-limited, or fails)
Layer 2: Playwright Browser Automation (JS rendering, dynamic content)
```

### Decision Tree: Which Layer to Use?

**Start with Layer 1 (Built-in) if:**
- Simple public webpage
- No known bot detection
- Standard HTML content
- Quick one-off fetch

**Use Layer 2 (Playwright) if:**
- Layer 1 blocked or failed
- JavaScript-heavy site requiring rendering
- Dynamic content that loads after initial page load
- Need to interact with the page (click, scroll, wait)
- Complex extraction requiring DOM traversal

## Layer 1: Built-in Tools

### WebFetch Tool

**Best for:** Simple HTML pages, public content, one-off fetches

**Usage:**
```typescript
// Fetch and extract specific information
WebFetch({
  url: "https://example.com/page",
  prompt: "Extract the main article content and author name"
})
```

**When it fails:**
- Returns error about blocked request
- Gets rate-limited (429 status)
- Receives CAPTCHA challenge
- Returns empty/broken content
→ **Escalate to Layer 2 (Playwright)**

### WebSearch Tool

**Best for:** Finding content when you have keywords but not URLs

**Usage:**
```typescript
// Search for content, get URLs, then fetch them
WebSearch({
  query: "latest React 19 features documentation",
  allowed_domains: ["react.dev"]
})
```

**When it fails:**
- Need more comprehensive search results
- Results pages themselves need JS rendering
→ **Escalate to Layer 2 (Playwright)**

## Layer 2: Playwright Browser Automation

### Browser Navigation + Content Extraction

**Best for:** JavaScript-heavy sites, dynamic content, pages requiring interaction

**Key Features:**
- Full JavaScript rendering in a real browser
- Can wait for dynamic content to load
- Handles SPAs and client-side rendered pages
- Can interact with the page (click, scroll, fill forms)
- Takes screenshots for visual verification

**Usage:**
```typescript
// Navigate and extract content
browser_navigate({ url: "https://dynamic-site.com/article" })
browser_snapshot()  // Get accessibility tree of rendered page

// For JavaScript-heavy pages, wait for content
browser_navigate({ url: "https://spa-app.com/data" })
browser_wait_for({ text: "Results loaded" })
browser_snapshot()

// Extract specific data via JavaScript
browser_evaluate({
  function: "() => document.querySelector('.article-content').innerText"
})
```

**When to use:**
- Layer 1 WebFetch failed with blocking
- JavaScript rendering required
- Need to interact with page before extracting
- Dynamic content that loads asynchronously

## 🔄 Complete Retrieval Workflow

### Example: Retrieve Article Content

**User request:** "Get me the content from https://example.com/article"

**Execution:**

```typescript
// 1. Try Layer 1 (Built-in) first
WebFetch({
  url: "https://example.com/article",
  prompt: "Extract the main article content, title, author, and published date"
})

// 2. If Layer 1 fails (blocked/JS-heavy):
browser_navigate({ url: "https://example.com/article" })
browser_snapshot()  // Get rendered page content
```

### Example: Search + Scrape Multiple Pages

**User request:** "Get content about React 19 from the top 5 search results"

**Execution:**

```typescript
// 1. Try Layer 1 for search:
WebSearch({
  query: "React 19 features documentation",
  allowed_domains: ["react.dev"]
})
// Extract URLs from results

// 2. Fetch each URL with Layer 1:
WebFetch({ url: url1, prompt: "Extract main content" })
WebFetch({ url: url2, prompt: "Extract main content" })
// ... (can run in parallel)

// 3. If any Layer 1 fetches fail, use Layer 2:
browser_navigate({ url: failedUrl })
browser_snapshot()
```

### Example: JavaScript-Heavy Site

**User request:** "Scrape this SPA that loads content dynamically"

**Execution:**

```typescript
// Skip Layer 1 (known to fail on SPAs)
// Start with Layer 2:
browser_navigate({ url: "https://spa-site.com/data" })
browser_wait_for({ text: "Data loaded" })
browser_evaluate({
  function: "() => JSON.stringify([...document.querySelectorAll('.item')].map(el => ({ title: el.querySelector('h2').textContent, description: el.querySelector('p').textContent })))"
})
```

## 📊 Layer Comparison Matrix

| Feature | Layer 1 (Built-in) | Layer 2 (Playwright) |
|---------|-------------------|---------------------|
| **Speed** | Fast (< 5s) | Medium (10-30s) |
| **JavaScript Rendering** | ⚠️ Limited | ✅ Full |
| **Dynamic Content** | ❌ No | ✅ Yes |
| **Page Interaction** | ❌ No | ✅ Yes (click, scroll, type) |
| **Screenshots** | ❌ No | ✅ Yes |
| **Batch Operations** | Manual | Sequential |
| **Markdown Output** | ✅ Yes | Via snapshot/evaluate |
| **Cost** | Free | Free |
| **Best For** | Simple pages | JS-heavy, dynamic sites |

## 🚨 Error Handling & Escalation

**Layer 1 Errors → Escalate to Layer 2:**
- HTTP 403 (Forbidden)
- HTTP 429 (Rate Limited)
- HTTP 503 (Service Unavailable)
- Empty content returned
- JavaScript-rendered content missing
- Dynamic content not loaded

**Layer 2 Errors → Report to User:**
- All layers exhausted
- Site requires authentication/login
- CAPTCHA that requires human solving
- Legal/ethical concerns with scraping

## 📁 Working Files → History Pattern

**Working Directory:** `~/.config/openpai/MEMORY/WORK/{current_work}/`

**Getting Current Work Directory:**
1. Read `~/.config/openpai/MEMORY/STATE/current-work.json`
2. Extract the `work_dir` value
3. Use `~/.config/openpai/MEMORY/WORK/{work_dir}/` for temporary artifacts

**Process:**

1. **Working Files (Temporary):**
   - All retrieval work artifacts go in current work item directory
   - Store raw scraped content (HTML, markdown, JSON)
   - Keep intermediate processing notes
   - Save error logs and retry attempts
   - Draft extracted data and transformations
   - **Ties retrieval artifacts to work item for learning**

2. **History (Permanent Archive):**

   - Move to `~/.config/openpai/History/research/YYYY-MM-DD_[description]/` when complete
   - Include: `README.md`, final extracted content, metadata
   - Archive for future reference and reuse

3. **Verification (MANDATORY):**
   - Check if plugins captured output to history automatically
   - If plugins failed, manually save to history
   - Confirm all files present in history directory
   - **Note:** Working artifacts remain tied to work item (don't delete)

**File Structure Example:**

**Working files (in current work item directory):**
```
~/.config/openpai/MEMORY/WORK/20260111-172408_retrieve-react19-docs/
├── raw-content/
│   ├── page1.md
│   ├── page2.md
│   └── page3.md
├── processed/
│   ├── combined-content.md
│   └── extracted-features.json
├── metadata.json (URLs, layers used, timestamps)
└── errors.log (failed attempts, escalations)
```

**History (permanent archive):**
```
~/.config/openpai/History/research/2025-10-26_react19-documentation/
├── README.md (retrieval documentation)
├── content.md (final extracted content)
├── metadata.json (sources, layers used, timestamps)
└── summary.md (key extracted information)
```

**README.md Template:**
```markdown
# Retrieval: [Site/Topic]

**Date:** YYYY-MM-DD
**Target:** [URLs or site description]
**Layers Used:** Layer 1 / Layer 2

## Retrieval Request
[Original request]

## URLs Retrieved
- URL 1
- URL 2
- URL 3

## Layers & Tools Used
- Layer 1: WebFetch (success/failed)
- Layer 2: Playwright browser automation (success/failed)

## Challenges Encountered
- JavaScript rendering: Yes/No
- Dynamic content: Yes/No
- Rate limiting: Yes/No

## Output Files
- content.md: Final extracted content
- metadata.json: Source tracking
- summary.md: Key information extracted

## Notes
[Any limitations, challenges, or follow-up needed]
```

## 🎯 Quick Reference Card

**Start with Layer 1 (Built-in):**
- Simple public webpages
- Quick one-off fetches
- Basic search queries

**Use Layer 2 (Playwright):**
- Layer 1 failed or returned empty content
- JavaScript-heavy or SPA sites
- Dynamic content that loads after page render
- Need to interact with page (scroll, click)

**Remember:**
- Always try simplest approach first (Layer 1)
- Escalate only when previous layer fails
- Document which layers were used and why
- Work artifacts go in current work item directory
- Final valuable content goes to history
- Working artifacts stay tied to work item for learning
