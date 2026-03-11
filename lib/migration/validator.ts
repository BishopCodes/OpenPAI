/**
 * PAI Installation Validator
 *
 * Verifies that a PAI installation is complete and functional.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

export interface ValidationCheck {
  name: string;
  category: 'structure' | 'config' | 'skills' | 'plugins' | 'runtime';
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  passed: boolean;
  score: number; // 0-100
  checks: ValidationCheck[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

/**
 * Run all validation checks on a PAI installation
 */
export function validateInstallation(path: string): ValidationResult {
  const checks: ValidationCheck[] = [];

  // Structure checks
  checks.push(...validateStructure(path));

  // Configuration checks
  checks.push(...validateConfig(path));

  // Skills checks
  checks.push(...validateSkills(path));

  // Plugins checks
  checks.push(...validatePlugins(path));

  // Runtime checks
  checks.push(...validateRuntime(path));

  // Calculate results
  const passed = checks.filter(c => c.passed).length;
  const failed = checks.filter(c => !c.passed && c.severity === 'error').length;
  const warnings = checks.filter(c => !c.passed && c.severity === 'warning').length;

  return {
    passed: failed === 0,
    score: Math.round((passed / checks.length) * 100),
    checks,
    summary: {
      total: checks.length,
      passed,
      failed,
      warnings,
    },
  };
}

/**
 * Validate directory structure
 */
function validateStructure(path: string): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  const requiredDirs = [
    { path: 'skills', name: 'Skills directory' },
    { path: 'MEMORY', name: 'MEMORY directory' },
    { path: 'plugins', name: 'Plugins directory' },
    { path: 'skills/PAI', name: 'PAI skill' },
    { path: 'agents', name: 'Agents directory' },
  ];

  for (const dir of requiredDirs) {
    const fullPath = join(path, dir.path);
    checks.push({
      name: dir.name,
      category: 'structure',
      passed: existsSync(fullPath),
      message: existsSync(fullPath) ? 'Present' : 'Missing',
      severity: 'error',
    });
  }

  const recommendedDirs = [
    { path: 'Plans', name: 'Plans directory' },
    { path: 'WORK', name: 'WORK directory' },
    { path: 'Commands', name: 'Commands directory' },
    { path: 'tools', name: 'Tools directory' },
  ];

  for (const dir of recommendedDirs) {
    const fullPath = join(path, dir.path);
    checks.push({
      name: dir.name,
      category: 'structure',
      passed: existsSync(fullPath),
      message: existsSync(fullPath) ? 'Present' : 'Missing (optional)',
      severity: 'warning',
    });
  }

  return checks;
}

/**
 * Validate configuration files
 */
function validateConfig(path: string): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  // opencode.json existence
  const settingsPath = join(path, 'opencode.json');
  const settingsExists = existsSync(settingsPath);

  checks.push({
    name: 'opencode.json exists',
    category: 'config',
    passed: settingsExists,
    message: settingsExists ? 'Found' : 'Missing',
    severity: 'error',
  });

  if (settingsExists) {
    try {
      const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));

      // Check required fields
      checks.push({
        name: 'opencode.json is valid JSON',
        category: 'config',
        passed: true,
        message: 'Valid',
        severity: 'error',
      });

      // Principal name
      const hasPrincipal = settings.principal?.name;
      checks.push({
        name: 'Principal name configured',
        category: 'config',
        passed: !!hasPrincipal,
        message: hasPrincipal ? `Set to "${hasPrincipal}"` : 'Not configured',
        severity: 'error',
      });

      // AI identity
      const hasIdentity = settings.daidentity?.name;
      checks.push({
        name: 'AI identity configured',
        category: 'config',
        passed: !!hasIdentity,
        message: hasIdentity ? `Set to "${hasIdentity}"` : 'Not configured',
        severity: 'error',
      });

      // Voice ID (optional)
      const hasVoice = settings.daidentity?.mainDAVoiceID;
      checks.push({
        name: 'Voice ID configured',
        category: 'config',
        passed: !!hasVoice,
        message: hasVoice ? 'Configured' : 'Not configured (voice disabled)',
        severity: 'info',
      });

      // PAI version
      const hasVersion = settings.paiVersion;
      checks.push({
        name: 'PAI version set',
        category: 'config',
        passed: !!hasVersion,
        message: hasVersion ? `v${hasVersion}` : 'Not set',
        severity: 'warning',
      });
    } catch (error) {
      checks.push({
        name: 'opencode.json is valid JSON',
        category: 'config',
        passed: false,
        message: `Parse error: ${error}`,
        severity: 'error',
      });
    }
  }

  // AGENTS.md existence
  const agentsMdPath = join(path, 'AGENTS.md');
  checks.push({
    name: 'AGENTS.md exists',
    category: 'config',
    passed: existsSync(agentsMdPath),
    message: existsSync(agentsMdPath) ? 'Found' : 'Missing',
    severity: 'warning',
  });

  return checks;
}

/**
 * Validate skills
 */
