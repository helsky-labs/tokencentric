import { useState } from 'react';

interface HookEntry {
  type: string;
  command: string;
}

interface HookRule {
  matcher: string;
  hooks: HookEntry[];
}

interface HooksCardProps {
  settings: Record<string, unknown>;
  onSave: (partial: Record<string, unknown>) => Promise<void>;
}

const LIFECYCLE_EVENTS = [
  'PreToolUse',
  'PostToolUse',
  'Notification',
  'Stop',
  'SubagentStop',
] as const;

export function HooksCard({ settings, onSave }: HooksCardProps) {
  const hooks = (settings.hooks || {}) as Record<string, HookRule[]>;
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [editCommand, setEditCommand] = useState('');
  const [editMatcher, setEditMatcher] = useState('');
  const [saving, setSaving] = useState(false);

  const configuredEvents = Object.keys(hooks);

  function startAdd(event: string) {
    setEditingEvent(event);
    setEditCommand('');
    setEditMatcher('');
  }

  async function handleSaveHook() {
    if (!editingEvent || !editCommand.trim()) return;
    setSaving(true);
    try {
      const currentRules = hooks[editingEvent] || [];
      const newRule: HookRule = {
        matcher: editMatcher.trim(),
        hooks: [{ type: 'command', command: editCommand.trim() }],
      };
      const updated = {
        ...hooks,
        [editingEvent]: [...currentRules, newRule],
      };
      await onSave({ hooks: updated });
      setEditingEvent(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteHook(event: string, ruleIndex: number) {
    setSaving(true);
    try {
      const currentRules = [...(hooks[event] || [])];
      currentRules.splice(ruleIndex, 1);
      const updated = { ...hooks };
      if (currentRules.length === 0) {
        delete updated[event];
      } else {
        updated[event] = currentRules;
      }
      await onSave({ hooks: updated });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-light-border dark:border-surface-border bg-light-bg dark:bg-surface-card/50">
      <div className="px-4 py-3 border-b border-light-border dark:border-surface-border">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-content-primary">Hooks</h3>
        <p className="text-xs text-gray-500 dark:text-content-tertiary mt-0.5">
          Shell commands that run on lifecycle events
        </p>
      </div>
      <div className="p-4 space-y-4">
        {/* Configured hooks */}
        {configuredEvents.map((event) => (
          <div key={event}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-700 dark:text-content-secondary uppercase tracking-wider">
                {event}
              </span>
              <button
                onClick={() => startAdd(event)}
                className="text-[10px] text-blue-500 hover:text-blue-600 font-medium"
              >
                + Add
              </button>
            </div>
            {hooks[event].map((rule, ruleIdx) => (
              <div
                key={ruleIdx}
                className="group flex items-start gap-2 px-3 py-2 bg-light-surface dark:bg-surface-bg/50 rounded-md mb-1.5"
              >
                <div className="flex-1 min-w-0">
                  {rule.matcher && (
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 mb-0.5">
                      matcher: {rule.matcher}
                    </div>
                  )}
                  {rule.hooks.map((h, hi) => (
                    <code
                      key={hi}
                      className="text-xs text-gray-700 dark:text-content-secondary block truncate"
                    >
                      {h.command}
                    </code>
                  ))}
                </div>
                <button
                  onClick={() => handleDeleteHook(event, ruleIdx)}
                  disabled={saving}
                  className="text-[10px] text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ))}

        {/* Unconfigured events */}
        {LIFECYCLE_EVENTS.filter((e) => !configuredEvents.includes(e)).length > 0 && (
          <div>
            <div className="text-[10px] text-gray-400 dark:text-content-tertiary uppercase tracking-wider mb-1.5">
              Available Events
            </div>
            <div className="flex flex-wrap gap-1.5">
              {LIFECYCLE_EVENTS.filter((e) => !configuredEvents.includes(e)).map((event) => (
                <button
                  key={event}
                  onClick={() => startAdd(event)}
                  className="text-[10px] px-2 py-1 rounded-md border border-dashed border-light-border dark:border-surface-border text-gray-500 dark:text-content-tertiary hover:border-blue-400 hover:text-blue-500 transition-colors"
                >
                  + {event}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add/edit dialog */}
        {editingEvent && (
          <div className="border border-blue-200 dark:border-blue-800 rounded-md p-3 bg-blue-50/50 dark:bg-blue-900/20">
            <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">
              Add hook for {editingEvent}
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-gray-500 dark:text-content-tertiary block mb-0.5">
                  Matcher (optional, e.g. tool name pattern)
                </label>
                <input
                  type="text"
                  value={editMatcher}
                  onChange={(e) => setEditMatcher(e.target.value)}
                  placeholder="Leave empty to match all"
                  className="w-full text-xs px-2 py-1.5 rounded border border-light-border dark:border-surface-border bg-light-bg dark:bg-surface-card text-gray-900 dark:text-content-primary focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 dark:text-content-tertiary block mb-0.5">
                  Shell command
                </label>
                <input
                  type="text"
                  value={editCommand}
                  onChange={(e) => setEditCommand(e.target.value)}
                  placeholder="e.g., afplay /System/Library/Sounds/Blow.aiff"
                  className="w-full text-xs px-2 py-1.5 rounded border border-light-border dark:border-surface-border bg-light-bg dark:bg-surface-card text-gray-900 dark:text-content-primary font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setEditingEvent(null)}
                  className="text-xs px-3 py-1 text-gray-500 hover:text-gray-700 dark:hover:text-content-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveHook}
                  disabled={!editCommand.trim() || saving}
                  className="text-xs px-3 py-1 font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded transition-colors"
                >
                  Add Hook
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
