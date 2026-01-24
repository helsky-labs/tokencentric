import { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import Editor, { OnMount, loader } from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import { useEditorStore, ViewMode } from '../../store/editorStore';
import { EditorTabs } from './EditorTabs';
import { Breadcrumb } from '../Breadcrumb';
import { AIActionsToolbar } from '../AIActionsToolbar';
import { HierarchicalCostPanel } from '../HierarchicalCostPanel';
import { ContextFile, AppSettings } from '../../../shared/types';

// Configure Monaco to load from CDN (more reliable in Electron)
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs'
  }
});

interface EditorContainerProps {
  allFiles: ContextFile[];
  settings: AppSettings | null;
  isDark: boolean;
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

export function EditorContainer({ allFiles, settings, isDark }: EditorContainerProps) {
  const editorRef = useRef<ReturnType<OnMount> | null>(null);

  const {
    tabs,
    panes,
    activePaneId,
    updateTabContent,
    saveTab,
    setTabViewMode,
    setActiveTab,
  } = useEditorStore();

  // Get active pane and tab
  const activePane = useMemo(() =>
    panes.find(p => p.id === activePaneId) || panes[0],
    [panes, activePaneId]
  );

  const activeTabs = useMemo(() =>
    activePane.tabIds.map(id => tabs.get(id)).filter(Boolean) as ReturnType<typeof useEditorStore.getState>['tabs'] extends Map<string, infer T> ? T[] : never,
    [activePane.tabIds, tabs]
  );

  const activeTab = useMemo(() =>
    activePane.activeTabId ? tabs.get(activePane.activeTabId) : null,
    [activePane.activeTabId, tabs]
  );

  const [isSaving, setIsSaving] = useState(false);

  // Derive values from active tab
  const selectedFile = activeTab?.file;
  const content = activeTab?.content || '';
  const viewMode = activeTab?.viewMode || 'split';
  const isDirty = activeTab?.isDirty || false;

  // Detect if file is JSON
  const isJson = selectedFile?.name.match(/\.json$/i);

  // Detect if file should be read-only (JSON files in ~/.claude)
  const isReadOnly = isJson && selectedFile?.path.includes('/.claude/');

  // Detect if file is markdown
  const isMarkdown = selectedFile?.name.match(/\.(md|mdx|markdown)$/i);

  // Save file handler
  const handleSave = useCallback(async () => {
    if (!activeTab || !isDirty || isSaving || isReadOnly) return;

    setIsSaving(true);
    try {
      await saveTab(activeTab.id);
    } catch (error) {
      console.error('Failed to save file:', error);
    } finally {
      setIsSaving(false);
    }
  }, [activeTab, isDirty, isSaving, isReadOnly, saveTab]);

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

  // Handle content change
  const handleContentChange = useCallback((value: string | undefined) => {
    if (!activeTab || isReadOnly) return;
    updateTabContent(activeTab.id, value || '');
  }, [activeTab, isReadOnly, updateTabContent]);

  // Handle AI-generated content
  const handleAIContent = useCallback((newContent: string) => {
    if (!activeTab) return;
    updateTabContent(activeTab.id, newContent);
  }, [activeTab, updateTabContent]);

  // Handle view mode change
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    if (!activeTab) return;
    setTabViewMode(activeTab.id, mode);
  }, [activeTab, setTabViewMode]);

  // Handle file selection from breadcrumb
  const handleSelectFile = useCallback((file: ContextFile | null) => {
    if (file) {
      // Find tab for this file and focus it, or open it
      const existingTab = Array.from(tabs.values()).find(t => t.file.path === file.path);
      if (existingTab) {
        setActiveTab(existingTab.id);
      }
    }
  }, [tabs, setActiveTab]);

  // Get project directory for AI context
  const projectDir = selectedFile?.path
    ? selectedFile.path.substring(0, selectedFile.path.lastIndexOf('/'))
    : undefined;

  // No tabs open state
  if (!activeTab) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Show empty tabs bar */}
        <EditorTabs paneId={activePane.id} tabs={activeTabs} activeTabId={null} />

        {/* Empty state */}
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
      </div>
    );
  }

  // At this point, activeTab is guaranteed to be non-null
  const currentFile = activeTab.file;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tab bar */}
      <EditorTabs paneId={activePane.id} tabs={activeTabs} activeTabId={activePane.activeTabId} />

      {/* Breadcrumb - inheritance chain */}
      <div className="px-4 py-1.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
        <Breadcrumb
          selectedFile={currentFile}
          allFiles={allFiles}
          onSelectFile={handleSelectFile}
        />
      </div>

      {/* Hierarchical Cost Panel - shows total context cost */}
      <HierarchicalCostPanel
        selectedFile={currentFile}
        allFiles={allFiles}
        settings={settings}
        onSelectFile={handleSelectFile}
      />

      {/* File header */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="text-sm font-medium truncate">{currentFile.name}</div>
          {isReadOnly && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex-shrink-0 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              read-only
            </span>
          )}
          {!isReadOnly && isDirty && (
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
              onClick={() => handleViewModeChange('editor')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                viewMode === 'editor'
                  ? 'bg-white dark:bg-gray-600 shadow-sm'
                  : 'hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Editor
            </button>
            <button
              onClick={() => handleViewModeChange('split')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-gray-600 shadow-sm'
                  : 'hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Split
            </button>
            <button
              onClick={() => handleViewModeChange('preview')}
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
              language={isMarkdown ? 'markdown' : getLanguageFromFilename(currentFile.name)}
              value={content}
              onChange={handleContentChange}
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
