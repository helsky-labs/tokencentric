import { useState, useEffect, useCallback } from 'react';
import { GlobalConfigFile, ContextFile } from '../../shared/types';

interface GlobalConfigSectionProps {
  onSelectFile: (file: ContextFile) => void;
  selectedFile: ContextFile | null;
}

/**
 * Displays the global Claude Code configuration from ~/.claude
 * Shows CLAUDE.md, commands, and settings files
 */
export function GlobalConfigSection({ onSelectFile, selectedFile }: GlobalConfigSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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
  const getFileIcon = (file: GlobalConfigFile): string => {
    if (file.type === 'directory') {
      return expandedDirs.has(file.path) ? '📂' : '📁';
    }
    if (file.type === 'json') return '⚙️';
    if (file.type === 'markdown') return '📝';
    return '📄';
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
          <span className="text-base">{getFileIcon(file)}</span>
          <span className="flex-1 truncate text-sm">{file.name}</span>
          {file.readOnly && (
            <span className="text-xs text-gray-400 dark:text-gray-500" title="Read-only">
              🔒
            </span>
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

  return (
    <div className="global-config-section">
      {/* Section header */}
      <div
        className="global-config-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className={`tree-chevron ${isExpanded ? 'expanded' : ''}`}>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
        <span>Config Global</span>
        <span className="text-purple-500 dark:text-purple-400 ml-auto font-normal">(~/.claude)</span>
      </div>

      {/* Config files */}
      {isExpanded && (
        <div className="global-config-content">
          {isLoading ? (
            <div className="px-4 py-2 text-xs text-gray-400 dark:text-gray-500">
              Loading...
            </div>
          ) : (
            configFiles.map((file) => renderConfigItem(file))
          )}
        </div>
      )}
    </div>
  );
}
