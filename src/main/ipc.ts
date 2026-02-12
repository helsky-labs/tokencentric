import { ipcMain, dialog, shell, app, BrowserWindow } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import Store from 'electron-store';
import { AppSettings, ContextFile, ToolProfile, TokenizerType, GlobalConfigFile, GlobalConfigFileType, defaultAISettings, AIProvider, AIProviderConfig, AIAction, AIStreamChunk, EditorStatePersisted, ToolModule, ConfigArea, ConfigItem, StarterPack } from '../shared/types';
import { builtinPacks, StarterPackMeta } from '../shared/builtinPacks';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { defaultToolProfiles, defaultExclusions } from '../shared/defaultProfiles';
import { trackEvent } from './analytics';
import { checkForUpdates, downloadUpdate, installUpdate } from './updater';
import { AIService } from './services/ai';

// AI service instance
let aiService: AIService | null = null;

function getAIService(): AIService {
  const settings = store.get('settings');
  if (!aiService) {
    aiService = new AIService(settings.ai || defaultAISettings);
  } else {
    aiService.updateSettings(settings.ai || defaultAISettings);
  }
  return aiService;
}

// Tokenizer imports
import { countTokens as countAnthropicTokens } from '@anthropic-ai/tokenizer';
import { encoding_for_model } from 'tiktoken';

// Initialize tiktoken encoder (lazily loaded)
let tiktokenEncoder: ReturnType<typeof encoding_for_model> | null = null;

function getTiktokenEncoder() {
  if (!tiktokenEncoder) {
    tiktokenEncoder = encoding_for_model('gpt-4');
  }
  return tiktokenEncoder;
}

// Initialize store with defaults
const store = new Store<{ settings: AppSettings; files: ContextFile[]; hasCompletedOnboarding: boolean }>({
  defaults: {
    settings: {
      scanPaths: [],
      exclusions: defaultExclusions,
      theme: 'system',
      editorFontSize: 14,
      analyticsEnabled: true,
      toolProfiles: defaultToolProfiles,
      ai: defaultAISettings,
    },
    files: [],
    hasCompletedOnboarding: false,
  },
});

/**
 * Count tokens using the specified tokenizer
 * Falls back to estimate (4 chars per token) if tokenizer fails
 */
function countTokensForContent(content: string, tokenizer: TokenizerType): number {
  try {
    if (tokenizer === 'anthropic') {
      return countAnthropicTokens(content);
    } else if (tokenizer === 'openai') {
      const encoder = getTiktokenEncoder();
      const tokens = encoder.encode(content);
      return tokens.length;
    }
  } catch (error) {
    console.error(`Tokenizer error (${tokenizer}):`, error);
  }

  // Fallback: rough estimate of ~4 chars per token
  return Math.ceil(content.length / 4);
}

