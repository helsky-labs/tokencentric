import { contextBridge, ipcRenderer } from 'electron';
import { AppSettings, ContextFile, TokenizerType } from '../shared/types';

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('get-settings'),
  setSettings: (settings: Partial<AppSettings>): Promise<void> =>
    ipcRenderer.invoke('set-settings', settings),

  // Files
  getFiles: (): Promise<ContextFile[]> => ipcRenderer.invoke('get-files'),
  readFile: (path: string): Promise<string> => ipcRenderer.invoke('read-file', path),
  writeFile: (path: string, content: string): Promise<void> =>
    ipcRenderer.invoke('write-file', path, content),
  scanDirectory: (path: string): Promise<ContextFile[]> =>
    ipcRenderer.invoke('scan-directory', path),

  // Tokens
  countTokens: (content: string, tokenizer: TokenizerType): Promise<number> =>
    ipcRenderer.invoke('count-tokens', content, tokenizer),

  // System
  showInFolder: (path: string): Promise<void> => ipcRenderer.invoke('show-in-folder', path),
  selectDirectory: (): Promise<string | null> => ipcRenderer.invoke('select-directory'),
  deleteFile: (path: string): Promise<void> => ipcRenderer.invoke('delete-file', path),
  createFile: (dirPath: string, fileName: string, toolId: string): Promise<ContextFile> =>
    ipcRenderer.invoke('create-file', dirPath, fileName, toolId),
  duplicateFile: (path: string): Promise<ContextFile> => ipcRenderer.invoke('duplicate-file', path),

  // Events from main process
  onThemeChanged: (callback: (isDark: boolean) => void) => {
    ipcRenderer.on('theme-changed', (_event, isDark) => callback(isDark));
  },
  onOpenSettings: (callback: () => void) => {
    ipcRenderer.on('open-settings', () => callback());
  },
  onNewFile: (callback: () => void) => {
    ipcRenderer.on('new-file', () => callback());
  },
  onSaveFile: (callback: () => void) => {
    ipcRenderer.on('save-file', () => callback());
  },
  onScanDirectory: (callback: () => void) => {
    ipcRenderer.on('scan-directory', () => callback());
  },
});

// Type declaration for renderer
declare global {
  interface Window {
    electronAPI: {
      getSettings: () => Promise<AppSettings>;
      setSettings: (settings: Partial<AppSettings>) => Promise<void>;
      getFiles: () => Promise<ContextFile[]>;
      readFile: (path: string) => Promise<string>;
      writeFile: (path: string, content: string) => Promise<void>;
      scanDirectory: (path: string) => Promise<ContextFile[]>;
      countTokens: (content: string, tokenizer: TokenizerType) => Promise<number>;
      showInFolder: (path: string) => Promise<void>;
      selectDirectory: () => Promise<string | null>;
      deleteFile: (path: string) => Promise<void>;
      createFile: (dirPath: string, fileName: string, toolId: string) => Promise<ContextFile>;
      duplicateFile: (path: string) => Promise<ContextFile>;
      onThemeChanged: (callback: (isDark: boolean) => void) => void;
      onOpenSettings: (callback: () => void) => void;
      onNewFile: (callback: () => void) => void;
      onSaveFile: (callback: () => void) => void;
      onScanDirectory: (callback: () => void) => void;
    };
  }
}
