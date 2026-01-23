import { useEffect, useState, useCallback, useRef } from 'react';
import Editor, { OnMount, loader } from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import { ContextFile, AppSettings } from '../../shared/types';

// Configure Monaco to load from CDN (more reliable in Electron)
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs'
  }
});

type ViewMode = 'editor' | 'preview' | 'split';

interface MainContentProps {
  selectedFile: ContextFile | null;
  settings: AppSettings | null;
  isDark: boolean;
}

export function MainContent({ selectedFile, settings, isDark }: MainContentProps) {
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

  // Save file handler
  const handleSave = useCallback(async () => {
    if (!selectedFile || !hasChanges || isSaving) return;

    setIsSaving(true);
    try {
      await window.electronAPI.writeFile(selectedFile.path, content);
      setOriginalContent(content);
    } catch (error) {
      console.error('Failed to save file:', error);
    } finally {
      setIsSaving(false);
    }
  }, [selectedFile, content, hasChanges, isSaving]);

  // Listen for save-file IPC event (Cmd+S / Ctrl+S from menu)
  useEffect(() => {
    window.electronAPI.onSaveFile(() => {
      handleSave();
    });
  }, [handleSave]);

  // Handle editor mount
  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  // Detect if file is markdown
  const isMarkdown = selectedFile?.name.match(/\.(md|mdx|markdown)$/i);

  if (!selectedFile) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">...</div>
          <div>Select a file to view</div>
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
      {/* File header */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="text-sm font-medium truncate">{selectedFile.path}</div>
          {hasChanges && (
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

      {/* Editor/Preview area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor pane */}
        {(viewMode === 'editor' || viewMode === 'split' || !isMarkdown) && (
          <div className={`${viewMode === 'split' && isMarkdown ? 'w-1/2' : 'flex-1'} overflow-hidden`}>
            <Editor
              height="100%"
              language={isMarkdown ? 'markdown' : getLanguageFromFilename(selectedFile.name)}
              value={content}
              onChange={(value) => setContent(value || '')}
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
