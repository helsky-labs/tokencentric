import { useCallback, useRef, useMemo, useState, DragEvent } from 'react';
import Editor, { OnMount, loader } from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import { useEditorStore, ViewMode, EditorPane as EditorPaneType } from '../../store/editorStore';
import { EditorTabs } from './EditorTabs';
import { FileInfoBar } from './FileInfoBar';
import { AIActionsPopover } from './AIActionsPopover';
import { ContextFile, AppSettings } from '../../../shared/types';

// Configure Monaco to load from CDN (more reliable in Electron)
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs'
  }
});

interface EditorPaneProps {
  pane: EditorPaneType;
  allFiles: ContextFile[];
  settings: AppSettings | null;
  isDark: boolean;
  isActive: boolean;
  onSplitHorizontal?: () => void;
  onSplitVertical?: () => void;
  onUnsplit?: () => void;
  canSplit: boolean;
  canUnsplit: boolean;
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

export function EditorPane({
  pane,
  allFiles,
  settings,
  isDark,
  isActive,
  onSplitHorizontal,
  onSplitVertical,
  onUnsplit,
  canSplit,
  canUnsplit,
}: EditorPaneProps) {
  const editorRef = useRef<ReturnType<OnMount> | null>(null);
  const {
    tabs,
    updateTabContent,
    saveTab,
    setTabViewMode,
    setActiveTab,
    setActivePane,
    openFileInPane,
  } = useEditorStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAIPopoverOpen, setIsAIPopoverOpen] = useState(false);
  const aiButtonRef = useRef<HTMLButtonElement>(null);

  // Handle drag over for file drop from sidebar
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    // Check if this is a file being dragged from the sidebar
    if (e.dataTransfer.types.includes('application/json')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (!isDragOver) {
        setIsDragOver(true);
      }
    }
  }, [isDragOver]);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    // Only set drag over to false if we're leaving the pane entirely
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    // Try to get file data from drag
    const jsonData = e.dataTransfer.getData('application/json');
    if (jsonData) {
      try {
        const file: ContextFile = JSON.parse(jsonData);
        if (file && file.path) {
          openFileInPane(file, pane.id);
        }
      } catch (error) {
        console.error('Failed to parse dropped file:', error);
      }
    }
  }, [openFileInPane, pane.id]);

  // Get tabs for this pane
  const paneTabs = useMemo(() =>
    pane.tabIds.map(id => tabs.get(id)).filter(Boolean) as ReturnType<typeof useEditorStore.getState>['tabs'] extends Map<string, infer T> ? T[] : never,
    [pane.tabIds, tabs]
  );

  const activeTab = useMemo(() =>
    pane.activeTabId ? tabs.get(pane.activeTabId) : null,
    [pane.activeTabId, tabs]
  );

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
      window.electronAPI.trackEvent('file_saved', { toolId: selectedFile?.toolId });
    } catch (error) {
      console.error('Failed to save file:', error);
    } finally {
      setIsSaving(false);
    }
  }, [activeTab, isDirty, isSaving, isReadOnly, saveTab, selectedFile?.toolId]);

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
      const existingTab = Array.from(tabs.values()).find(t => t.file.path === file.path);
      if (existingTab) {
        setActiveTab(existingTab.id);
      }
    }
  }, [tabs, setActiveTab]);

  // Handle pane focus
  const handlePaneFocus = useCallback(() => {
    if (!isActive) {
      setActivePane(pane.id);
    }
  }, [isActive, pane.id, setActivePane]);

  // Get project directory for AI context
  const projectDir = selectedFile?.path
    ? selectedFile.path.substring(0, selectedFile.path.lastIndexOf('/'))
    : undefined;

  // No tabs open state
  if (!activeTab) {
    return (
      <div
        className={`flex-1 flex flex-col overflow-hidden ${!isActive ? 'opacity-75' : ''} ${isDragOver ? 'drop-target-active' : ''}`}
        onClick={handlePaneFocus}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Show empty tabs bar */}
        <EditorTabs
          paneId={pane.id}
          tabs={paneTabs}
          activeTabId={null}
          onSplitHorizontal={canSplit ? onSplitHorizontal : undefined}
          onSplitVertical={canSplit ? onSplitVertical : undefined}
          onUnsplit={canUnsplit ? onUnsplit : undefined}
        />

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
              Choose from the sidebar
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentFile = activeTab.file;

  return (
    <div
      className={`flex-1 flex flex-col overflow-hidden ${!isActive ? 'opacity-90' : ''} ${isDragOver ? 'drop-target-active' : ''}`}
      onClick={handlePaneFocus}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Tab bar with AI button for markdown files */}
      <EditorTabs
        paneId={pane.id}
        tabs={paneTabs}
        activeTabId={pane.activeTabId}
        onSplitHorizontal={canSplit ? onSplitHorizontal : undefined}
        onSplitVertical={canSplit ? onSplitVertical : undefined}
        onUnsplit={canUnsplit ? onUnsplit : undefined}
        showAIButton={!!isMarkdown && !isReadOnly}
        aiButtonRef={aiButtonRef}
        onAIClick={() => setIsAIPopoverOpen(!isAIPopoverOpen)}
      />

      {/* Collapsible file info bar - replaces Breadcrumb, HierarchicalCostPanel, and file header */}
      <FileInfoBar
        file={currentFile}
        allFiles={allFiles}
        settings={settings}
        viewMode={viewMode}
        isDirty={isDirty}
        isReadOnly={!!isReadOnly}
        isSaving={isSaving}
        onSelectFile={handleSelectFile}
        onViewModeChange={handleViewModeChange}
      />

      {/* AI Actions Popover - floating popover for markdown files */}
      {isMarkdown && !isReadOnly && (
        <AIActionsPopover
          isOpen={isAIPopoverOpen}
          onClose={() => setIsAIPopoverOpen(false)}
          content={content}
          projectInfo={projectDir}
          onContentGenerated={handleAIContent}
          disabled={isSaving}
          anchorRef={aiButtonRef}
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
