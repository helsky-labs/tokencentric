import { useState } from 'react';

interface PermissionsCardProps {
  permissions: Record<string, unknown>;
  onSave: (partial: Record<string, unknown>) => Promise<void>;
}

interface PermissionsData {
  allow: string[];
  deny: string[];
  ask: string[];
}

// Group permissions by tool prefix: "Bash(git add:*)" -> "Bash"
function groupByTool(rules: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const rule of rules) {
    const match = rule.match(/^(\w+)/);
    const tool = match ? match[1] : 'Other';
    if (!groups[tool]) groups[tool] = [];
    groups[tool].push(rule);
  }
  // Sort groups alphabetically
  const sorted: Record<string, string[]> = {};
  for (const key of Object.keys(groups).sort()) {
    sorted[key] = groups[key].sort();
  }
  return sorted;
}

// Extract the pattern part: "Bash(git add:*)" -> "git add:*"
function extractPattern(rule: string): string {
  const match = rule.match(/^\w+\((.+)\)$/);
  return match ? match[1] : rule;
}

export function PermissionsCard({ permissions, onSave }: PermissionsCardProps) {
  const perms = (permissions.permissions || { allow: [], deny: [], ask: [] }) as PermissionsData;
  const [activeTab, setActiveTab] = useState<'allow' | 'deny' | 'ask'>('allow');
  const [adding, setAdding] = useState(false);
  const [newRule, setNewRule] = useState('');
  const [saving, setSaving] = useState(false);

  const activeList = perms[activeTab] || [];
  const grouped = groupByTool(activeList);

  async function handleAddRule() {
    if (!newRule.trim()) return;
    setSaving(true);
    try {
      const updated = { ...perms, [activeTab]: [...activeList, newRule.trim()] };
      await onSave({ permissions: updated });
      setNewRule('');
      setAdding(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveRule(rule: string) {
    setSaving(true);
    try {
      const updated = { ...perms, [activeTab]: activeList.filter((r) => r !== rule) };
      await onSave({ permissions: updated });
    } finally {
      setSaving(false);
    }
  }

  const tabs = [
    { id: 'allow' as const, label: 'Allow', count: (perms.allow || []).length, color: 'text-green-600 dark:text-green-400' },
    { id: 'deny' as const, label: 'Deny', count: (perms.deny || []).length, color: 'text-red-600 dark:text-red-400' },
    { id: 'ask' as const, label: 'Ask', count: (perms.ask || []).length, color: 'text-amber-600 dark:text-amber-400' },
  ];

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Permissions</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Tool permissions from ~/.claude/settings.local.json
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setAdding(false); }}
            className={`
              flex-1 px-3 py-2 text-xs font-medium transition-colors
              ${activeTab === tab.id
                ? `border-b-2 border-blue-500 ${tab.color}`
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }
            `}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="p-4">
        {activeList.length === 0 && !adding ? (
          <div className="text-center py-4">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
              No {activeTab} rules configured.
            </p>
            <button
              onClick={() => setAdding(true)}
              className="text-xs text-blue-500 hover:text-blue-600 font-medium"
            >
              + Add Rule
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setAdding(true)}
                className="text-[10px] text-blue-500 hover:text-blue-600 font-medium"
              >
                + Add Rule
              </button>
            </div>

            {/* Grouped rules */}
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {Object.entries(grouped).map(([tool, rules]) => (
                <div key={tool}>
                  <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    {tool} ({rules.length})
                  </div>
                  <div className="space-y-0.5">
                    {rules.map((rule) => (
                      <div
                        key={rule}
                        className="group flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-900/50"
                      >
                        <code className="text-[11px] text-gray-700 dark:text-gray-300 truncate flex-1 font-mono">
                          {extractPattern(rule)}
                        </code>
                        <button
                          onClick={() => handleRemoveRule(rule)}
                          disabled={saving}
                          className="text-[10px] text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Add rule input */}
        {adding && (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
              placeholder='e.g., Bash(npm run build:*)'
              className="flex-1 text-xs px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleAddRule}
              disabled={!newRule.trim() || saving}
              className="text-xs px-3 py-1 font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => { setAdding(false); setNewRule(''); }}
              className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