function validateSkills(path: string): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  const skillsDir = join(path, 'skills');
  if (!existsSync(skillsDir)) {
    checks.push({
      name: 'Skills directory',
      category: 'skills',
      passed: false,
      message: 'Skills directory missing',
      severity: 'error',
    });
    return checks;
  }

  // Count skills
  try {
    const skills = readdirSync(skillsDir).filter(s => {
      const skillPath = join(skillsDir, s);
      return statSync(skillPath).isDirectory();
    });

    checks.push({
      name: 'Skills count',
      category: 'skills',
      passed: skills.length > 0,
      message: `${skills.length} skills found`,
      severity: skills.length > 0 ? 'info' : 'error',
    });

    // Check PAI skill has SKILL.md
    const coreSkillMd = join(skillsDir, 'PAI', 'SKILL.md');
    checks.push({
      name: 'PAI skill has SKILL.md',
      category: 'skills',
      passed: existsSync(coreSkillMd),
      message: existsSync(coreSkillMd) ? 'Found' : 'Missing',
      severity: 'error',
    });

    // Check for USER content (recommended)
    const userContent = join(skillsDir, 'PAI', 'USER');
    checks.push({
      name: 'USER content directory',
      category: 'skills',
      passed: existsSync(userContent),
      message: existsSync(userContent) ? 'Found' : 'Not found (can be created later)',
      severity: 'info',
    });

    // Count personal skills
    const personalSkills = skills.filter(s => s.startsWith('_') && s === s.toUpperCase());
    if (personalSkills.length > 0) {
      checks.push({
        name: 'Personal skills',
        category: 'skills',
        passed: true,
        message: `${personalSkills.length} personal skills: ${personalSkills.join(', ')}`,
        severity: 'info',
      });
    }
  } catch (error) {
    checks.push({
      name: 'Skills scan',
      category: 'skills',
      passed: false,
      message: `Error scanning skills: ${error}`,
      severity: 'error',
    });
  }

  return checks;
}

/**
 * Validate plugins
 */
function validatePlugins(path: string): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  const pluginsDir = join(path, 'plugins');
  if (!existsSync(pluginsDir)) {
    checks.push({
      name: 'Plugins directory',
      category: 'plugins',
      passed: false,
      message: 'Plugins directory missing',
      severity: 'warning',
    });
    return checks;
  }

  try {
    const plugins = readdirSync(pluginsDir).filter(f => f.endsWith('.ts'));

    checks.push({
      name: 'Plugins count',
      category: 'plugins',
      passed: plugins.length > 0,
      message: `${plugins.length} plugins found`,
      severity: plugins.length > 0 ? 'info' : 'warning',
    });

    // Check for essential plugins
    const essentialPlugins = ['SessionStart.ts', 'Stop.ts'];
    for (const plugin of essentialPlugins) {
      const pluginPath = join(pluginsDir, hook);
      checks.push({
        name: `Plugin: ${plugin}`,
        category: 'plugins',
        passed: existsSync(pluginPath),
        message: existsSync(pluginPath) ? 'Found' : 'Missing',
        severity: 'warning',
      });
    }
  } catch (error) {
    checks.push({
      name: 'Plugins scan',
      category: 'plugins',
      passed: false,
      message: `Error scanning plugins: ${error}`,
      severity: 'warning',
    });
  }

  return checks;
}

/**
 * Validate runtime requirements
 */
function validateRuntime(path: string): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  // Check bun is installed
  try {
    const bunVersion = execSync('bun --version', { encoding: 'utf-8' }).trim();
    checks.push({
      name: 'Bun runtime',
      category: 'runtime',
      passed: true,
      message: `v${bunVersion}`,
      severity: 'error',
    });
  } catch (error) {
    checks.push({
      name: 'Bun runtime',
      category: 'runtime',
      passed: false,
      message: 'Bun not installed (required)',
      severity: 'error',
    });
  }

  // Check OpenCode is installed
  try {
    const openCodeVersion = execSync('opencode --version 2>/dev/null || echo "not found"', {
      encoding: 'utf-8',
    }).trim();
    const found = !openCodeVersion.includes('not found');
    checks.push({
      name: 'OpenCode CLI',
      category: 'runtime',
      passed: found,
      message: found ? openCodeVersion : 'Not installed',
      severity: 'warning',
    });
  } catch (error) {
    checks.push({
      name: 'OpenCode CLI',
      category: 'runtime',
      passed: false,
      message: 'Not detected',
      severity: 'warning',
    });
  }

  return checks;
}

/**
 * Format validation results for display
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];

  // Header
  lines.push('');
  lines.push(`Installation Validation: ${result.passed ? 'PASSED' : 'FAILED'} (${result.score}%)`);
  lines.push(`${result.summary.passed}/${result.summary.total} checks passed`);
  if (result.summary.warnings > 0) {
    lines.push(`${result.summary.warnings} warnings`);
  }
  lines.push('');

  // Group by category
  const categories = ['structure', 'config', 'skills', 'plugins', 'runtime'] as const;

  for (const category of categories) {
    const categoryChecks = result.checks.filter(c => c.category === category);
    if (categoryChecks.length === 0) continue;

    lines.push(`${category.toUpperCase()}`);
    lines.push('─'.repeat(40));

    for (const check of categoryChecks) {
      const icon = check.passed ? '✓' : (check.severity === 'error' ? '✗' : '!');
      const color = check.passed ? '' : (check.severity === 'error' ? '' : '');
      lines.push(`  ${icon} ${check.name}: ${check.message}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Quick validation (essential checks only)
 */
export function quickValidate(path: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!existsSync(path)) {
    errors.push('Installation directory does not exist');
    return { valid: false, errors };
  }

  if (!existsSync(join(path, 'opencode.json'))) {
    errors.push('opencode.json not found');
  }

  if (!existsSync(join(path, 'skills', 'PAI', 'SKILL.md'))) {
    errors.push('PAI skill not found');
  }

  if (!existsSync(join(path, 'MEMORY'))) {
    errors.push('MEMORY directory not found');
  }

  return { valid: errors.length === 0, errors };
}
