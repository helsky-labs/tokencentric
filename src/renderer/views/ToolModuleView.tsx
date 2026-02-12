import { useState, useEffect } from 'react';
import { ToolModule, ConfigArea, ConfigItem } from '../../shared/types';
import { ClaudeCommandsArea } from '../modules/claude/ClaudeCommandsArea';
import { ClaudeAgentsArea } from '../modules/claude/ClaudeAgentsArea';
import { ClaudeConfigDashboard } from '../modules/claude/ClaudeConfigDashboard';

const CLAUDE_CONTEXT_WINDOW = 200_000; // Claude's context window in tokens

interface ToolModuleViewProps {
  module: ToolModule;
  isDark: boolean;
}

export function ToolModuleView({ module, isDark }: ToolModuleViewProps) {
  const [activeAreaId, setActiveAreaId] = useState<string>(
    module.configAreas[0]?.id || ''
  );
  const [totalTokens, setTotalTokens] = useState<number | null>(null);

  const activeArea = module.configAreas.find((a) => a.id === activeAreaId) || null;

  // Load total tokens for the module
  useEffect(() => {
    async function loadTokenBudget() {
      if (module.id !== 'claude') return;
      try {
        const [commands, agents] = await Promise.all([
          window.electronAPI.getModuleConfigItems('claude', 'commands'),
          window.electronAPI.getModuleConfigItems('claude', 'agents'),
        ]);
        const total = [...commands, ...agents].reduce((sum, item) => sum + item.tokens, 0);
        setTotalTokens(total);
      } catch {
        // Ignore
      }
    }
    loadTokenBudget();
  }, [module.id]);

  const budgetPercent = totalTokens !== null ? (totalTokens / CLAUDE_CONTEXT_WINDOW) * 100 : null;

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

          {/* Token budget in sidebar */}
          {totalTokens !== null && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                Token Budget
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      budgetPercent! > 50 ? 'bg-amber-500' : budgetPercent! > 80 ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(budgetPercent!, 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                  {(totalTokens / 1000).toFixed(1)}K
                </span>
              </div>
              <div className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">
                {budgetPercent!.toFixed(1)}% of {(CLAUDE_CONTEXT_WINDOW / 1000)}K context
              </div>
            </div>
          )}
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
      <div className="h-6 flex-shrink-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between px-3">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          {module.icon} {module.name} &middot; {activeArea?.name || ''}
        </span>
        {totalTokens !== null && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {totalTokens.toLocaleString()} tokens ({budgetPercent!.toFixed(1)}% of context)
          </span>
        )}
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
      return <ClaudeConfigDashboard isDark={isDark} />;
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
      <div className="text-center">
        <div className="text-4xl mb-3">{area.icon}</div>
        <div className="text-lg font-medium">{area.name}</div>
        <div className="text-sm mt-1">Coming soon</div>
      </div>
    </div>
  );
}
