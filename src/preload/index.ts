import { contextBridge, ipcRenderer } from 'electron';
import { AppSettings, ContextFile, TokenizerType, GlobalConfigFile, AIProvider, AIProviderConfig, AIAction, AIStreamChunk } from '../shared/types';

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

  // Global config (~/.claude)
  getGlobalConfigPath: (): Promise<string> => ipcRenderer.invoke('get-global-config-path'),
  getGlobalConfigFiles: (): Promise<GlobalConfigFile[]> => ipcRenderer.invoke('get-global-config-files'),

  // AI
  testAiConnection: (provider: AIProvider, config: AIProviderConfig): Promise<{ success: boolean; message: string }> =>
    ipcRenderer.invoke('test-ai-connection', provider, config),
  aiExecute: (action: AIAction, content: string, projectInfo?: string): Promise<void> =>
    ipcRenderer.invoke('ai-execute', action, content, projectInfo),
  aiIsConfigured: (): Promise<boolean> =>
    ipcRenderer.invoke('ai-is-configured'),
  aiGetActiveProvider: (): Promise<{ provider: AIProvider; model: string } | null> =>
    ipcRenderer.invoke('ai-get-active-provider'),
  onAiStreamChunk: (callback: (chunk: AIStreamChunk) => void) => {
    ipcRenderer.on('ai-stream-chunk', (_event, chunk) => callback(chunk));
  },
  removeAiStreamChunkListener: () => {
    ipcRenderer.removeAllListeners('ai-stream-chunk');
  },

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

  // Auto-update methods
  checkForUpdates: (): Promise<void> => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: (): Promise<void> => ipcRenderer.invoke('download-update'),
  installUpdate: (): Promise<void> => ipcRenderer.invoke('install-update'),

  // Auto-update events
  onUpdateAvailable: (callback: (info: { version: string; releaseNotes?: string }) => void) => {
    ipcRenderer.on('update-available', (_event, info) => callback(info));
  },
  onUpdateDownloadProgress: (callback: (progress: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => void) => {
    ipcRenderer.on('update-download-progress', (_event, progress) => callback(progress));
  },
  onUpdateDownloaded: (callback: (info: { version: string }) => void) => {
    ipcRenderer.on('update-downloaded', (_event, info) => callback(info));
  },
  onUpdateError: (callback: (error: { message: string }) => void) => {
    ipcRenderer.on('update-error', (_event, error) => callback(error));
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
      // Global config
      getGlobalConfigPath: () => Promise<string>;
      getGlobalConfigFiles: () => Promise<GlobalConfigFile[]>;
      // AI
      testAiConnection: (provider: AIProvider, config: AIProviderConfig) => Promise<{ success: boolean; message: string }>;
      aiExecute: (action: AIAction, content: string, projectInfo?: string) => Promise<void>;
      aiIsConfigured: () => Promise<boolean>;
      aiGetActiveProvider: () => Promise<{ provider: AIProvider; model: string } | null>;
      onAiStreamChunk: (callback: (chunk: AIStreamChunk) => void) => void;
      removeAiStreamChunkListener: () => void;
      onThemeChanged: (callback: (isDark: boolean) => void) => void;
      onOpenSettings: (callback: () => void) => void;
      onNewFile: (callback: () => void) => void;
      onSaveFile: (callback: () => void) => void;
      onScanDirectory: (callback: () => void) => void;
      onShowAbout: (callback: () => void) => void;
      // Auto-update
      checkForUpdates: () => Promise<void>;
      downloadUpdate: () => Promise<void>;
      installUpdate: () => Promise<void>;
      onUpdateAvailable: (callback: (info: { version: string; releaseNotes?: string }) => void) => void;
      onUpdateDownloadProgress: (callback: (progress: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => void) => void;
      onUpdateDownloaded: (callback: (info: { version: string }) => void) => void;
      onUpdateError: (callback: (error: { message: string }) => void) => void;
    };
  }
}
