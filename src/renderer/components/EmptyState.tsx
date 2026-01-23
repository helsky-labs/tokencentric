interface EmptyStateProps {
  onScanDirectory: () => void;
}

export function EmptyState({ onScanDirectory }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
          No context files found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Scan a directory to discover CLAUDE.md, .cursorrules, and other AI context files in your
          projects.
        </p>
        <button
          onClick={onScanDirectory}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
        >
          Scan Directory
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
          Supports: Claude Code, Cursor, GitHub Copilot, Windsurf, ChatGPT/OpenAI
        </p>
      </div>
    </div>
  );
}
