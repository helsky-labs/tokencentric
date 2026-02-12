/**
 * Shared config reader for Claude Code configuration files.
 * Pure Node.js - no Electron dependencies.
 * Used by both the main process (ipc.ts) and the CLI (cli/index.ts).
 */
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { ConfigItem, StarterPack } from './types';

// ============================================================
// Path helpers
// ============================================================

export function getClaudeDir(): string {
  return path.join(os.homedir(), '.claude');
}

export function getClaudeJsonPath(): string {
  return path.join(os.homedir(), '.claude.json');
}

// ============================================================
// YAML frontmatter parser (no yaml lib dependency)
// ============================================================

export function parseFrontmatter(content: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return result;

  const lines = match[1].split('\n');
  let currentKey = '';
  let currentArray: string[] | null = null;

  for (const line of lines) {
    // Array item
    if (line.match(/^\s+-\s+/) && currentKey) {
      const value = line.replace(/^\s+-\s+/, '').trim();
      if (!currentArray) {
        currentArray = [];
        result[currentKey] = currentArray;
      }
      currentArray.push(value);
      continue;
    }

    // Key: value pair
    const kvMatch = line.match(/^(\w+):\s*(.*)/);
    if (kvMatch) {
      currentArray = null;
      currentKey = kvMatch[1];
      const value = kvMatch[2].trim();
      if (value) {
        result[currentKey] = value.replace(/^["']|["']$/g, '');
      }
    }
  }

  return result;
}

// ============================================================
// Claude Commands
// ============================================================

export async function readClaudeCommands(
  countTokensFn?: (content: string) => number
): Promise<ConfigItem[]> {
  const commandsDir = path.join(getClaudeDir(), 'commands');
  const items: ConfigItem[] = [];

  try {
    await fs.access(commandsDir);
  } catch {
    return items;
  }

  try {
    const entries = await fs.readdir(commandsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;

      const fullPath = path.join(commandsDir, entry.name);
      const content = await fs.readFile(fullPath, 'utf-8');
      const stats = await fs.stat(fullPath);
      const tokens = countTokensFn ? countTokensFn(content) : Math.ceil(content.length / 4);
      const baseName = entry.name.replace(/\.md$/, '');

      // Extract phases from ## Phase N: Title
      const phases: string[] = [];
      const phaseRegex = /^##\s+Phase\s+\d+:\s*(.*)$/gm;
      let match;
      while ((match = phaseRegex.exec(content)) !== null) {
        phases.push(match[1].trim());
      }

      items.push({
        id: fullPath,
        name: baseName,
        path: fullPath,
        toolId: 'claude',
        category: 'command',
        content,
        tokens,
        lastModified: stats.mtimeMs,
        size: stats.size,
        metadata: {
          slashCommand: `/${baseName}`,
          phases,
          phaseCount: phases.length,
        },
      });
    }
  } catch (error) {
    console.error('Failed to read Claude commands:', error);
  }

  return items.sort((a, b) => a.name.localeCompare(b.name));
}

// ============================================================
// Claude Agents
// ============================================================

export async function readClaudeAgents(
  countTokensFn?: (content: string) => number
): Promise<ConfigItem[]> {
  const agentsDir = path.join(getClaudeDir(), 'agents');
  const items: ConfigItem[] = [];

  try {
    await fs.access(agentsDir);
  } catch {
    return items;
  }

  async function scanAgentDir(dir: string, department?: string) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await scanAgentDir(fullPath, entry.name);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const content = await fs.readFile(fullPath, 'utf-8');
          const stats = await fs.stat(fullPath);
          const tokens = countTokensFn ? countTokensFn(content) : Math.ceil(content.length / 4);
          const baseName = entry.name.replace(/\.md$/, '');

          const frontmatter = parseFrontmatter(content);

          items.push({
            id: fullPath,
            name: (frontmatter.name as string) || baseName,
            path: fullPath,
            toolId: 'claude',
            category: 'agent',
            content,
            tokens,
            lastModified: stats.mtimeMs,
            size: stats.size,
            metadata: {
              department: department || 'uncategorized',
              description: frontmatter.description || '',
              color: frontmatter.color || '',
              tools: frontmatter.tools || [],
              filename: baseName,
            },
          });
        }
      }
    } catch (error) {
      console.error(`Failed to read agent directory: ${dir}`, error);
    }
  }

  await scanAgentDir(agentsDir);
  return items.sort((a, b) => a.name.localeCompare(b.name));
}

// ============================================================
// Claude Settings & Permissions
// ============================================================

export async function readClaudeSettings(): Promise<Record<string, unknown>> {
  const settingsPath = path.join(getClaudeDir(), 'settings.json');
  try {
    const content = await fs.readFile(settingsPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export async function readClaudePermissions(): Promise<Record<string, unknown>> {
  const permPath = path.join(getClaudeDir(), 'settings.local.json');
  try {
    const content = await fs.readFile(permPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

// ============================================================
// MCP Servers
// ============================================================

export async function readMcpServers(): Promise<Record<string, Record<string, unknown>>> {
  try {
    const content = await fs.readFile(getClaudeJsonPath(), 'utf-8');
    const data = JSON.parse(content);
    const projects = data.projects || {};
    const result: Record<string, Record<string, unknown>> = {};
    for (const [projectPath, projectData] of Object.entries(projects)) {
      const pd = projectData as Record<string, unknown>;
      if (pd.mcpServers && typeof pd.mcpServers === 'object' && Object.keys(pd.mcpServers as object).length > 0) {
        result[projectPath] = pd.mcpServers as Record<string, unknown>;
      }
    }
    return result;
  } catch {
    return {};
  }
}

// ============================================================
// Agent Departments
// ============================================================

export async function readDepartments(): Promise<string[]> {
  const agentsDir = path.join(getClaudeDir(), 'agents');
  try {
    const entries = await fs.readdir(agentsDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

// ============================================================
// Export helper
// ============================================================

export async function exportCurrentConfig(options: {
  name: string;
  description: string;
  includeCommands: boolean;
  includeAgents: boolean;
  includeSettings: boolean;
}): Promise<StarterPack> {
  const claudeDir = getClaudeDir();
  const pack: StarterPack = {
    tcpack: '1.0',
    name: options.name,
    description: options.description,
    author: 'Exported from TokenCentric',
    version: '1.0.0',
    tools: {
      claude: {
        configFiles: [],
      },
    },
  };

  const configFiles = pack.tools.claude.configFiles!;

  if (options.includeCommands) {
    const commandsDir = path.join(claudeDir, 'commands');
    try {
      const entries = await fs.readdir(commandsDir);
      for (const entry of entries) {
        if (!entry.endsWith('.md')) continue;
        const content = await fs.readFile(path.join(commandsDir, entry), 'utf-8');
        configFiles.push({ filename: `commands/${entry}`, content });
      }
    } catch {
      // No commands directory
    }
  }

  if (options.includeAgents) {
    async function scanAgents(dir: string, prefix: string) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await scanAgents(fullPath, `${prefix}${entry.name}/`);
          } else if (entry.name.endsWith('.md')) {
            const content = await fs.readFile(fullPath, 'utf-8');
            configFiles.push({ filename: `agents/${prefix}${entry.name}`, content });
          }
        }
      } catch {
        // Skip unreadable
      }
    }
    await scanAgents(path.join(claudeDir, 'agents'), '');
  }

  if (options.includeSettings) {
    try {
      const settingsContent = await fs.readFile(path.join(claudeDir, 'settings.json'), 'utf-8');
      pack.tools.claude.settings = JSON.parse(settingsContent);
    } catch {
      // No settings file
    }
  }

  return pack;
}
