import { useState, useMemo, useCallback, useEffect } from 'react';
import { ContextFile, AppSettings, Template, SidebarSectionState } from '../../shared/types';
import { buildFileTree, getExpandedPathsForFile } from '../utils/buildFileTree';
import { TreeNode } from './TreeNode';
import { GlobalConfigSection } from './GlobalConfigSection';
import { SidebarHeader } from './sidebar/SidebarHeader';
import { SidebarSection } from './sidebar/SidebarSection';
import { TemplatesSection } from './sidebar/TemplatesSection';

interface SidebarProps {
  files: ContextFile[];
  selectedFile: ContextFile | null;
  onSelectFile: (file: ContextFile) => void;
  onSelectFileAlternate?: (file: ContextFile) => void;
  onScanDirectory: () => void;
  onContextMenu: (file: ContextFile, x: number, y: number) => void;
  onFolderContextMenu: (folderPath: string, folderName: string, x: number, y: number) => void;
  onNewFile: (preselectedTemplate?: Template, defaultDirectory?: string) => void;
  settings: AppSettings | null;
  onOpenSettings: () => void;
  onUpdateSettings?: (settings: Partial<AppSettings>) => void;
}

/**
 * Format token count in compact form
 * e.g., 1234 -> "1.2k", 45678 -> "45k", 123456 -> "123k"
 */
function formatTokenCount(tokens: number): string {
  if (tokens < 1000) {
    return tokens.toString();
  }
  if (tokens < 10000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }
  return `${Math.round(tokens / 1000)}k`;
}

/**
 * Get Tailwind classes based on token count thresholds
 * Green: < 4,000 tokens (fits comfortably)
 * Yellow: 4,000 - 8,000 tokens (medium, watch the size)
 * Red: > 8,000 tokens (large, consider splitting)
 */
function getTokenColorClass(tokens: number): string {
  if (tokens < 4000) {
    return 'text-green-600 dark:text-green-400';
  }
  if (tokens <= 8000) {
    return 'text-yellow-600 dark:text-yellow-400';
  }
  return 'text-red-600 dark:text-red-400';
}

// Default section state
const defaultSectionState: SidebarSectionState = {
  globalConfig: false,
  templates: false,
  projectFiles: true,
};

