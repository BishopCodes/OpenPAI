#!/usr/bin/env bun
/**
 * ============================================================================
 * INFERENCE - Provider-agnostic inference tool with three run levels
 * ============================================================================
 *
 * PURPOSE:
 * Single inference tool with configurable speed/capability trade-offs.
 * Dynamically discovers available models from the user's configured
 * providers and classifies them into tiers:
 * - Fast: cheapest/quickest model available
 * - Standard: balanced reasoning, typical analysis
 * - Smart: best reasoning model available
 *
 * USAGE:
 *   bun Inference.ts --level fast <system_prompt> <user_prompt>
 *   bun Inference.ts --level standard <system_prompt> <user_prompt>
 *   bun Inference.ts --level smart <system_prompt> <user_prompt>
 *   bun Inference.ts --json --level fast <system_prompt> <user_prompt>
 *
 * OPTIONS:
 *   --level <fast|standard|smart>  Run level (default: standard)
 *   --json                         Expect and parse JSON response
 *   --timeout <ms>                 Custom timeout (default varies by level)
 *
 * DEFAULTS BY LEVEL:
 *   fast:     timeout=15s
 *   standard: timeout=30s
 *   smart:    timeout=90s
 *
 * MODEL DISCOVERY:
 *   On first invocation per session, runs `opencode models` to discover
 *   available models, then classifies them into fast/standard/smart tiers.
 *   Results are cached in a temp file for the session lifetime.
 *
 * BILLING: Uses OpenCode CLI with user's configured providers
 *
 * ============================================================================
 */

import { spawn, execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

export type InferenceLevel = 'fast' | 'standard' | 'smart';

export interface InferenceOptions {
  systemPrompt: string;
  userPrompt: string;
  level?: InferenceLevel;
  expectJson?: boolean;
  timeout?: number;
}

export interface InferenceResult {
  success: boolean;
  output: string;
  parsed?: unknown;
  error?: string;
  latencyMs: number;
  level: InferenceLevel;
}

interface TierMapping {
  fast: string;
  standard: string;
  smart: string;
  discoveredAt: number;
}

// Default timeouts per level (model is discovered at runtime)
const LEVEL_TIMEOUTS: Record<InferenceLevel, number> = {
  fast: 15000,
  standard: 30000,
  smart: 90000,
};

// Cache directory for model tier mapping
const CACHE_DIR = join(tmpdir(), 'openpai-inference');
const CACHE_FILE = join(CACHE_DIR, 'model-tiers.json');
// Cache is valid for 1 hour
const CACHE_TTL_MS = 3600000;

/**
 * Discover available models by running `opencode models`
 */
function discoverModels(): string[] {
  try {
    // Unset OPENCODE to avoid nested-session guard
    const env = { ...process.env };
    delete env.OPENCODE;

    const output = execSync('opencode models', {
      env,
      encoding: 'utf-8',
      timeout: 10000,
    });
    return output
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.includes('/'));
  } catch (err) {
    console.error('[Inference] Failed to discover models:', (err as Error).message);
    return [];
  }
}

/**
 * Use the user's default model to classify available models into tiers.
 * Falls back to heuristic classification if LLM classification fails.
 */
