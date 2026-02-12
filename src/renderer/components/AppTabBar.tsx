import { AppView, ToolModule } from '../../shared/types';

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
    <div className="h-9 titlebar-drag bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center">
      {/* Spacer for macOS traffic lights */}
      <div className="w-[78px] flex-shrink-0" />

      {/* Tab buttons */}
      <div className="flex items-center gap-0.5 titlebar-no-drag">
        {/* Context Files tab (always shown) */}
        <TabButton
          label="Context Files"
          icon="📄"
          isActive={activeView === 'context-files'}
          onClick={() => onTabSelect('context-files')}
        />

        {/* Tool module tabs (shown when detected) */}
        {toolModules.map((mod) => (
          <TabButton
            key={mod.id}
            label={mod.name}
            icon={mod.icon}
            color={mod.color}
            isActive={activeView === 'tool-module' && activeModuleId === mod.id}
            onClick={() => onTabSelect('tool-module', mod.id)}
          />
        ))}

        {/* Starter Packs tab */}
        <TabButton
          label="Starter Packs"
          icon="📦"
          isActive={activeView === 'starter-packs'}
          onClick={() => onTabSelect('starter-packs')}
        />
      </div>
    </div>
  );
}

interface TabButtonProps {
  label: string;
  icon: string;
  color?: string;
  isActive: boolean;
  onClick: () => void;
}

function TabButton({ label, icon, isActive, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1 text-xs font-medium rounded-md transition-colors
        ${
          isActive
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
        }
      `}
    >
      <span className="mr-1">{icon}</span>
      {label}
    </button>
  );
}
