import { useState } from 'react';

interface ExportDialogProps {
  onExport: (options: { name: string; description: string; includeCommands: boolean; includeAgents: boolean; includeSettings: boolean }) => void;
  onCancel: () => void;
}

export function ExportDialog({ onExport, onCancel }: ExportDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [includeCommands, setIncludeCommands] = useState(true);
  const [includeAgents, setIncludeAgents] = useState(true);
  const [includeSettings, setIncludeSettings] = useState(false);

  function handleExport() {
    if (!name.trim()) return;
    onExport({
      name: name.trim(),
      description: description.trim(),
      includeCommands,
      includeAgents,
      includeSettings,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-light-bg dark:bg-surface-card rounded-lg shadow-xl w-[420px]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-light-border dark:border-surface-border">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-content-primary">
            Export Starter Pack
          </h3>
          <p className="text-xs text-gray-500 dark:text-content-tertiary mt-0.5">
            Bundle your Claude Code config into a shareable .tcpack file
          </p>
        </div>

        <div className="p-4 space-y-4">
          {/* Pack name */}
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-content-secondary block mb-1">
              Pack Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Claude Setup"
              className="w-full text-sm px-3 py-2 rounded-md border border-light-border dark:border-surface-border bg-light-bg dark:bg-surface-card text-gray-900 dark:text-content-primary focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-content-secondary block mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's included in this pack?"
              rows={2}
              className="w-full text-sm px-3 py-2 rounded-md border border-light-border dark:border-surface-border bg-light-bg dark:bg-surface-card text-gray-900 dark:text-content-primary resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Include checkboxes */}
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-content-secondary block mb-2">
              Include
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCommands}
                  onChange={(e) => setIncludeCommands(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-light-border text-blue-500 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-700 dark:text-content-secondary">
                  Commands (~/.claude/commands/)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAgents}
                  onChange={(e) => setIncludeAgents(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-light-border text-blue-500 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-700 dark:text-content-secondary">
                  Agents (~/.claude/agents/)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSettings}
                  onChange={(e) => setIncludeSettings(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-light-border text-blue-500 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-700 dark:text-content-secondary">
                  Settings (~/.claude/settings.json)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-light-border dark:border-surface-border flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-xs text-gray-600 dark:text-content-tertiary hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={!name.trim() || (!includeCommands && !includeAgents && !includeSettings)}
            className="px-4 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-md transition-colors"
          >
            Export .tcpack
          </button>
        </div>
      </div>
    </div>
  );
}