export function Sidebar({
  files,
  selectedFile,
  onSelectFile,
  onSelectFileAlternate,
  onScanDirectory,
  onContextMenu,
  onFolderContextMenu,
  onNewFile,
  settings,
  onOpenSettings,
  onUpdateSettings,
}: SidebarProps) {
  const [toolFilter, setToolFilter] = useState<string>('all');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  // Section collapse state - initialized from settings or defaults
  const [sectionState, setSectionState] = useState<SidebarSectionState>(() => {
    return settings?.sidebarSections || defaultSectionState;
  });

  // Update section state when settings change
  useEffect(() => {
    if (settings?.sidebarSections) {
      setSectionState(settings.sidebarSections);
    }
  }, [settings?.sidebarSections]);

  // Toggle a section and persist to settings
  const toggleSection = useCallback((section: keyof SidebarSectionState) => {
    setSectionState((prev) => {
      const next = { ...prev, [section]: !prev[section] };
      // Persist to settings
      if (onUpdateSettings) {
        onUpdateSettings({ sidebarSections: next });
      }
      return next;
    });
  }, [onUpdateSettings]);

  // Get unique tools from files
  const availableTools = useMemo(() => {
    const toolIds = new Set(files.map((f) => f.toolId));
    return settings?.toolProfiles.filter((p) => toolIds.has(p.id)) || [];
  }, [files, settings]);

  // Filter files by selected tool
  const filteredFiles = useMemo(() => {
    if (toolFilter === 'all') return files;
    return files.filter((f) => f.toolId === toolFilter);
  }, [files, toolFilter]);

  // Build tree from filtered files
  const fileTree = useMemo(() => {
    return buildFileTree(filteredFiles);
  }, [filteredFiles]);

  // Get all directory paths for expand/collapse all
  const allDirectoryPaths = useMemo(() => {
    const paths = new Set<string>();
    function collectPaths(nodes: ReturnType<typeof buildFileTree>) {
      for (const node of nodes) {
        if (node.isDirectory) {
          paths.add(node.path);
          if (node.children) {
            collectPaths(node.children);
          }
        }
      }
    }
    collectPaths(fileTree);
    return paths;
  }, [fileTree]);

  // Auto-expand parents when a file is selected
  useEffect(() => {
    if (selectedFile) {
      const pathsToExpand = getExpandedPathsForFile(selectedFile.path);
      setExpandedPaths((prev) => {
        const next = new Set(prev);
        for (const path of pathsToExpand) {
          next.add(path);
        }
        return next;
      });
    }
  }, [selectedFile]);

  // Toggle expand/collapse for a directory
  const handleToggleExpand = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // Expand all directories
  const handleExpandAll = useCallback(() => {
    setExpandedPaths(new Set(allDirectoryPaths));
  }, [allDirectoryPaths]);

  // Collapse all directories
  const handleCollapseAll = useCallback(() => {
    setExpandedPaths(new Set());
  }, []);

  // Handle creating a file from a template (from TemplatesSection or folder drop)
  const handleCreateFromTemplate = useCallback((template: Template, directory?: string) => {
    onNewFile(template, directory);
  }, [onNewFile]);

  // Calculate total tokens (for filtered files)
  const totalTokens = filteredFiles.reduce((sum, file) => sum + (file.tokens || 0), 0);

  // Actions for the Project Files section header
  const projectFilesActions = allDirectoryPaths.size > 0 ? (
    <div className="flex gap-1">
      <button
        onClick={handleExpandAll}
        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        title="Expand all"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>
      <button
        onClick={handleCollapseAll}
        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        title="Collapse all"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
        </svg>
      </button>
    </div>
  ) : null;

  return (
    <div className="w-64 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-800/50">
      {/* Header with branding and actions */}
      <SidebarHeader
        onScanDirectory={onScanDirectory}
        onNewFile={() => onNewFile()}
        onOpenSettings={onOpenSettings}
        toolFilter={toolFilter}
        onToolFilterChange={setToolFilter}
        availableTools={availableTools}
        totalFiles={files.length}
      />

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Global Config Section */}
        <GlobalConfigSection
          selectedFile={selectedFile}
          onSelectFile={onSelectFile}
          isExpanded={sectionState.globalConfig}
          onToggle={() => toggleSection('globalConfig')}
        />

        {/* Templates Section */}
        <TemplatesSection
          isExpanded={sectionState.templates}
          onToggle={() => toggleSection('templates')}
          onCreateFromTemplate={handleCreateFromTemplate}
        />

        {/* Project Files Section */}
        <SidebarSection
          title="Project Files"
          isExpanded={sectionState.projectFiles}
          onToggle={() => toggleSection('projectFiles')}
          badge={filteredFiles.length > 0 ? filteredFiles.length : undefined}
          actions={projectFilesActions}
        >
          {fileTree.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
              No files found.
              <br />
              Click &quot;Scan Directory&quot; to find context files.
            </div>
          ) : (
            <div className="tree-root px-1 py-1">
              {fileTree.map((node) => (
                <TreeNode
                  key={node.path}
                  node={node}
                  depth={0}
                  expandedPaths={expandedPaths}
                  selectedFile={selectedFile}
                  settings={settings}
                  onToggleExpand={handleToggleExpand}
                  onSelectFile={onSelectFile}
                  onSelectFileAlternate={onSelectFileAlternate}
                  onContextMenu={onContextMenu}
                  onFolderContextMenu={onFolderContextMenu}
                  onCreateFromTemplate={handleCreateFromTemplate}
                />
              ))}
            </div>
          )}
        </SidebarSection>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex justify-between items-center">
          <span>
            {filteredFiles.length === files.length
              ? `${files.length} file${files.length !== 1 ? 's' : ''}`
              : `${filteredFiles.length} of ${files.length} files`}
          </span>
          {totalTokens > 0 && (
            <span
              className={`font-medium ${getTokenColorClass(totalTokens)}`}
              title={`${totalTokens.toLocaleString()} total tokens`}
            >
              {formatTokenCount(totalTokens)} tokens
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
