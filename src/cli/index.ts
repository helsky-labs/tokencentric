#!/usr/bin/env node

/**
 * TokenCentric CLI - Manage AI coding assistant configurations
 *
 * Usage:
 *   npx tokencentric scan [--tool claude|all]
 *   npx tokencentric info [--tool claude|all]
 *   npx tokencentric install <pack.tcpack> [--dry-run]
 *   npx tokencentric export [-o output.tcpack]
 *   npx tokencentric validate [--tool claude|all]
 */

import fs from 'fs/promises';
import path from 'path';
import {
  readClaudeCommands,
  readClaudeAgents,
  readClaudeSettings,
  readClaudePermissions,
  readMcpServers,
  readDepartments,
  getClaudeDir,
  exportCurrentConfig,
} from '../shared/configReader';
import { StarterPack } from '../shared/types';

// ============================================================
// Helpers
// ============================================================

function printUsage() {
  console.log(`
TokenCentric CLI v1.0.0

Usage:
  tokencentric scan [--tool claude|all]       Scan and list all config files
  tokencentric info [--tool claude|all]       Show detailed config information
  tokencentric install <file.tcpack> [--dry-run]  Install a starter pack
  tokencentric export [-o file.tcpack]        Export current config as a pack
  tokencentric validate [--tool claude|all]   Validate config files

Options:
  --tool <tool>   Filter by tool (default: all)
  --dry-run       Preview without making changes
  -o <file>       Output file path
  --help          Show this help message
`);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function shortenPath(p: string): string {
  const home = process.env.HOME || '';
  if (home && p.startsWith(home)) {
    return '~' + p.slice(home.length);
  }
  return p;
}

// ============================================================
// Commands
// ============================================================

async function cmdScan() {
  const claudeDir = getClaudeDir();

  console.log('\nClaude Code Configuration Files');
  console.log('='.repeat(50));

  // Commands
  const commands = await readClaudeCommands();
  console.log(`\nCommands (${commands.length}):`);
  if (commands.length === 0) {
    console.log('  (none)');
  } else {
    for (const cmd of commands) {
      console.log(`  ${cmd.metadata.slashCommand as string}  ${formatSize(cmd.size)}  ~${Math.ceil(cmd.size / 4)} tok`);
    }
  }

  // Agents
  const agents = await readClaudeAgents();
  const departments = await readDepartments();
  console.log(`\nAgents (${agents.length}):`);
  if (agents.length === 0) {
    console.log('  (none)');
  } else {
    for (const dept of departments) {
      const deptAgents = agents.filter((a) => a.metadata.department === dept);
      if (deptAgents.length === 0) continue;
      console.log(`  ${dept}/`);
      for (const agent of deptAgents) {
        console.log(`    ${agent.name}  ${formatSize(agent.size)}  ~${Math.ceil(agent.size / 4)} tok`);
      }
    }
  }

  // Settings files
  console.log('\nConfig Files:');
  const configFiles = [
    { name: 'settings.json', path: path.join(claudeDir, 'settings.json') },
    { name: 'settings.local.json', path: path.join(claudeDir, 'settings.local.json') },
    { name: 'keybindings.json', path: path.join(claudeDir, 'keybindings.json') },
    { name: 'CLAUDE.md', path: path.join(claudeDir, 'CLAUDE.md') },
  ];

  for (const f of configFiles) {
    try {
      const stats = await fs.stat(f.path);
      console.log(`  ${f.name}  ${formatSize(stats.size)}`);
    } catch {
      console.log(`  ${f.name}  (not found)`);
    }
  }

  // MCP Servers
  const mcpServers = await readMcpServers();
  const projectCount = Object.keys(mcpServers).length;
  const serverCount = Object.values(mcpServers).reduce((s, p) => s + Object.keys(p).length, 0);
  console.log(`\nMCP Servers: ${serverCount} across ${projectCount} project(s)`);
}

async function cmdInfo() {
  console.log('\nClaude Code Configuration Info');
  console.log('='.repeat(50));

  // Settings
  const settings = await readClaudeSettings();
  console.log('\nSettings (settings.json):');
  const plugins = settings.enabledPlugins as Record<string, boolean> | undefined;
  if (plugins) {
    const enabled = Object.entries(plugins).filter(([, v]) => v);
    console.log(`  Plugins: ${enabled.length > 0 ? enabled.map(([k]) => k.split('@')[0]).join(', ') : 'none'}`);
  }
  const hooks = settings.hooks as Record<string, unknown[]> | undefined;
  if (hooks) {
    console.log(`  Hooks: ${Object.keys(hooks).join(', ') || 'none'}`);
  }

  // Permissions
  const perms = await readClaudePermissions();
  const permData = perms.permissions as { allow?: string[]; deny?: string[]; ask?: string[] } | undefined;
  if (permData) {
    console.log('\nPermissions (settings.local.json):');
    console.log(`  Allow: ${permData.allow?.length || 0} rules`);
    console.log(`  Deny: ${permData.deny?.length || 0} rules`);
    console.log(`  Ask: ${permData.ask?.length || 0} rules`);
  }

  // MCP Servers
  const mcpServers = await readMcpServers();
  if (Object.keys(mcpServers).length > 0) {
    console.log('\nMCP Servers:');
    for (const [projectPath, servers] of Object.entries(mcpServers)) {
      console.log(`  ${shortenPath(projectPath)}`);
      for (const [name, config] of Object.entries(servers)) {
        const cfg = config as Record<string, unknown>;
        console.log(`    ${name}: ${cfg.command || cfg.url || '(unknown)'}`);
      }
    }
  }
}

async function cmdInstall(packPath: string, dryRun: boolean) {
  console.log(`\nInstalling pack: ${packPath}`);
  if (dryRun) console.log('(dry run - no files will be written)');
  console.log('='.repeat(50));

  const content = await fs.readFile(packPath, 'utf-8');
  const pack = JSON.parse(content) as StarterPack;

  if (!pack.tcpack || !pack.name || !pack.tools) {
    console.error('Error: Invalid .tcpack file format');
    process.exit(1);
  }

  console.log(`Pack: ${pack.name} v${pack.version}`);
  console.log(`Author: ${pack.author}`);
  console.log(`Description: ${pack.description}`);

  const claudeDir = getClaudeDir();

  for (const [toolId, toolData] of Object.entries(pack.tools)) {
    console.log(`\nTool: ${toolId}`);

    for (const file of toolData.configFiles || []) {
      const targetPath = path.join(claudeDir, file.filename);
      let exists = false;
      try {
        await fs.access(targetPath);
        exists = true;
      } catch {
        // doesn't exist
      }

      const status = exists ? 'SKIP (exists)' : 'INSTALL';
      console.log(`  ${status}  ${file.filename}`);

      if (!dryRun && !exists) {
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        await fs.writeFile(targetPath, file.content, 'utf-8');
      }
    }

    if (toolData.settings) {
      console.log(`  MERGE   settings.json`);
      if (!dryRun) {
        const settingsPath = path.join(claudeDir, 'settings.json');
        let current: Record<string, unknown> = {};
        try {
          const raw = await fs.readFile(settingsPath, 'utf-8');
          current = JSON.parse(raw);
        } catch {
          // No existing settings
        }
        const merged = { ...current, ...toolData.settings };
        await fs.writeFile(settingsPath, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
      }
    }
  }

  console.log(dryRun ? '\nDry run complete. No files were modified.' : '\nInstallation complete.');
}

async function cmdExport(outputPath: string | null) {
  const defaultName = 'my-claude-setup';
  const defaultOutput = outputPath || `${defaultName}.tcpack`;

  console.log('\nExporting current Claude Code configuration...');
  console.log('='.repeat(50));

  const pack = await exportCurrentConfig({
    name: defaultName,
    description: 'Exported Claude Code configuration',
    includeCommands: true,
    includeAgents: true,
    includeSettings: true,
  });

  const fileCount = pack.tools.claude?.configFiles?.length || 0;
  const hasSettings = !!pack.tools.claude?.settings;

  console.log(`Files: ${fileCount}`);
  console.log(`Settings: ${hasSettings ? 'included' : 'none'}`);

  await fs.writeFile(defaultOutput, JSON.stringify(pack, null, 2), 'utf-8');
  console.log(`\nExported to: ${defaultOutput}`);
}

async function cmdValidate() {
  console.log('\nValidating Claude Code configuration...');
  console.log('='.repeat(50));

  let issues = 0;

  // Check commands
  const commands = await readClaudeCommands();
  for (const cmd of commands) {
    if (cmd.content.trim().length === 0) {
      console.log(`  WARNING: Empty command: ${cmd.name}`);
      issues++;
    }
    if (cmd.size > 50000) {
      console.log(`  WARNING: Large command (${formatSize(cmd.size)}): ${cmd.name}`);
      issues++;
    }
  }

  // Check agents
  const agents = await readClaudeAgents();
  for (const agent of agents) {
    if (agent.content.trim().length === 0) {
      console.log(`  WARNING: Empty agent: ${agent.name}`);
      issues++;
    }
    if (!agent.content.startsWith('---')) {
      console.log(`  WARNING: Agent missing frontmatter: ${agent.name}`);
      issues++;
    }
    if (agent.size > 50000) {
      console.log(`  WARNING: Large agent (${formatSize(agent.size)}): ${agent.name}`);
      issues++;
    }
  }

  // Check settings JSON validity
  const claudeDir = getClaudeDir();
  const jsonFiles = ['settings.json', 'settings.local.json'];
  for (const name of jsonFiles) {
    try {
      const content = await fs.readFile(path.join(claudeDir, name), 'utf-8');
      JSON.parse(content);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue;
      console.log(`  ERROR: Invalid JSON in ${name}: ${(error as Error).message}`);
      issues++;
    }
  }

  if (issues === 0) {
    console.log('\n  All checks passed.');
  } else {
    console.log(`\n  ${issues} issue(s) found.`);
  }
}

// ============================================================
// Main
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    printUsage();
    return;
  }

  switch (command) {
    case 'scan':
      await cmdScan();
      break;
    case 'info':
      await cmdInfo();
      break;
    case 'install': {
      const packPath = args[1];
      if (!packPath) {
        console.error('Error: Please provide a .tcpack file path');
        process.exit(1);
      }
      const dryRun = args.includes('--dry-run');
      await cmdInstall(packPath, dryRun);
      break;
    }
    case 'export': {
      const oIdx = args.indexOf('-o');
      const outputPath = oIdx >= 0 ? args[oIdx + 1] : null;
      await cmdExport(outputPath);
      break;
    }
    case 'validate':
      await cmdValidate();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
