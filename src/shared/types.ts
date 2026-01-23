// Tool profile types
export type TokenizerType = 'anthropic' | 'openai';

export interface ToolProfile {
  id: string;
  name: string;
  patterns: string[];
  tokenizer: TokenizerType;
  icon: string;
  color: string;
  docsUrl?: string;
  enabled: boolean;
}

// File types
export interface ContextFile {
  id: string;
  path: string;
  name: string;
  toolId: string;
  tokens?: number;
  lastModified: number;
  size: number;
}

export interface FileTreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileTreeNode[];
  file?: ContextFile;
}

// Settings types
export interface AppSettings {
  scanPaths: string[];
  exclusions: string[];
  theme: 'system' | 'light' | 'dark';
  editorFontSize: number;
  analyticsEnabled: boolean;
  toolProfiles: ToolProfile[];
}

// IPC types
export interface IpcChannels {
  'scan-directory': (path: string) => Promise<ContextFile[]>;
  'get-files': () => Promise<ContextFile[]>;
  'read-file': (path: string) => Promise<string>;
  'write-file': (path: string, content: string) => Promise<void>;
  'count-tokens': (content: string, tokenizer: TokenizerType) => Promise<number>;
  'get-settings': () => Promise<AppSettings>;
  'set-settings': (settings: Partial<AppSettings>) => Promise<void>;
  'show-in-folder': (path: string) => Promise<void>;
  'select-directory': () => Promise<string | null>;
}
