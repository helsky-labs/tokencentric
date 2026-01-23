import { ContextFile, AppSettings } from '../../shared/types';

interface SidebarProps {
  files: ContextFile[];
  selectedFile: ContextFile | null;
  onSelectFile: (file: ContextFile) => void;
  onScanDirectory: () => void;
  onContextMenu: (file: ContextFile, x: number, y: number) => void;
  settings: AppSettings | null;
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
}: SidebarProps) {
  const getToolIcon = (toolId: string) => {
    const profile = settings?.toolProfiles.find((p) => p.id === toolId);
    return profile?.icon || '?';
  };

  const getToolColor = (toolId: string) => {
    const profile = settings?.toolProfiles.find((p) => p.id === toolId);
    return profile?.color || '#6B7280';
  };

  // Group files by directory
  const groupedFiles = files.reduce(
    (acc, file) => {
      const dir = file.path.substring(0, file.path.lastIndexOf('/'));
      if (!acc[dir]) acc[dir] = [];
      acc[dir].push(file);
      return acc;
    },
    {} as Record<string, ContextFile[]>
  );

  // Calculate total tokens
  const totalTokens = files.reduce((sum, file) => sum + (file.tokens || 0), 0);

  return (
    <div className="w-64 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-800/50">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onScanDirectory}
          className="w-full px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
        >
          Scan Directory
        </button>
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
          <span>{files.length} file{files.length !== 1 ? 's' : ''}</span>
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
