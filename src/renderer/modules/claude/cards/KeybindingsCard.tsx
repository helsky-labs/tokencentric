interface KeybindingsCardProps {
  keybindings: Record<string, unknown> | null;
}

export function KeybindingsCard({ keybindings }: KeybindingsCardProps) {
  if (!keybindings) {
    return (
      <div className="rounded-lg border border-light-border dark:border-surface-border bg-light-bg dark:bg-surface-card/50">
        <div className="px-4 py-3 border-b border-light-border dark:border-surface-border">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-content-primary">Keybindings</h3>
          <p className="text-xs text-gray-500 dark:text-content-tertiary mt-0.5">
            ~/.claude/keybindings.json
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs text-gray-400 dark:text-content-tertiary">
            No custom keybindings file found. Create <code className="bg-light-surface dark:bg-surface-hover px-1 py-0.5 rounded">~/.claude/keybindings.json</code> to customize keyboard shortcuts.
          </p>
        </div>
      </div>
    );
  }

  const entries = Object.entries(keybindings);

  return (
    <div className="rounded-lg border border-light-border dark:border-surface-border bg-light-bg dark:bg-surface-card/50">
      <div className="px-4 py-3 border-b border-light-border dark:border-surface-border">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-content-primary">Keybindings</h3>
        <p className="text-xs text-gray-500 dark:text-content-tertiary mt-0.5">
          {entries.length} custom keybinding{entries.length !== 1 ? 's' : ''} from ~/.claude/keybindings.json
        </p>
      </div>
      <div className="p-4">
        {entries.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-content-tertiary">File exists but contains no keybindings.</p>
        ) : (
          <div className="space-y-1.5">
            {entries.map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between px-2 py-1.5 rounded bg-light-surface dark:bg-surface-bg/50"
              >
                <kbd className="text-xs font-mono px-2 py-0.5 bg-light-bg dark:bg-surface-card border border-light-border dark:border-surface-border rounded text-gray-700 dark:text-content-secondary shadow-sm">
                  {key}
                </kbd>
                <span className="text-xs text-gray-600 dark:text-content-tertiary">
                  {typeof value === 'string' ? value : JSON.stringify(value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
