import { useState } from 'react';
import { StarterPackMeta } from '../../../shared/builtinPacks';

interface InstallPreviewDialogProps {
  packMeta: StarterPackMeta;
  onInstall: (selectedFiles: string[], overwrite: boolean) => void;
  onCancel: () => void;
}

export function InstallPreviewDialog({ packMeta, onInstall, onCancel }: InstallPreviewDialogProps) {
  const { pack } = packMeta;

  // Collect all files
  const allFiles: string[] = [];
  for (const toolData of Object.values(pack.tools)) {
    for (const file of toolData.configFiles || []) {
      allFiles.push(file.filename);
    }
  }

  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set(allFiles));
  const [overwrite, setOverwrite] = useState(false);

  const hasSettings = Object.values(pack.tools).some((t) => t.settings);

  function toggleFile(filename: string) {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(filename)) {
        next.delete(filename);
      } else {
        next.add(filename);
      }
      return next;
    });
  }

  function toggleAll() {
    if (selectedFiles.size === allFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(allFiles));
    }
  }

  // Group files by directory prefix
  const grouped: Record<string, string[]> = {};
  for (const file of allFiles) {
    const parts = file.split('/');
    const group = parts.length > 1 ? parts.slice(0, -1).join('/') : 'root';
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(file);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[480px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Install: {pack.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Select which files to install into ~/.claude/
          </p>
        </div>

        {/* File tree */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={toggleAll}
              className="text-[10px] text-blue-500 hover:text-blue-600 font-medium"
            >
              {selectedFiles.size === allFiles.length ? 'Deselect All' : 'Select All'}
            </button>
            <span className="text-[10px] text-gray-400">
              {selectedFiles.size}/{allFiles.length} selected
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(grouped).map(([group, files]) => (
              <div key={group}>
                <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  {group}
                </div>
                <div className="space-y-0.5">
                  {files.map((file) => {
                    const filename = file.split('/').pop() || file;
                    return (
                      <label
                        key={file}
                        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(file)}
                          onChange={() => toggleFile(file)}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300 font-mono">
                          {filename}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            {hasSettings && (
              <div>
                <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Settings
                </div>
                <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                  Settings will be merged into your existing settings.json
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Overwrite existing files
              </span>
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() => onInstall(Array.from(selectedFiles), overwrite)}
              disabled={selectedFiles.size === 0}
              className="px-4 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-md transition-colors"
            >
              Install {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
