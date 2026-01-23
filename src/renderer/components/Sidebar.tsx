import { ContextFile, AppSettings } from '../../shared/types';

interface SidebarProps {
  files: ContextFile[];
  selectedFile: ContextFile | null;
  onSelectFile: (file: ContextFile) => void;
  onScanDirectory: () => void;
  settings: AppSettings | null;
}

export function Sidebar({
  files,
  selectedFile,
  onSelectFile,
  onScanDirectory,
  settings,
}: SidebarProps) {
  const getToolIcon = (toolId: string) => {
    const profile = settings?.toolProfiles.find((p) => p.id === toolId);
    return profile?.icon || '📄';
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
                className={`tree-item ${selectedFile?.id === file.id ? 'selected' : ''}`}
              >
                <span>{getToolIcon(file.toolId)}</span>
                <span className="flex-1 truncate text-sm">{file.name}</span>
                {file.tokens && (
                  <span className="text-xs text-gray-400">{file.tokens.toLocaleString()}</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        {files.length} file{files.length !== 1 ? 's' : ''} found
      </div>
    </div>
  );
}
