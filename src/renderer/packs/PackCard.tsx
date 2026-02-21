import { StarterPackMeta } from '../../../shared/builtinPacks';

interface PackCardProps {
  packMeta: StarterPackMeta;
  onInstall: (packMeta: StarterPackMeta) => void;
}

export function PackCard({ packMeta, onInstall }: PackCardProps) {
  const { pack, builtin } = packMeta;

  // Count files by type
  const fileCount = Object.values(pack.tools).reduce((sum, toolData) => {
    return sum + (toolData.configFiles?.length || 0);
  }, 0);

  const hasSettings = Object.values(pack.tools).some((t) => t.settings);
  const toolIds = Object.keys(pack.tools);

  return (
    <div className="rounded-lg border border-light-border dark:border-surface-border bg-light-bg dark:bg-surface-card/50 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-content-primary truncate">
              {pack.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-gray-400 dark:text-content-tertiary">
                v{pack.version}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-content-tertiary">
                by {pack.author}
              </span>
              {builtin && (
                <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">
                  Built-in
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 dark:text-content-tertiary mb-3 line-clamp-2">
          {pack.description}
        </p>

        {/* Tool badges + counts */}
        <div className="flex items-center gap-2 mb-3">
          {toolIds.map((toolId) => (
            <span
              key={toolId}
              className="text-[10px] px-2 py-0.5 rounded-full bg-light-surface dark:bg-surface-hover text-gray-600 dark:text-content-secondary capitalize"
            >
              {toolId}
            </span>
          ))}
          <span className="text-[10px] text-gray-400 dark:text-content-tertiary ml-auto">
            {fileCount} file{fileCount !== 1 ? 's' : ''}
            {hasSettings ? ' + settings' : ''}
          </span>
        </div>

        {/* Install button */}
        <button
          onClick={() => onInstall(packMeta)}
          className="w-full py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
        >
          Install
        </button>
      </div>
    </div>
  );
}
