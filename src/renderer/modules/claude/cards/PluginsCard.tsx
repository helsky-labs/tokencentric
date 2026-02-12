import { useState } from 'react';

interface PluginsCardProps {
  settings: Record<string, unknown>;
  onSave: (partial: Record<string, unknown>) => Promise<void>;
}

export function PluginsCard({ settings, onSave }: PluginsCardProps) {
  const enabledPlugins = (settings.enabledPlugins || {}) as Record<string, boolean>;
  const pluginIds = Object.keys(enabledPlugins);
  const [saving, setSaving] = useState(false);

  async function handleToggle(pluginId: string) {
    setSaving(true);
    try {
      const updated = { ...enabledPlugins, [pluginId]: !enabledPlugins[pluginId] };
      await onSave({ enabledPlugins: updated });
    } finally {
      setSaving(false);
    }
  }

  // Extract readable name from plugin ID (e.g., "swift-lsp@claude-plugins-official" -> "swift-lsp")
  function displayName(id: string): string {
    const [name] = id.split('@');
    return name;
  }

  function displaySource(id: string): string {
    const parts = id.split('@');
    return parts.length > 1 ? parts[1] : '';
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Plugins</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Enabled plugins from ~/.claude/settings.json
        </p>
      </div>
      <div className="p-4">
        {pluginIds.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500">No plugins configured.</p>
        ) : (
          <div className="space-y-3">
            {pluginIds.map((id) => (
              <div key={id} className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                    {displayName(id)}
                  </span>
                  {displaySource(id) && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-2">
                      {displaySource(id)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleToggle(id)}
                  disabled={saving}
                  className={`
                    relative w-9 h-5 rounded-full transition-colors
                    ${enabledPlugins[id]
                      ? 'bg-blue-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                    }
                  `}
                >
                  <span
                    className={`
                      absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform
                      ${enabledPlugins[id] ? 'translate-x-4' : 'translate-x-0'}
                    `}
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
