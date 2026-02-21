import { useState, useEffect, useCallback } from 'react';
import { GlobalConfigFile, ContextFile } from '../../shared/types';
import { SidebarSection } from './sidebar/SidebarSection';
import { ToolIcon } from './ToolIcon';

interface GlobalConfigSectionProps {
  onSelectFile: (file: ContextFile) => void;
  selectedFile: ContextFile | null;
  isExpanded: boolean;
  onToggle: () => void;
}

/**
 * Displays the global Claude Code configuration from ~/.claude
 * Shows CLAUDE.md, commands, and settings files
 */
export function GlobalConfigSection({
  onSelectFile,
  selectedFile,
  isExpanded,
  onToggle,
}: GlobalConfigSectionProps) {
  const [configFiles, setConfigFiles] = useState<GlobalConfigFile[]>([]);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [configPath, setConfigPath] = useState<string>('');

  // Load global config files on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const [path, files] = await Promise.all([
          window.electronAPI.getGlobalConfigPath(),
          window.electronAPI.getGlobalConfigFiles(),
        ]);
        setConfigPath(path);
        setConfigFiles(files);
      } catch (error) {
        console.error('Failed to load global config:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadConfig();
  }, []);

  // Toggle directory expansion
  const toggleDir = useCallback((path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // Convert GlobalConfigFile to ContextFile for selection
  const handleSelectFile = useCallback(
    (file: GlobalConfigFile) => {
      if (file.type === 'directory') {
        toggleDir(file.path);
        return;
      }

      // Convert to ContextFile format
      const contextFile: ContextFile = {
        id: file.path,
        path: file.path,
        name: file.name,
        toolId: 'claude', // Global config is always Claude
        lastModified: file.lastModified || Date.now(),
        size: file.size || 0,
      };
      onSelectFile(contextFile);
    },
    [onSelectFile, toggleDir]
  );

  // Get icon for file type
  const getFileIconId = (file: GlobalConfigFile): string => {
    if (file.type === 'directory') {
      return expandedDirs.has(file.path) ? 'folder-open' : 'folder';
    }
    if (file.type === 'json') return 'gear';
    if (file.type === 'markdown') return 'markdown';
    return 'document';
  };

  // Render a single config item
  const renderConfigItem = (file: GlobalConfigFile, depth = 0) => {
    const isSelected = selectedFile?.path === file.path;
    const isDir = file.type === 'directory';
    const isDirExpanded = expandedDirs.has(file.path);

    return (
      <div key={file.path}>
        <div
          className={`global-config-item ${isSelected ? 'selected' : ''} ${file.readOnly ? 'read-only' : ''}`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => handleSelectFile(file)}
          title={file.description || file.path}
        >
          {isDir && (
            <span className={`tree-chevron ${isDirExpanded ? 'expanded' : ''}`}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          )}
          <ToolIcon toolId={getFileIconId(file)} size={14} className="flex-shrink-0" />
          <span className="flex-1 truncate text-sm">{file.name}</span>
          {file.readOnly && (
            <svg className="w-3 h-3 flex-shrink-0 text-content-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" title="Read-only">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          )}
        </div>
        {isDir && isDirExpanded && file.children && (
          <div className="global-config-children">
            {file.children.map((child) => renderConfigItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Don't render if no config files found
  if (!isLoading && configFiles.length === 0) {
    return null;
  }

  // Shorten the config path for display
  const displayPath = configPath.replace(/^\/Users\/[^/]+/, '~');

  return (
    <div className="global-config-section">
      <SidebarSection
        title="Global Config"
        subtitle={`(${displayPath})`}
        isExpanded={isExpanded}
        onToggle={onToggle}
        variant="purple"
      >
        <div className="global-config-content">
          {isLoading ? (
            <div className="px-4 py-2 text-xs text-content-tertiary">
              Loading...
            </div>
          ) : (
            configFiles.map((file) => renderConfigItem(file))
          )}
        </div>
      </SidebarSection>
    </div>
  );
}