async function classifyModelsWithLLM(models: string[]): Promise<TierMapping> {
  const systemPrompt = `You are a model classification assistant. Given a list of available AI models (in provider/model-id format), classify them into exactly three tiers:

- fast: The cheapest, quickest model. Good for simple tasks, classification, quick generation.
- standard: A balanced model with good reasoning. The everyday workhorse.
- smart: The most capable reasoning model available. For complex analysis and deep thinking.

Rules:
1. Each tier gets exactly ONE model (the best choice for that tier from the available list).
2. Return ONLY a JSON object with keys "fast", "standard", "smart" — values are the full provider/model-id strings.
3. If only one or two models are available, assign the same model to multiple tiers as needed.
4. Prefer the latest/best version of each model family.
5. No explanation, no markdown, just the JSON object.`;

  const userPrompt = `Available models:\n${models.join('\n')}`;

  // Use opencode --print with no explicit model (uses user's default)
  return new Promise((resolve) => {
    const env = { ...process.env };
    delete env.OPENCODE;

    const args = [
      '--print',
      '--tools', '',
      '--output-format', 'text',
      '--setting-sources', '',
      '--system-prompt', systemPrompt,
    ];

    let stdout = '';
    const proc = spawn('opencode', args, {
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    proc.stdin.write(userPrompt);
    proc.stdin.end();

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    const timeoutId = setTimeout(() => {
      proc.kill('SIGTERM');
      resolve(classifyModelsHeuristic(models));
    }, 30000);

    proc.on('close', (code: number | null) => {
      clearTimeout(timeoutId);

      if (code !== 0) {
        resolve(classifyModelsHeuristic(models));
        return;
      }

      try {
        const text = stdout.trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          resolve(classifyModelsHeuristic(models));
          return;
        }
        const parsed = JSON.parse(jsonMatch[0]) as Record<string, string>;
        if (parsed.fast && parsed.standard && parsed.smart) {
          resolve({
            fast: parsed.fast,
            standard: parsed.standard,
            smart: parsed.smart,
            discoveredAt: Date.now(),
          });
        } else {
          resolve(classifyModelsHeuristic(models));
        }
      } catch {
        resolve(classifyModelsHeuristic(models));
      }
    });

    proc.on('error', () => {
      clearTimeout(timeoutId);
      resolve(classifyModelsHeuristic(models));
    });
  });
}

/**
 * Heuristic fallback: classify models based on known naming patterns.
 * This handles cases where the LLM classification fails or times out.
 */
function classifyModelsHeuristic(models: string[]): TierMapping {
  const modelIds = models.map(m => m.toLowerCase());

  // Known tier patterns (ordered by preference — first match wins)
  const smartPatterns = ['opus', 'o3', 'gpt-5', 'gemini-3-pro', 'gemini-2.5-pro', 'deepseek-r1'];
  const standardPatterns = ['sonnet', 'gpt-4.1', 'gpt-4o', 'gpt-4', 'gemini-3-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'mistral-large', 'deepseek-v3'];
  const fastPatterns = ['haiku', 'gpt-4.1-mini', 'gpt-4o-mini', 'o4-mini', 'gemini-flash', 'mistral-small', 'deepseek-chat'];

  function findBest(patterns: string[]): string | undefined {
    for (const pattern of patterns) {
      const match = models.find((_, i) => modelIds[i].includes(pattern));
      if (match) return match;
    }
    return undefined;
  }

  const smart = findBest(smartPatterns) || models[0] || 'default';
  const standard = findBest(standardPatterns) || smart;
  const fast = findBest(fastPatterns) || standard;

  return { fast, standard, smart, discoveredAt: Date.now() };
}

/**
 * Get the model tier mapping, using cache when available.
 */
async function getModelTiers(): Promise<TierMapping> {
  // Check cache first
  if (existsSync(CACHE_FILE)) {
    try {
      const cached = JSON.parse(readFileSync(CACHE_FILE, 'utf-8')) as TierMapping;
      if (Date.now() - cached.discoveredAt < CACHE_TTL_MS) {
        return cached;
      }
    } catch { /* cache invalid, rediscover */ }
  }

  // Discover available models
  const models = discoverModels();
  if (models.length === 0) {
    // No models found — return a default that lets opencode pick
    return { fast: 'default', standard: 'default', smart: 'default', discoveredAt: Date.now() };
  }

  // Classify models into tiers
  const tiers = await classifyModelsWithLLM(models);

  // Cache results
  try {
    if (!existsSync(CACHE_DIR)) {
      mkdirSync(CACHE_DIR, { recursive: true });
    }
    writeFileSync(CACHE_FILE, JSON.stringify(tiers, null, 2));
  } catch { /* caching failure is non-fatal */ }

  return tiers;
}

/**
 * Run inference with configurable level
 */
export async function inference(options: InferenceOptions): Promise<InferenceResult> {
  const level = options.level || 'standard';
  const startTime = Date.now();
  const defaultTimeout = LEVEL_TIMEOUTS[level];
  const timeout = options.timeout || defaultTimeout;

  // Get the model for this level
  const tiers = await getModelTiers();
  const model = tiers[level];

  return new Promise((resolve) => {
    // Build environment — unset OPENCODE to prevent nested-session guard
    // (plugins run inside OpenCode's environment)
    const env = { ...process.env };
    delete env.OPENCODE;

    const args = [
      '--print',
      '--model', model,
      '--tools', '',  // Disable tools for faster response
      '--output-format', 'text',
      '--setting-sources', '',  // Disable plugins to prevent recursion
      '--system-prompt', options.systemPrompt,
    ];

    let stdout = '';
    let stderr = '';

    const proc = spawn('opencode', args, {
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Write prompt via stdin to avoid ARG_MAX limits on large inputs
    proc.stdin.write(options.userPrompt);
    proc.stdin.end();

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    // Handle timeout
    const timeoutId = setTimeout(() => {
      proc.kill('SIGTERM');
      resolve({
        success: false,
        output: '',
        error: `Timeout after ${timeout}ms`,
        latencyMs: Date.now() - startTime,
        level,
      });
    }, timeout);

    proc.on('close', (code: number | null) => {
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      if (code !== 0) {
        resolve({
          success: false,
          output: stdout,
          error: stderr || `Process exited with code ${code}`,
          latencyMs,
          level,
        });
        return;
      }

      const output = stdout.trim();

      // Parse JSON if requested
      if (options.expectJson) {
        // Try both object and array matches — use whichever parses successfully.
        // The greedy object regex /\{[\s\S]*\}/ can capture invalid substrings
        // when the LLM wraps a JSON array inside markdown or explanatory text
        // that happens to contain braces. By trying both candidates and
        // validating with JSON.parse, we handle arrays and objects reliably.
        const objectMatch = output.match(/\{[\s\S]*\}/);
        const arrayMatch = output.match(/\[[\s\S]*\]/);

        for (const candidate of [objectMatch?.[0], arrayMatch?.[0]]) {
          if (!candidate) continue;
          try {
            const parsed = JSON.parse(candidate);
            resolve({
              success: true,
              output,
              parsed,
              latencyMs,
              level,
            });
            return;
          } catch { /* try next candidate */ }
        }
        resolve({
          success: false,
          output,
          error: 'Failed to parse JSON response',
          latencyMs,
          level,
        });
        return;
      }

      resolve({
        success: true,
        output,
        latencyMs,
        level,
      });
    });

    proc.on('error', (err: Error) => {
      clearTimeout(timeoutId);
      resolve({
        success: false,
        output: '',
        error: err.message,
        latencyMs: Date.now() - startTime,
        level,
      });
    });
  });
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);

  // Parse flags
  let expectJson = false;
  let timeout: number | undefined;
  let level: InferenceLevel = 'standard';
  const positionalArgs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--json') {
      expectJson = true;
    } else if (args[i] === '--level' && args[i + 1]) {
      const requestedLevel = args[i + 1].toLowerCase();
      if (['fast', 'standard', 'smart'].includes(requestedLevel)) {
        level = requestedLevel as InferenceLevel;
      } else {
        console.error(`Invalid level: ${args[i + 1]}. Use fast, standard, or smart.`);
        process.exit(1);
      }
      i++;
    } else if (args[i] === '--timeout' && args[i + 1]) {
      timeout = parseInt(args[i + 1], 10);
      i++;
    } else {
      positionalArgs.push(args[i]);
    }
  }

  if (positionalArgs.length < 2) {
    console.error('Usage: bun Inference.ts [--level fast|standard|smart] [--json] [--timeout <ms>] <system_prompt> <user_prompt>');
    process.exit(1);
  }

  const [systemPrompt, userPrompt] = positionalArgs;

  const result = await inference({
    systemPrompt,
    userPrompt,
    level,
    expectJson,
    timeout,
  });

  if (result.success) {
    if (expectJson && result.parsed) {
      console.log(JSON.stringify(result.parsed));
    } else {
      console.log(result.output);
    }
  } else {
    console.error(`Error: ${result.error}`);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.main) {
  main().catch(console.error);
}
