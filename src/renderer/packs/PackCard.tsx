import { useMemo } from 'react';
import { StarterPackMeta } from '@shared/builtinPacks';
import { parsePackContents } from '@shared/packUtils';
import { ToolIcon } from '../components/ToolIcon';

interface PackCardProps {
  packMeta: StarterPackMeta;
  onInstall: (packMeta: StarterPackMeta) => void;
  onViewDetails: (packMeta: StarterPackMeta) => void;
}

export function PackCard({ packMeta, onInstall, onViewDetails }: PackCardProps) {
  const { pack, builtin } = packMeta;
  const parsed = useMemo(() => parsePackContents(pack), [pack]);
  const toolIds = Object.keys(pack.tools);

  // Build preview chips (first 3 items + overflow)
  const previewItems: string[] = [
    ...parsed.commands.map((c) => `/${c.slug}`),
    ...parsed.agents.map((a) => a.name),
  ];
  const visibleChips = previewItems.slice(0, 3);
  const overflowCount = previewItems.length - visibleChips.length;

  return (
    <div
      onClick={() => onViewDetails(packMeta)}
      className="rounded-lg border border-light-border dark:border-surface-border bg-light-bg dark:bg-surface-card/50 hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer group flex flex-col"
    >
      <div className="p-4 flex flex-col flex-1">
        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-900 dark:text-content-primary leading-snug mb-1">
          {pack.name}
        </h3>

        {/* Meta row */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
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
          {toolIds.map((toolId) => (
            <span
              key={toolId}
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-light-surface dark:bg-surface-hover text-gray-600 dark:text-content-secondary capitalize"
            >
              {toolId}
            </span>
          ))}
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 dark:text-content-tertiary mb-3 line-clamp-2 leading-relaxed">
          {pack.description}
        </p>

        {/* Content summary */}
        <div className="flex items-center gap-3 mb-2 text-[11px] text-gray-500 dark:text-content-secondary">
          {parsed.commands.length > 0 && (
            <span className="flex items-center gap-1">
              <ToolIcon toolId="bolt" size={12} />
              {parsed.commands.length} Command{parsed.commands.length !== 1 ? 's' : ''}
            </span>
          )}
          {parsed.agents.length > 0 && (
            <span className="flex items-center gap-1">
              <ToolIcon toolId="robot" size={12} />
              {parsed.agents.length} Agent{parsed.agents.length !== 1 ? 's' : ''}
            </span>
          )}
          {parsed.settings && (
            <span className="flex items-center gap-1">
              <ToolIcon toolId="gear" size={12} />
              Settings
            </span>
          )}
        </div>

        {/* Preview chips */}
        {visibleChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 mb-3">
            {visibleChips.map((chip) => (
              <span
                key={chip}
                className="text-[10px] px-1.5 py-0.5 rounded bg-light-surface dark:bg-surface-hover text-gray-500 dark:text-content-tertiary"
              >
                {chip}
              </span>
            ))}
            {overflowCount > 0 && (
              <span className="text-[10px] text-gray-400 dark:text-content-tertiary">
                +{overflowCount} more
              </span>
            )}
          </div>
        )}

        {/* Spacer to push button down */}
        <div className="flex-1" />

        {/* Install button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onInstall(packMeta);
          }}
          className="w-full py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
        >
          Install
        </button>
      </div>
    </div>
  );
}
