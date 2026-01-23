import { useState, useMemo } from 'react';
import { ContextFile, AppSettings } from '../../shared/types';

interface SidebarProps {
  files: ContextFile[];
  selectedFile: ContextFile | null;
  onSelectFile: (file: ContextFile) => void;
  onScanDirectory: () => void;
  onContextMenu: (file: ContextFile, x: number, y: number) => void;
  settings: AppSettings | null;
  onOpenSettings: () => void;
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
 * Get color based on token count thresholds
 * Green: < 5,000 tokens (small, easy to manage)
 * Yellow: 5,000 - 20,000 tokens (medium, watch the size)
 * Red: > 20,000 tokens (large, consider splitting)
 */
function getTokenColor(tokens: number): string {
  if (tokens < 5000) {
    return '#10B981'; // Green
  }
  if (tokens <= 20000) {
    return '#F59E0B'; // Yellow
  }
  return '#EF4444'; // Red
}

export function Sidebar({
  files,
  selectedFile,
  onSelectFile,
  onScanDirectory,
  onContextMenu,
  settings,
  onOpenSettings,
}: SidebarProps) {
  const [toolFilter, setToolFilter] = useState<string>('all');

  const getToolIcon = (toolId: string) => {
    const profile = settings?.toolProfiles.find((p) => p.id === toolId);
    return profile?.icon || '?';
  };

  const getToolColor = (toolId: string) => {
    const profile = settings?.toolProfiles.find((p) => p.id === toolId);
    return profile?.color || '#6B7280';
  };

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

  // Group files by directory
  const groupedFiles = filteredFiles.reduce(
    (acc, file) => {
      const dir = file.path.substring(0, file.path.lastIndexOf('/'));
      if (!acc[dir]) acc[dir] = [];
      acc[dir].push(file);
      return acc;
    },
    {} as Record<string, ContextFile[]>
  );

  // Calculate total tokens (for filtered files)
  const totalTokens = filteredFiles.reduce((sum, file) => sum + (file.tokens || 0), 0);

  return (
    <div className="w-64 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-800/50">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={onScanDirectory}
            className="flex-1 px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
          >
            Scan Directory
          </button>
          <button
            onClick={onOpenSettings}
            className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
            title="Settings"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* Tool filter dropdown */}
        {availableTools.length > 1 && (
          <select
            value={toolFilter}
            onChange={(e) => setToolFilter(e.target.value)}
            className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300"
          >
            <option value="all">All Tools ({files.length})</option>
            {availableTools.map((tool) => {
              const count = files.filter((f) => f.toolId === tool.id).length;
              return (
                <option key={tool.id} value={tool.id}>
                  {tool.icon} {tool.name} ({count})
                </option>
              );
            })}
          </select>
        )}
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto p-2">
        {Object.entries(groupedFiles).map(([dir, dirFiles]) => (
          <div key={dir} className="mb-3">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1 truncate">
              {dir.split('/').slice(-2).join('/')}
            </div>
            {dirFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => onSelectFile(file)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onContextMenu(file, e.clientX, e.clientY);
                }}
                className={`tree-item ${selectedFile?.id === file.id ? 'selected' : ''}`}
              >
                <span>{getToolIcon(file.toolId)}</span>
                <span className="flex-1 truncate text-sm">{file.name}</span>
                {file.tokens !== undefined && (
                  <span
                    className="text-xs font-medium ml-1 tabular-nums"
                    style={{ color: getTokenColor(file.tokens) }}
                    title={`${file.tokens.toLocaleString()} tokens`}
                  >
                    {formatTokenCount(file.tokens)}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
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
              className="font-medium"
              style={{ color: getTokenColor(totalTokens) }}
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
