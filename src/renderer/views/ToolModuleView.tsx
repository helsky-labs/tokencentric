import { useState, useEffect } from 'react';
import { ToolModule, ConfigArea, ConfigItem } from '../../shared/types';
import { ClaudeCommandsArea } from '../modules/claude/ClaudeCommandsArea';
import { ClaudeAgentsArea } from '../modules/claude/ClaudeAgentsArea';

interface ToolModuleViewProps {
  module: ToolModule;
  isDark: boolean;
}

export function ToolModuleView({ module, isDark }: ToolModuleViewProps) {
  const [activeAreaId, setActiveAreaId] = useState<string>(
    module.configAreas[0]?.id || ''
  );

  const activeArea = module.configAreas.find((a) => a.id === activeAreaId) || null;

  return (
    <>
      <div className="flex-1 flex overflow-hidden">
        {/* Module sidebar */}
        <div className="w-52 flex-shrink-0 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-lg">{module.icon}</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {module.name}
              </span>
            </div>
          </div>

          <nav className="flex-1 p-2 space-y-0.5">
            {module.configAreas.map((area) => (
              <button
                key={area.id}
                onClick={() => setActiveAreaId(area.id)}
                className={`
                  w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left
                  ${
                    activeAreaId === area.id
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100'
                  }
                `}
              >
                <span>{area.icon}</span>
                <span>{area.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Config area content */}
        <div className="flex-1 overflow-hidden">
          {activeArea && (
            <ModuleAreaContent
              moduleId={module.id}
              area={activeArea}
              isDark={isDark}
            />
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="h-6 flex-shrink-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center px-3">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          {module.icon} {module.name} &middot; {activeArea?.name || ''}
        </span>
      </div>
    </>
  );
}

interface ModuleAreaContentProps {
  moduleId: string;
  area: ConfigArea;
  isDark: boolean;
}

function ModuleAreaContent({ moduleId, area, isDark }: ModuleAreaContentProps) {
  // Route to the correct component based on module + area
  if (moduleId === 'claude') {
    if (area.id === 'commands') {
      return <ClaudeCommandsArea isDark={isDark} />;
    }
    if (area.id === 'agents') {
      return <ClaudeAgentsArea isDark={isDark} />;
    }
    if (area.id === 'settings') {
      return (
        <div className="flex-1 flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-3">⚙️</div>
            <div className="text-lg font-medium">Settings & Config</div>
            <div className="text-sm mt-1">Coming in Phase 4</div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
      <div className="text-center">
        <div className="text-4xl mb-3">{area.icon}</div>
        <div className="text-lg font-medium">{area.name}</div>
        <div className="text-sm mt-1">Not yet implemented</div>
      </div>
    </div>
  );
}
