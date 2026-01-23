import { ipcMain, dialog, shell } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import Store from 'electron-store';
import { AppSettings, ContextFile, ToolProfile, TokenizerType } from '../shared/types';
import { defaultToolProfiles, defaultExclusions } from '../shared/defaultProfiles';

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
const store = new Store<{ settings: AppSettings; files: ContextFile[] }>({
  defaults: {
    settings: {
      scanPaths: [],
      exclusions: defaultExclusions,
      theme: 'system',
      editorFontSize: 14,
      analyticsEnabled: true,
      toolProfiles: defaultToolProfiles,
    },
    files: [],
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
  // Get settings
  ipcMain.handle('get-settings', () => {
    return store.get('settings');
  });

  // Update settings
  ipcMain.handle('set-settings', (_event, settings: Partial<AppSettings>) => {
    const current = store.get('settings');
    store.set('settings', { ...current, ...settings });
  });

  // Get cached files
  ipcMain.handle('get-files', () => {
    return store.get('files');
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
    async (_event, dirPath: string, fileName: string, toolId: string): Promise<ContextFile> => {
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

      // Create with minimal template
      const settings = store.get('settings');
      const profile = settings.toolProfiles.find((p) => p.id === toolId);
      const tokenizer = profile?.tokenizer || 'openai';

      const initialContent = `# ${fileName}\n\n`;
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
}
