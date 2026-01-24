import { useEffect, useState, useCallback, useRef } from 'react';
import Editor, { OnMount, loader } from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import { ContextFile, AppSettings } from '../../shared/types';
import { Breadcrumb } from './Breadcrumb';
import { AIActionsToolbar } from './AIActionsToolbar';
import { HierarchicalCostPanel } from './HierarchicalCostPanel';

// Configure Monaco to load from CDN (more reliable in Electron)
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs'
  }
});

type ViewMode = 'editor' | 'preview' | 'split';

interface MainContentProps {
  selectedFile: ContextFile | null;
  allFiles: ContextFile[];
  onSelectFile: (file: ContextFile | null) => void;
  settings: AppSettings | null;
  isDark: boolean;
}

export function MainContent({ selectedFile, allFiles, onSelectFile, settings, isDark }: MainContentProps) {
  const [originalContent, setOriginalContent] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<ReturnType<OnMount> | null>(null);

  const hasChanges = content !== originalContent;

  // Load file content when selected file changes
  useEffect(() => {
    async function loadFile() {
      if (!selectedFile) {
        setContent('');
        setOriginalContent('');
        return;
      }

      setIsLoading(true);
      try {
        const fileContent = await window.electronAPI.readFile(selectedFile.path);
        setContent(fileContent);
        setOriginalContent(fileContent);
      } catch (error) {
        console.error('Failed to load file:', error);
        setContent('Failed to load file');
        setOriginalContent('');
      } finally {
        setIsLoading(false);
      }
    }

    loadFile();
  }, [selectedFile]);

  // Detect if file is JSON
  const isJson = selectedFile?.name.match(/\.json$/i);

  // Detect if file should be read-only (JSON files in ~/.claude)
  const isReadOnly = isJson && selectedFile?.path.includes('/.claude/');

  // Save file handler
  const handleSave = useCallback(async () => {
    if (!selectedFile || !hasChanges || isSaving || isReadOnly) return;

    setIsSaving(true);
    try {
      await window.electronAPI.writeFile(selectedFile.path, content);
      setOriginalContent(content);
    } catch (error) {
      console.error('Failed to save file:', error);
    } finally {
      setIsSaving(false);
    }
  }, [selectedFile, content, hasChanges, isSaving, isReadOnly]);

  // Listen for save-file IPC event (Cmd+S / Ctrl+S from menu)
  useEffect(() => {
    window.electronAPI.onSaveFile(() => {
      handleSave();
    });
  }, [handleSave]);

  // Listen for Escape key to close file
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedFile && !hasChanges) {
        onSelectFile(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFile, hasChanges, onSelectFile]);

  // Handle editor mount
  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  // Detect if file is markdown
  const isMarkdown = selectedFile?.name.match(/\.(md|mdx|markdown)$/i);

  // Handle AI-generated content
  const handleAIContent = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  // Get project directory for AI context
  const projectDir = selectedFile?.path ? selectedFile.path.substring(0, selectedFile.path.lastIndexOf('/')) : undefined;

  if (!selectedFile) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
        <div className="text-center max-w-xs">
          <div className="text-4xl mb-3 opacity-50">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="font-medium mb-1">Select a file to view</div>
          <div className="text-sm text-gray-400 dark:text-gray-500">
            Choose from the sidebar, or click{' '}
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">+</span>
            {' '}to create from templates
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Breadcrumb - inheritance chain */}
      <div className="px-4 py-1.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
        <Breadcrumb
          selectedFile={selectedFile}
          allFiles={allFiles}
          onSelectFile={onSelectFile}
        />
      </div>

      {/* Hierarchical Cost Panel - shows total context cost */}
      <HierarchicalCostPanel
        selectedFile={selectedFile}
        allFiles={allFiles}
        settings={settings}
        onSelectFile={onSelectFile}
      />

      {/* File header */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {/* Close button */}
          <button
            onClick={() => onSelectFile(null)}
            className="p-1 -ml-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Close file (Esc)"
          >
            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="text-sm font-medium truncate">{selectedFile.name}</div>
          {isReadOnly && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex-shrink-0 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              read-only
            </span>
          )}
          {!isReadOnly && hasChanges && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex-shrink-0">
              unsaved
            </span>
          )}
          {isSaving && (
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
              Saving...
            </span>
          )}
        </div>

        {/* View mode toggle - only show for markdown files */}
        {isMarkdown && (
          <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 rounded-md p-0.5">
            <button
              onClick={() => setViewMode('editor')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                viewMode === 'editor'
                  ? 'bg-white dark:bg-gray-600 shadow-sm'
                  : 'hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Editor
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-gray-600 shadow-sm'
                  : 'hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Split
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                viewMode === 'preview'
                  ? 'bg-white dark:bg-gray-600 shadow-sm'
                  : 'hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Preview
            </button>
          </div>
        )}
      </div>

      {/* AI Actions Toolbar - only for markdown files that are not read-only */}
      {isMarkdown && !isReadOnly && (
        <AIActionsToolbar
          content={content}
          projectInfo={projectDir}
          onContentGenerated={handleAIContent}
          disabled={isSaving}
        />
      )}

      {/* Editor/Preview area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor pane */}
        {(viewMode === 'editor' || viewMode === 'split' || !isMarkdown) && (
          <div className={`${viewMode === 'split' && isMarkdown ? 'w-1/2' : 'flex-1'} overflow-hidden`}>
            <Editor
              height="100%"
              language={isMarkdown ? 'markdown' : getLanguageFromFilename(selectedFile.name)}
              value={content}
              onChange={(value) => !isReadOnly && setContent(value || '')}
              onMount={handleEditorMount}
              theme={isDark ? 'vs-dark' : 'vs'}
              loading={<div className="flex items-center justify-center h-full text-gray-500">Loading editor...</div>}
              options={{
                fontSize: settings?.editorFontSize || 14,
                wordWrap: 'on',
                minimap: { enabled: false },
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                insertSpaces: true,
                renderWhitespace: 'selection',
                folding: true,
                lineDecorationsWidth: 8,
                lineNumbersMinChars: 3,
                padding: { top: 8, bottom: 8 },
                readOnly: isReadOnly,
              }}
            />
          </div>
        )}

        {/* Divider for split view */}
        {viewMode === 'split' && isMarkdown && (
          <div className="w-px bg-gray-200 dark:bg-gray-700" />
        )}

        {/* Preview pane */}
        {isMarkdown && (viewMode === 'preview' || viewMode === 'split') && (
          <div
            className={`${viewMode === 'split' ? 'w-1/2' : 'flex-1'} overflow-auto bg-white dark:bg-gray-900 p-4`}
          >
            <article className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </article>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to detect language from filename
function getLanguageFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    json: 'json',
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'scss',
    less: 'less',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    kt: 'kotlin',
    kts: 'kotlin',
    swift: 'swift',
    c: 'c',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    h: 'c',
    hpp: 'cpp',
    cs: 'csharp',
    php: 'php',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    svg: 'xml',
    toml: 'toml',
    ini: 'ini',
    conf: 'ini',
    dockerfile: 'dockerfile',
    graphql: 'graphql',
    gql: 'graphql',
  };
  return languageMap[ext || ''] || 'plaintext';
}
