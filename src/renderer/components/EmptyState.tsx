import { Logo } from './Logo';

interface EmptyStateProps {
  onScanDirectory: () => void;
  onNewFile: () => void;
}

export function EmptyState({ onScanDirectory, onNewFile }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <div className="flex justify-center mb-6">
          <Logo size={80} />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-content-primary">
          Welcome to Tokencentric
        </h2>
        <p className="text-gray-600 dark:text-content-tertiary mb-6">
          Manage your AI coding assistant context files. Scan a directory to discover existing files,
          or create a new one from scratch.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onScanDirectory}
            className="px-6 py-3 bg-brand-teal hover:bg-brand-teal-bright text-white rounded-lg font-medium transition-colors"
          >
            Scan Directory
          </button>
          <button
            onClick={onNewFile}
            className="px-6 py-3 bg-surface-card hover:bg-surface-hover text-white rounded-lg font-medium transition-colors"
          >
            Create New File
          </button>
        </div>
        <p className="text-xs text-content-tertiary mt-6">
          Supports: Claude Code, Cursor, GitHub Copilot, Windsurf, ChatGPT/OpenAI
        </p>
      </div>
    </div>
  );
}
