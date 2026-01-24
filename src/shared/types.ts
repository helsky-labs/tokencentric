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

// Global config types (for ~/.claude)
export type GlobalConfigFileType = 'markdown' | 'json' | 'directory' | 'unknown';

export interface GlobalConfigFile {
  id: string;
  path: string;
  name: string;
  type: GlobalConfigFileType;
  description?: string; // Human-readable description of what this file does
  readOnly?: boolean; // Whether the file should be read-only in editor
  lastModified?: number;
  size?: number;
  tokens?: number; // Token count for the file
  children?: GlobalConfigFile[]; // For directories
}

// Hierarchical cost display types
export interface InheritanceChainItem {
  path: string;
  name: string;
  displayPath: string; // Simplified path (~ for home)
  file?: ContextFile;
  tokens?: number;
  isGlobal?: boolean; // True for ~/.claude/CLAUDE.md
  isCurrent?: boolean; // True for the currently selected file
}

// Template types
export interface TemplateVariable {
  name: string; // e.g., "PROJECT_NAME"
  label: string; // e.g., "Project Name"
  placeholder: string; // e.g., "my-awesome-project"
  required: boolean;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  toolId: string; // 'claude' | 'cursor' | 'copilot' | 'all'
  category: 'minimal' | 'fullstack' | 'backend' | 'mobile' | 'safety' | 'general';
  content: string;
  variables: TemplateVariable[];
}

// AI Provider types
export type AIProvider = 'anthropic' | 'openai' | 'ollama';

export interface AIProviderConfig {
  enabled: boolean;
  apiKey?: string; // Not stored for ollama
  baseUrl?: string; // For ollama or custom endpoints
  model: string;
}

export interface AISettings {
  defaultProvider: AIProvider;
  providers: {
    anthropic: AIProviderConfig;
    openai: AIProviderConfig;
    ollama: AIProviderConfig;
  };
}

export type AIAction = 'generate' | 'improve' | 'summarize';

export interface AIRequest {
  action: AIAction;
  content?: string; // Current file content (for improve/summarize)
  projectPath?: string; // Project root (for generate)
  targetTool?: string; // Which tool format to generate (claude, cursor, etc.)
}

export interface AIStreamChunk {
  type: 'text' | 'done' | 'error';
  content: string;
}

// Default AI settings
export const defaultAISettings: AISettings = {
  defaultProvider: 'anthropic',
  providers: {
    anthropic: {
      enabled: false,
      apiKey: '',
      model: 'claude-sonnet-4-20250514',
    },
    openai: {
      enabled: false,
      apiKey: '',
      model: 'gpt-4o',
    },
    ollama: {
      enabled: false,
      baseUrl: 'http://localhost:11434',
      model: 'llama3.2',
    },
  },
};

// Sidebar section state persistence
export interface SidebarSectionState {
  globalConfig: boolean;  // default: false (collapsed)
  templates: boolean;     // default: false (collapsed)
  projectFiles: boolean;  // default: true (expanded)
}

// Editor state persistence types
export type SplitDirection = 'horizontal' | 'vertical' | null;

export interface EditorPaneState {
  id: string;
  tabPaths: string[];
  activeTabPath: string | null;
  size: number;
}

export interface EditorStatePersisted {
  panes: EditorPaneState[];
  activePaneId: string;
  splitDirection: SplitDirection;
}

// Settings types
export interface AppSettings {
  scanPaths: string[];
  exclusions: string[];
  theme: 'system' | 'light' | 'dark';
  editorFontSize: number;
  analyticsEnabled: boolean;
  toolProfiles: ToolProfile[];
  ai?: AISettings;
  editorState?: EditorStatePersisted;
  sidebarSections?: SidebarSectionState;
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
