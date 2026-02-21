import { AppView, ToolModule } from '../../shared/types';
import { ToolIcon } from './ToolIcon';

interface AppTabBarProps {
  activeView: AppView;
  activeModuleId: string | null;
  toolModules: ToolModule[];
  onTabSelect: (view: AppView, moduleId?: string) => void;
}

export function AppTabBar({
  activeView,
  activeModuleId,
  toolModules,
  onTabSelect,
}: AppTabBarProps) {
  return (
    <div className="h-9 titlebar-drag bg-light-surface dark:bg-surface-card border-b border-light-border dark:border-surface-border flex items-center">
      {/* Spacer for macOS traffic lights */}
      <div className="w-[78px] flex-shrink-0" />

      {/* Tab buttons */}
      <div className="flex items-center gap-0.5 titlebar-no-drag">
        {/* Context Files tab (always shown) */}
        <TabButton
          label="Context Files"
          iconId="document"
          isActive={activeView === 'context-files'}
          onClick={() => onTabSelect('context-files')}
        />

        {/* Tool module tabs */}
        {toolModules.map((mod) => (
          <TabButton
            key={mod.id}
            label={mod.name}
            toolId={mod.id}
            color={mod.color}
            isActive={activeView === 'tool-module' && activeModuleId === mod.id}
            onClick={() => onTabSelect('tool-module', mod.id)}
            dimmed={!mod.detected}
          />
        ))}

        {/* Starter Packs tab */}
        <TabButton
          label="Starter Packs"
          iconId="package"
          isActive={activeView === 'starter-packs'}
          onClick={() => onTabSelect('starter-packs')}
        />
      </div>
    </div>
  );
}

interface TabButtonProps {
  label: string;
  iconId?: string;
  toolId?: string;
  color?: string;
  isActive: boolean;
  onClick: () => void;
  dimmed?: boolean;
}

function TabButton({ label, iconId, toolId, isActive, onClick, dimmed }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center
        ${
          isActive
            ? 'bg-light-bg dark:bg-surface-hover text-gray-900 dark:text-content-primary shadow-sm'
            : dimmed
              ? 'text-content-tertiary dark:text-surface-border hover:text-gray-500 dark:hover:text-content-tertiary hover:bg-light-surface dark:hover:bg-surface-hover/50'
              : 'text-content-tertiary hover:text-gray-700 dark:hover:text-content-secondary hover:bg-light-surface dark:hover:bg-surface-hover/50'
        }
      `}
    >
      <span className={`mr-1 ${dimmed ? 'opacity-50' : ''}`}>
        <ToolIcon toolId={toolId || iconId || 'document'} size={14} />
      </span>
      {label}
    </button>
  );
}
