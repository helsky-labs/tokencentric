import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { AppSettings, ToolProfile } from '../../shared/types';

interface NewFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFile: (dirPath: string, fileName: string, toolId: string) => void;
  settings: AppSettings | null;
}

// Default file names for each tool
const toolDefaultFiles: Record<string, string> = {
  claude: 'CLAUDE.md',
  cursor: '.cursorrules',
  github_copilot: '.github/copilot-instructions.md',
  windsurf: '.windsurfrules',
  cline: '.clinerules',
  aider: '.aider.conf.yml',
  codex: 'AGENTS.md',
  continue: '.continuerules',
};

export function NewFileDialog({ isOpen, onClose, onCreateFile, settings }: NewFileDialogProps) {
  const [dirPath, setDirPath] = useState('');
  const [selectedTool, setSelectedTool] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  // Get enabled tools from settings
  const enabledTools = settings?.toolProfiles.filter((t) => t.enabled) || [];

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setDirPath('');
      setSelectedTool(enabledTools[0]?.id || '');
      setFileName(enabledTools[0] ? toolDefaultFiles[enabledTools[0].id] || '' : '');
      setError('');
    }
  }, [isOpen]);

  // Update filename when tool changes
  useEffect(() => {
    if (selectedTool) {
      setFileName(toolDefaultFiles[selectedTool] || '');
    }
  }, [selectedTool]);

  const handleSelectDirectory = async () => {
    const path = await window.electronAPI.selectDirectory();
    if (path) {
      setDirPath(path);
      setError('');
    }
  };

  const handleCreate = () => {
    if (!dirPath) {
      setError('Please select a directory');
      return;
    }
    if (!fileName.trim()) {
      setError('Please enter a file name');
      return;
    }
    if (!selectedTool) {
      setError('Please select a tool');
      return;
    }

    onCreateFile(dirPath, fileName.trim(), selectedTool);
  };

  const fullPath = dirPath && fileName ? `${dirPath}/${fileName}` : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Context File" width="md">
      <div className="space-y-4">
        {/* Directory selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Location
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={dirPath}
              readOnly
              placeholder="Select a directory..."
              className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300"
            />
            <button
              onClick={handleSelectDirectory}
              className="px-3 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
            >
              Browse
            </button>
          </div>
        </div>

        {/* Tool selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tool
          </label>
          <select
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300"
          >
            {enabledTools.map((tool) => (
              <option key={tool.id} value={tool.id}>
                {tool.icon} {tool.name}
              </option>
            ))}
          </select>
        </div>

        {/* File name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            File Name
          </label>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300"
          />
        </div>

        {/* Full path preview */}
        {fullPath && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3 border border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Full path:</div>
            <div className="text-sm font-mono text-gray-700 dark:text-gray-300 break-all">
              {fullPath}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
          >
            Create
          </button>
        </div>
      </div>
    </Modal>
  );
}
