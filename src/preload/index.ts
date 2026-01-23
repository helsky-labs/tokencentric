import { contextBridge, ipcRenderer } from 'electron';
import { AppSettings, ContextFile, TokenizerType } from '../shared/types';

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Onboarding
  getOnboardingStatus: (): Promise<boolean> => ipcRenderer.invoke('get-onboarding-status'),
  setOnboardingComplete: (): Promise<void> => ipcRenderer.invoke('set-onboarding-complete'),

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
  createFile: (dirPath: string, fileName: string, toolId: string, content?: string): Promise<ContextFile> =>
    ipcRenderer.invoke('create-file', dirPath, fileName, toolId, content),
  duplicateFile: (path: string): Promise<ContextFile> => ipcRenderer.invoke('duplicate-file', path),

  // App info
  getAppInfo: (): Promise<{
    version: string;
    platform: string;
    electron: string;
    node: string;
    chrome: string;
  }> => ipcRenderer.invoke('get-app-info'),

  // Analytics
  trackEvent: (name: string, data?: Record<string, string | number | boolean>): Promise<void> =>
    ipcRenderer.invoke('track-event', name, data),

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
  onShowAbout: (callback: () => void) => {
    ipcRenderer.on('show-about', () => callback());
  },
});

// Type declaration for renderer
declare global {
  interface Window {
    electronAPI: {
      getOnboardingStatus: () => Promise<boolean>;
      setOnboardingComplete: () => Promise<void>;
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
      createFile: (dirPath: string, fileName: string, toolId: string, content?: string) => Promise<ContextFile>;
      duplicateFile: (path: string) => Promise<ContextFile>;
      getAppInfo: () => Promise<{
        version: string;
        platform: string;
        electron: string;
        node: string;
        chrome: string;
      }>;
      trackEvent: (name: string, data?: Record<string, string | number | boolean>) => Promise<void>;
      onThemeChanged: (callback: (isDark: boolean) => void) => void;
      onOpenSettings: (callback: () => void) => void;
      onNewFile: (callback: () => void) => void;
      onSaveFile: (callback: () => void) => void;
      onScanDirectory: (callback: () => void) => void;
      onShowAbout: (callback: () => void) => void;
    };
  }
}