export function setupIpcHandlers() {
  // Get onboarding status
  ipcMain.handle('get-onboarding-status', () => {
    return store.get('hasCompletedOnboarding');
  });

  // Set onboarding complete
  ipcMain.handle('set-onboarding-complete', () => {
    store.set('hasCompletedOnboarding', true);
  });

  // Get settings
  ipcMain.handle('get-settings', () => {
    return store.get('settings');
  });

  // Update settings
  ipcMain.handle('set-settings', (_event, settings: Partial<AppSettings>) => {
    const current = store.get('settings');
    store.set('settings', { ...current, ...settings });
  });

  // Get editor state
  ipcMain.handle('get-editor-state', (): EditorStatePersisted | null => {
    const settings = store.get('settings');
    return settings.editorState || null;
  });

  // Save editor state
  ipcMain.handle('set-editor-state', (_event, editorState: EditorStatePersisted) => {
    const current = store.get('settings');
    store.set('settings', { ...current, editorState });
  });

  // Get cached files (validates they still exist on disk)
  ipcMain.handle('get-files', async () => {
    const files = store.get('files');
    const validFiles: ContextFile[] = [];

    for (const file of files) {
      try {
        await fs.access(file.path);
        validFiles.push(file);
      } catch {
        // File no longer exists on disk, skip it
      }
    }

    // Update cache if stale entries were removed
    if (validFiles.length !== files.length) {
      store.set('files', validFiles);
    }

    return validFiles;
  });

  // Re-scan all previously scanned directories (for startup refresh)
  ipcMain.handle('rescan-cached-paths', async () => {
    const settings = store.get('settings');
    const cachedFiles = store.get('files');

    if (cachedFiles.length === 0) return [];

    // Derive unique root scan directories from cached file paths
    // Group files by their top-level scanned directory
    const scanRoots = new Set<string>();
    for (const file of cachedFiles) {
      // Walk up from the file path to find a reasonable root
      // Use the deepest common ancestor that contains context files
      const parts = file.path.split('/');
      // Heuristic: scan root is likely 2-4 levels above the file
      // For /Users/x/code/project/CLAUDE.md -> /Users/x/code/project
      // For /Users/x/code/project/subdir/CLAUDE.md -> /Users/x/code/project
      const dirPath = parts.slice(0, -1).join('/');
      scanRoots.add(dirPath);
    }

    // Deduplicate: remove child paths if a parent is already in the set
    const roots = Array.from(scanRoots).sort((a, b) => a.length - b.length);
    const dedupedRoots: string[] = [];
    for (const root of roots) {
      const isChild = dedupedRoots.some(parent => root.startsWith(parent + '/'));
      if (!isChild) {
        dedupedRoots.push(root);
      }
    }

    // Re-scan all roots
    const allFiles: ContextFile[] = [];
    const toolProfileMap = new Map<string, ToolProfile>();
    for (const profile of settings.toolProfiles) {
      toolProfileMap.set(profile.id, profile);
    }

    async function scanDir(dir: string) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (settings.exclusions.some((ex) => entry.name === ex || fullPath.includes(`/${ex}/`))) {
            continue;
          }

          if (entry.isDirectory()) {
            await scanDir(fullPath);
          } else if (entry.isFile()) {
            for (const profile of settings.toolProfiles) {
              if (!profile.enabled) continue;

              const matches = profile.patterns.some((pattern) => {
                if (pattern.includes('/')) {
                  return fullPath.endsWith(pattern);
                }
                return entry.name.toLowerCase() === pattern.toLowerCase();
              });

              if (matches) {
                const stats = await fs.stat(fullPath);
                allFiles.push({
                  id: fullPath,
                  path: fullPath,
                  name: entry.name,
                  toolId: profile.id,
                  lastModified: stats.mtimeMs,
                  size: stats.size,
                });
                break;
              }
            }
          }
        }
      } catch {
        // Skip directories we can't read
      }
    }

    for (const root of dedupedRoots) {
      try {
        await fs.access(root);
        await scanDir(root);
      } catch {
        // Skip roots that no longer exist
      }
    }

    // Count tokens for all files
    for (const file of allFiles) {
      try {
        const content = await fs.readFile(file.path, 'utf-8');
        const profile = toolProfileMap.get(file.toolId);
        const tokenizer = profile?.tokenizer || 'openai';
        file.tokens = countTokensForContent(content, tokenizer);
      } catch {
        file.tokens = Math.ceil(file.size / 4);
      }
    }

    store.set('files', allFiles);
    return allFiles;
  });

  // Read file
  ipcMain.handle('read-file', async (_event, filePath: string) => {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file: ${filePath}`);
    }
  });

  // Write file
  ipcMain.handle('write-file', async (_event, filePath: string, content: string) => {
    try {
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write file: ${filePath}`);
    }
  });

  // Show in folder
  ipcMain.handle('show-in-folder', async (_event, filePath: string) => {
    shell.showItemInFolder(filePath);
  });

  // Delete file
  ipcMain.handle('delete-file', async (_event, filePath: string) => {
    await fs.unlink(filePath);
    // Remove from store cache
    const files = store.get('files');
    store.set('files', files.filter((f) => f.path !== filePath));
  });

  // Create file
  ipcMain.handle(
    'create-file',
    async (_event, dirPath: string, fileName: string, toolId: string, content?: string): Promise<ContextFile> => {
      const fullPath = path.join(dirPath, fileName);

      // Handle nested paths (e.g., .github/copilot-instructions.md)
      const fileDir = path.dirname(fullPath);
      await fs.mkdir(fileDir, { recursive: true });

      // Check if file exists
      try {
        await fs.access(fullPath);
        throw new Error('File already exists');
      } catch (e: unknown) {
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
      }

      // Create with provided content or minimal template
      const settings = store.get('settings');
      const profile = settings.toolProfiles.find((p) => p.id === toolId);
      const tokenizer = profile?.tokenizer || 'openai';

      const initialContent = content || `# ${fileName}\n\n`;
      await fs.writeFile(fullPath, initialContent, 'utf-8');

      const stats = await fs.stat(fullPath);
      const tokens = countTokensForContent(initialContent, tokenizer);

      const newFile: ContextFile = {
        id: fullPath,
        path: fullPath,
        name: fileName,
        toolId,
        lastModified: stats.mtimeMs,
        size: stats.size,
        tokens,
      };

      // Add to cache
      const files = store.get('files');
      store.set('files', [...files, newFile]);

      return newFile;
    }
  );

  // Duplicate file
  ipcMain.handle('duplicate-file', async (_event, filePath: string): Promise<ContextFile> => {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const base = path.basename(filePath, ext);

    // Find unique name: file-copy.md, file-copy-2.md, etc.
    let copyPath = path.join(dir, `${base}-copy${ext}`);
    let counter = 2;

    const fileExists = async (p: string): Promise<boolean> => {
      try {
        await fs.access(p);
        return true;
      } catch {
        return false;
      }
    };

    while (await fileExists(copyPath)) {
      copyPath = path.join(dir, `${base}-copy-${counter}${ext}`);
      counter++;
    }

    await fs.copyFile(filePath, copyPath);

    // Find original file to get toolId
    const files = store.get('files');
    const originalFile = files.find((f) => f.path === filePath);
    const toolId = originalFile?.toolId || 'claude';

    const stats = await fs.stat(copyPath);
    const content = await fs.readFile(copyPath, 'utf-8');
    const settings = store.get('settings');
    const profile = settings.toolProfiles.find((p) => p.id === toolId);
    const tokenizer = profile?.tokenizer || 'openai';
    const tokens = countTokensForContent(content, tokenizer);

    const newFile: ContextFile = {
      id: copyPath,
      path: copyPath,
      name: path.basename(copyPath),
      toolId,
      lastModified: stats.mtimeMs,
      size: stats.size,
      tokens,
    };

    // Add to cache
    store.set('files', [...files, newFile]);

    return newFile;
  });

  // Select directory
  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  // Count tokens using real tokenizers
  ipcMain.handle('count-tokens', async (_event, content: string, tokenizer: TokenizerType) => {
    return countTokensForContent(content, tokenizer);
  });

  // Count tokens for multiple files at once
  ipcMain.handle(
    'count-tokens-batch',
    async (_event, filePaths: string[], tokenizer: TokenizerType): Promise<Record<string, number>> => {
      const results: Record<string, number> = {};

      await Promise.all(
        filePaths.map(async (filePath) => {
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            results[filePath] = countTokensForContent(content, tokenizer);
          } catch (error) {
            console.error(`Failed to count tokens for: ${filePath}`, error);
            // Try to get file size for fallback estimate
            try {
              const stats = await fs.stat(filePath);
              results[filePath] = Math.ceil(stats.size / 4);
            } catch {
              results[filePath] = 0;
            }
          }
        })
      );

      return results;
    }
  );

  // Scan directory
  ipcMain.handle('scan-directory', async (_event, scanPath: string) => {
    const settings = store.get('settings');
    const files: ContextFile[] = [];

    // Create a map of tool profiles for quick lookup
    const toolProfileMap = new Map<string, ToolProfile>();
    for (const profile of settings.toolProfiles) {
      toolProfileMap.set(profile.id, profile);
    }

    async function scanDir(dir: string) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          // Check exclusions
          if (settings.exclusions.some((ex) => entry.name === ex || fullPath.includes(`/${ex}/`))) {
            continue;
          }

          if (entry.isDirectory()) {
            await scanDir(fullPath);
          } else if (entry.isFile()) {
            // Check if file matches any tool pattern
            for (const profile of settings.toolProfiles) {
              if (!profile.enabled) continue;

              const matches = profile.patterns.some((pattern) => {
                if (pattern.includes('/')) {
                  return fullPath.endsWith(pattern);
                }
                return entry.name.toLowerCase() === pattern.toLowerCase();
              });

              if (matches) {
                const stats = await fs.stat(fullPath);
                files.push({
                  id: fullPath,
                  path: fullPath,
                  name: entry.name,
                  toolId: profile.id,
                  lastModified: stats.mtimeMs,
                  size: stats.size,
                });
                break;
              }
            }
          }
        }
      } catch (error) {
        // Skip directories we can't read
        console.error(`Cannot read directory: ${dir}`);
      }
    }

    await scanDir(scanPath);

    // Count tokens for all scanned files
    for (const file of files) {
      try {
        const content = await fs.readFile(file.path, 'utf-8');
        const profile = toolProfileMap.get(file.toolId);
        const tokenizer = profile?.tokenizer || 'openai';
        file.tokens = countTokensForContent(content, tokenizer);
      } catch (error) {
        console.error(`Failed to count tokens for: ${file.path}`, error);
        // Use file size as fallback estimate (1 token per 4 bytes)
        file.tokens = Math.ceil(file.size / 4);
      }
    }

    store.set('files', files);
    return files;
  });

  // Get app info (for About dialog)
  ipcMain.handle('get-app-info', () => {
    return {
      version: app.getVersion(),
      platform: process.platform,
      electron: process.versions.electron,
      node: process.versions.node,
      chrome: process.versions.chrome,
    };
  });

  // Get global config path (~/.claude)
  ipcMain.handle('get-global-config-path', () => {
    return path.join(os.homedir(), '.claude');
  });

  // Get global context file (~/.claude/CLAUDE.md) with token count
  ipcMain.handle(
    'get-global-context-file',
    async (_event, tokenizer: TokenizerType = 'anthropic'): Promise<GlobalConfigFile | null> => {
      const claudeMdPath = path.join(os.homedir(), '.claude', 'CLAUDE.md');

      try {
        await fs.access(claudeMdPath);
        const stats = await fs.stat(claudeMdPath);
        const content = await fs.readFile(claudeMdPath, 'utf-8');
        const tokens = countTokensForContent(content, tokenizer);

        return {
          id: claudeMdPath,
          path: claudeMdPath,
          name: 'CLAUDE.md',
          type: 'markdown',
          description: 'Global instructions for Claude Code',
          readOnly: false,
          lastModified: stats.mtimeMs,
          size: stats.size,
          tokens,
        };
      } catch {
        // ~/.claude/CLAUDE.md doesn't exist
        return null;
      }
    }
  );

  // Get global config files
  ipcMain.handle('get-global-config-files', async (): Promise<GlobalConfigFile[]> => {
    const configPath = path.join(os.homedir(), '.claude');
    const files: GlobalConfigFile[] = [];

    // Check if ~/.claude exists
    try {
      await fs.access(configPath);
    } catch {
      // ~/.claude doesn't exist
      return [];
    }

    // Helper to determine file type
    const getFileType = (name: string): GlobalConfigFileType => {
      const ext = path.extname(name).toLowerCase();
      if (ext === '.md' || ext === '.markdown') return 'markdown';
      if (ext === '.json') return 'json';
      return 'unknown';
    };

    // Helper to get file description
    const getFileDescription = (name: string, isDir: boolean): string | undefined => {
      const descriptions: Record<string, string> = {
        'CLAUDE.md': 'Global instructions for Claude Code',
        'settings.json': 'Claude Code settings',
        'settings.local.json': 'Local settings overrides',
        'commands': 'Custom slash commands',
        'todos': 'Todo storage',
      };
      return descriptions[name];
    };

    // Scan the config directory
    async function scanConfigDir(dir: string, depth = 0): Promise<GlobalConfigFile[]> {
      const result: GlobalConfigFile[] = [];

      // Limit depth to prevent deep recursion
      if (depth > 2) return result;

      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          // Skip hidden files except specific ones we want
          if (entry.name.startsWith('.') && entry.name !== '.claude') {
            continue;
          }

          try {
            const stats = await fs.stat(fullPath);

            if (entry.isDirectory()) {
              // Only include specific directories we care about
              const includeDirs = ['commands', 'todos'];
              if (depth === 0 || includeDirs.includes(entry.name)) {
                const children = await scanConfigDir(fullPath, depth + 1);
                result.push({
                  id: fullPath,
                  path: fullPath,
                  name: entry.name,
                  type: 'directory',
                  description: getFileDescription(entry.name, true),
                  lastModified: stats.mtimeMs,
                  children: children.length > 0 ? children : undefined,
                });
              }
            } else if (entry.isFile()) {
              const fileType = getFileType(entry.name);
              // Include md and json files
              if (fileType === 'markdown' || fileType === 'json') {
                result.push({
                  id: fullPath,
                  path: fullPath,
                  name: entry.name,
                  type: fileType,
                  description: getFileDescription(entry.name, false),
                  readOnly: fileType === 'json', // JSON files are read-only
                  lastModified: stats.mtimeMs,
                  size: stats.size,
                });
              }
            }
          } catch (err) {
            // Skip files we can't stat
            console.error(`Cannot stat: ${fullPath}`, err);
          }
        }
      } catch (err) {
        console.error(`Cannot read directory: ${dir}`, err);
      }

      // Sort: directories first, then alphabetically
      result.sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        if (a.type !== 'directory' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
      });

      return result;
    }

    return await scanConfigDir(configPath);
  });

  // Test AI connection
  ipcMain.handle(
    'test-ai-connection',
    async (_event, provider: AIProvider, config: AIProviderConfig): Promise<{ success: boolean; message: string }> => {
      try {
        if (provider === 'anthropic') {
          if (!config.apiKey) {
            return { success: false, message: 'API key is required' };
          }
          const client = new Anthropic({ apiKey: config.apiKey });
          // Make a minimal API call to verify the key
          await client.messages.create({
            model: config.model,
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }],
          });
          return { success: true, message: 'Connection successful!' };
        }

        if (provider === 'openai') {
          if (!config.apiKey) {
            return { success: false, message: 'API key is required' };
          }
          const client = new OpenAI({ apiKey: config.apiKey });
          // Make a minimal API call to verify the key
          await client.chat.completions.create({
            model: config.model,
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }],
          });
          return { success: true, message: 'Connection successful!' };
        }

        if (provider === 'ollama') {
          const baseUrl = config.baseUrl || 'http://localhost:11434';
          // Check if Ollama is running by hitting the tags endpoint
          const response = await fetch(`${baseUrl}/api/tags`);
          if (!response.ok) {
            return { success: false, message: `Ollama not responding (status ${response.status})` };
          }
          const data = await response.json();
          const models = data.models || [];
          if (models.length === 0) {
            return { success: false, message: 'Ollama is running but no models are installed' };
          }
          const hasModel = models.some((m: { name: string }) => m.name.includes(config.model));
          if (!hasModel) {
            return {
              success: true,
              message: `Connected! Note: Model "${config.model}" not found. Available: ${models.map((m: { name: string }) => m.name).slice(0, 3).join(', ')}`,
            };
          }
          return { success: true, message: 'Connection successful!' };
        }

        return { success: false, message: 'Unknown provider' };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Connection failed';
        return { success: false, message };
      }
    }
  );

  // AI Actions (with streaming)
  ipcMain.handle(
    'ai-execute',
    async (event, action: AIAction, content: string, projectInfo?: string, additionalInstructions?: string): Promise<void> => {
      const service = getAIService();
      const sender = event.sender;

      await service.executeAction(action, content, projectInfo, additionalInstructions, (chunk: AIStreamChunk) => {
        // Send chunk to renderer via the sender's webContents
        if (!sender.isDestroyed()) {
          sender.send('ai-stream-chunk', chunk);
        }
      });
    }
  );

  // Check if AI is configured
  ipcMain.handle('ai-is-configured', (): boolean => {
    const service = getAIService();
    return service.getActiveProvider() !== null;
  });

  // Get active AI provider info
  ipcMain.handle('ai-get-active-provider', (): { provider: AIProvider; model: string } | null => {
    const service = getAIService();
    const active = service.getActiveProvider();
    if (!active) return null;
    return { provider: active.provider, model: active.config.model };
  });

  // Track analytics event
  ipcMain.handle(
    'track-event',
    async (_event, name: string, data?: Record<string, string | number | boolean>) => {
      // Check if analytics is enabled before tracking
      const settings = store.get('settings');
      if (!settings.analyticsEnabled) {
        return;
      }
      await trackEvent({ name, data });
    }
  );

  // ============================================================
  // Tool Module System (v2.0)
  // ============================================================

  // Detect if Claude Code is installed/configured
  async function detectClaude(): Promise<boolean> {
    try {
      const claudeDir = path.join(os.homedir(), '.claude');
      await fs.access(claudeDir);
      return true;
    } catch {
      return false;
    }
  }

  // Get registered tool modules with detection status
  ipcMain.handle('get-tool-modules', async (): Promise<ToolModule[]> => {
    const claudeDetected = await detectClaude();

    const claudeModule: ToolModule = {
      id: 'claude',
      name: 'Claude Code',
      icon: '🟠',
      color: '#D97706',
      detected: claudeDetected,
      configAreas: [
        {
          id: 'commands',
          name: 'Commands',
          description: 'Custom slash commands for Claude Code',
          type: 'file-list',
          icon: '⚡',
        },
        {
          id: 'agents',
          name: 'Agents',
          description: 'Agent definitions organized by department',
          type: 'file-list',
          icon: '🤖',
        },
        {
          id: 'settings',
          name: 'Settings & Config',
          description: 'Settings, hooks, permissions, MCP servers',
          type: 'dashboard',
          icon: '⚙️',
        },
      ],
    };

    return [claudeModule];
  });

  // Get config items for a tool module's config area
  ipcMain.handle(
    'get-module-config-items',
    async (_event, toolId: string, areaId: string): Promise<ConfigItem[]> => {
      if (toolId === 'claude') {
        const claudeDir = path.join(os.homedir(), '.claude');

        if (areaId === 'commands') {
          return await getClaudeCommands(claudeDir);
        }
        if (areaId === 'agents') {
          return await getClaudeAgents(claudeDir);
        }
      }
      return [];
    }
  );

  // Claude Commands: read ~/.claude/commands/*.md
  async function getClaudeCommands(claudeDir: string): Promise<ConfigItem[]> {
    const commandsDir = path.join(claudeDir, 'commands');
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
        const tokens = countTokensForContent(content, 'anthropic');
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

  // Claude Agents: read ~/.claude/agents/**/*.md
  async function getClaudeAgents(claudeDir: string): Promise<ConfigItem[]> {
    const agentsDir = path.join(claudeDir, 'agents');
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
            const tokens = countTokensForContent(content, 'anthropic');
            const baseName = entry.name.replace(/\.md$/, '');

            // Parse YAML frontmatter
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

  // Simple YAML frontmatter parser (no yaml lib dependency)
  function parseFrontmatter(content: string): Record<string, unknown> {
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
          // Remove surrounding quotes if present
          result[currentKey] = value.replace(/^["']|["']$/g, '');
        }
      }
    }

    return result;
  }

  // Claude Commands CRUD
  ipcMain.handle(
    'claude:write-command',
    async (_event, filePath: string, content: string): Promise<void> => {
      await fs.writeFile(filePath, content, 'utf-8');
    }
  );

  ipcMain.handle(
    'claude:delete-command',
    async (_event, filePath: string): Promise<void> => {
      await fs.unlink(filePath);
    }
  );

  ipcMain.handle(
    'claude:create-command',
    async (_event, name: string, content: string): Promise<string> => {
      const commandsDir = path.join(os.homedir(), '.claude', 'commands');
      await fs.mkdir(commandsDir, { recursive: true });
      const filePath = path.join(commandsDir, `${name}.md`);

      try {
        await fs.access(filePath);
        throw new Error(`Command "${name}" already exists`);
      } catch (e: unknown) {
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
      }

      await fs.writeFile(filePath, content, 'utf-8');
      return filePath;
    }
  );

  // Claude Agents CRUD
  ipcMain.handle(
    'claude:write-agent',
    async (_event, filePath: string, content: string): Promise<void> => {
      await fs.writeFile(filePath, content, 'utf-8');
    }
  );

  ipcMain.handle(
    'claude:delete-agent',
    async (_event, filePath: string): Promise<void> => {
      await fs.unlink(filePath);
    }
  );

  ipcMain.handle(
    'claude:create-agent',
    async (_event, department: string, name: string, content: string): Promise<string> => {
      const agentsDir = path.join(os.homedir(), '.claude', 'agents');
      const deptDir = path.join(agentsDir, department);
      await fs.mkdir(deptDir, { recursive: true });
      const filePath = path.join(deptDir, `${name}.md`);

      try {
        await fs.access(filePath);
        throw new Error(`Agent "${name}" already exists in ${department}`);
      } catch (e: unknown) {
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
      }

      await fs.writeFile(filePath, content, 'utf-8');
      return filePath;
    }
  );

  ipcMain.handle(
    'claude:get-departments',
    async (): Promise<string[]> => {
      const agentsDir = path.join(os.homedir(), '.claude', 'agents');
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
  );

  // ============================================================
  // Claude Config Dashboard (Phase 4)
  // ============================================================

  // Read ~/.claude/settings.json (plugins, hooks)
  ipcMain.handle(
    'claude:get-settings',
    async (): Promise<Record<string, unknown>> => {
      const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
      try {
        const content = await fs.readFile(settingsPath, 'utf-8');
        return JSON.parse(content);
      } catch {
        return {};
      }
    }
  );

  // Merge-write to ~/.claude/settings.json (never overwrites full file)
  ipcMain.handle(
    'claude:write-settings',
    async (_event, partial: Record<string, unknown>): Promise<void> => {
      const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
      let current: Record<string, unknown> = {};
      try {
        const content = await fs.readFile(settingsPath, 'utf-8');
        current = JSON.parse(content);
      } catch {
        // File doesn't exist yet, start fresh
      }
      const merged = { ...current, ...partial };
      await fs.writeFile(settingsPath, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
    }
  );

  // Read ~/.claude/settings.local.json (permissions)
  ipcMain.handle(
    'claude:get-permissions',
    async (): Promise<Record<string, unknown>> => {
      const permPath = path.join(os.homedir(), '.claude', 'settings.local.json');
      try {
        const content = await fs.readFile(permPath, 'utf-8');
        return JSON.parse(content);
      } catch {
        return {};
      }
    }
  );

  // Merge-write to ~/.claude/settings.local.json
  ipcMain.handle(
    'claude:write-permissions',
    async (_event, partial: Record<string, unknown>): Promise<void> => {
      const permPath = path.join(os.homedir(), '.claude', 'settings.local.json');
      let current: Record<string, unknown> = {};
      try {
        const content = await fs.readFile(permPath, 'utf-8');
        current = JSON.parse(content);
      } catch {
        // File doesn't exist yet
      }
      const merged = { ...current, ...partial };
      await fs.writeFile(permPath, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
    }
  );

  // Read MCP servers from ~/.claude.json (all projects)
  ipcMain.handle(
    'claude:get-mcp-servers',
    async (): Promise<Record<string, Record<string, unknown>>> => {
      const claudeJsonPath = path.join(os.homedir(), '.claude.json');
      try {
        const content = await fs.readFile(claudeJsonPath, 'utf-8');
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
  );

  // Write/update a single MCP server in a project (read-merge-write, only touches projects.*.mcpServers)
  ipcMain.handle(
    'claude:write-mcp-server',
    async (_event, projectPath: string, serverName: string, serverConfig: Record<string, unknown>): Promise<void> => {
      const claudeJsonPath = path.join(os.homedir(), '.claude.json');
      const content = await fs.readFile(claudeJsonPath, 'utf-8');
      const data = JSON.parse(content);
      if (!data.projects) data.projects = {};
      if (!data.projects[projectPath]) data.projects[projectPath] = {};
      if (!data.projects[projectPath].mcpServers) data.projects[projectPath].mcpServers = {};
      data.projects[projectPath].mcpServers[serverName] = serverConfig;
      await fs.writeFile(claudeJsonPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    }
  );

  // Delete a single MCP server from a project
  ipcMain.handle(
    'claude:delete-mcp-server',
    async (_event, projectPath: string, serverName: string): Promise<void> => {
      const claudeJsonPath = path.join(os.homedir(), '.claude.json');
      const content = await fs.readFile(claudeJsonPath, 'utf-8');
      const data = JSON.parse(content);
      if (data.projects?.[projectPath]?.mcpServers?.[serverName]) {
        delete data.projects[projectPath].mcpServers[serverName];
        // Clean up empty mcpServers object
        if (Object.keys(data.projects[projectPath].mcpServers).length === 0) {
          delete data.projects[projectPath].mcpServers;
        }
        await fs.writeFile(claudeJsonPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
      }
    }
  );

  // Read ~/.claude/keybindings.json
  ipcMain.handle(
    'claude:get-keybindings',
    async (): Promise<Record<string, unknown> | null> => {
      const kbPath = path.join(os.homedir(), '.claude', 'keybindings.json');
      try {
        const content = await fs.readFile(kbPath, 'utf-8');
        return JSON.parse(content);
      } catch {
        return null;
      }
    }
  );

  // ============================================================
  // Starter Packs (Phase 5)
  // ============================================================

  // List all available starter packs (built-in + user-imported)
  ipcMain.handle(
    'get-starter-packs',
    async (): Promise<StarterPackMeta[]> => {
      // For now, return built-in packs only
      // User-imported packs could be stored in electron-store or a local directory
      return builtinPacks;
    }
  );

  // Install a starter pack: writes selected files, handles conflicts
  ipcMain.handle(
    'install-starter-pack',
    async (
      _event,
      packId: string,
      selectedFiles: string[], // filenames to install (subset of pack files)
      overwriteExisting: boolean
    ): Promise<{ installed: string[]; skipped: string[]; errors: string[] }> => {
      const packMeta = builtinPacks.find((p) => p.id === packId);
      if (!packMeta) throw new Error(`Pack "${packId}" not found`);

      const pack = packMeta.pack;
      const installed: string[] = [];
      const skipped: string[] = [];
      const errors: string[] = [];
      const claudeDir = path.join(os.homedir(), '.claude');

      for (const [_toolId, toolData] of Object.entries(pack.tools)) {
        const configFiles = toolData.configFiles || [];

        for (const file of configFiles) {
          if (selectedFiles.length > 0 && !selectedFiles.includes(file.filename)) {
            continue;
          }

          const targetPath = path.join(claudeDir, file.filename);

          try {
            // Ensure directory exists
            await fs.mkdir(path.dirname(targetPath), { recursive: true });

            // Check for existing file
            let exists = false;
            try {
              await fs.access(targetPath);
              exists = true;
            } catch {
              // File doesn't exist, safe to create
            }

            if (exists && !overwriteExisting) {
              skipped.push(file.filename);
              continue;
            }

            await fs.writeFile(targetPath, file.content, 'utf-8');
            installed.push(file.filename);
          } catch (error) {
            errors.push(`${file.filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        // Apply settings if present
        if (toolData.settings) {
          try {
            const settingsPath = path.join(claudeDir, 'settings.json');
            let current: Record<string, unknown> = {};
            try {
              const content = await fs.readFile(settingsPath, 'utf-8');
              current = JSON.parse(content);
            } catch {
              // File doesn't exist
            }
            const merged = { ...current, ...toolData.settings };
            await fs.writeFile(settingsPath, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
            installed.push('settings.json (merged)');
          } catch (error) {
            errors.push(`settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      return { installed, skipped, errors };
    }
  );

  // Export current config as a .tcpack file
  ipcMain.handle(
    'export-starter-pack',
    async (
      _event,
      options: { name: string; description: string; includeCommands: boolean; includeAgents: boolean; includeSettings: boolean }
    ): Promise<string> => {
      const claudeDir = path.join(os.homedir(), '.claude');
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

      // Export commands
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

      // Export agents
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

      // Export settings
      if (options.includeSettings) {
        try {
          const settingsContent = await fs.readFile(path.join(claudeDir, 'settings.json'), 'utf-8');
          pack.tools.claude.settings = JSON.parse(settingsContent);
        } catch {
          // No settings file
        }
      }

      // Show save dialog
      const result = await dialog.showSaveDialog({
        title: 'Export Starter Pack',
        defaultPath: `${options.name.replace(/\s+/g, '-').toLowerCase()}.tcpack`,
        filters: [{ name: 'TokenCentric Pack', extensions: ['tcpack'] }],
      });

      if (result.canceled || !result.filePath) {
        throw new Error('Export cancelled');
      }

      await fs.writeFile(result.filePath, JSON.stringify(pack, null, 2), 'utf-8');
      return result.filePath;
    }
  );

  // Import a .tcpack file via file picker
  ipcMain.handle(
    'import-starter-pack',
    async (): Promise<StarterPackMeta | null> => {
      const result = await dialog.showOpenDialog({
        title: 'Import Starter Pack',
        filters: [{ name: 'TokenCentric Pack', extensions: ['tcpack'] }],
        properties: ['openFile'],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      const content = await fs.readFile(result.filePaths[0], 'utf-8');
      const pack = JSON.parse(content) as StarterPack;

      // Basic validation
      if (!pack.tcpack || !pack.name || !pack.tools) {
        throw new Error('Invalid .tcpack file format');
      }

      return {
        id: `imported-${Date.now()}`,
        builtin: false,
        pack,
      };
    }
  );
}

// Setup updater-specific IPC handlers (separate to avoid circular dependency issues)
export function setupUpdaterIpcHandlers() {
  // Check for updates manually
  ipcMain.handle('check-for-updates', () => {
    checkForUpdates();
  });

  // Download the available update
  ipcMain.handle('download-update', () => {
    downloadUpdate();
  });

  // Install update and restart
  ipcMain.handle('install-update', () => {
    installUpdate();
  });
}
