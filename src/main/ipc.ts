import { ipcMain, dialog, shell } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import Store from 'electron-store';
import { AppSettings, ContextFile, ToolProfile } from '../shared/types';
import { defaultToolProfiles, defaultExclusions } from '../shared/defaultProfiles';

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

  // Select directory
  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  // Count tokens (placeholder - will implement tokenizers)
  ipcMain.handle('count-tokens', async (_event, content: string, tokenizer: string) => {
    // Rough estimate for now: ~4 chars per token
    // TODO: Implement actual tokenizers
    return Math.ceil(content.length / 4);
  });

  // Scan directory
  ipcMain.handle('scan-directory', async (_event, scanPath: string) => {
    const settings = store.get('settings');
    const files: ContextFile[] = [];

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
    store.set('files', files);
    return files;
  });
}
