interface ToolBadgeProps {
  toolId: string;
  size?: 'sm' | 'md';
}

// Tool badge configuration: initial, light bg, dark bg, text color
const toolBadgeConfig: Record<string, { initial: string; lightBg: string; darkBg: string; lightText: string; darkText: string }> = {
  claude: {
    initial: 'C',
    lightBg: 'bg-orange-100',
    darkBg: 'dark:bg-orange-800/60',
    lightText: 'text-orange-700',
    darkText: 'dark:text-orange-300',
  },
  cursor: {
    initial: 'Cu',
    lightBg: 'bg-blue-100',
    darkBg: 'dark:bg-blue-800/60',
    lightText: 'text-blue-700',
    darkText: 'dark:text-blue-300',
  },
  copilot: {
    initial: 'GH',
    lightBg: 'bg-indigo-100',
    darkBg: 'dark:bg-indigo-800/60',
    lightText: 'text-indigo-700',
    darkText: 'dark:text-indigo-300',
  },
  windsurf: {
    initial: 'W',
    lightBg: 'bg-sky-100',
    darkBg: 'dark:bg-sky-800/60',
    lightText: 'text-sky-700',
    darkText: 'dark:text-sky-300',
  },
  openai: {
    initial: 'AI',
    lightBg: 'bg-emerald-100',
    darkBg: 'dark:bg-emerald-800/60',
    lightText: 'text-emerald-700',
    darkText: 'dark:text-emerald-300',
  },
};

const defaultConfig = {
  initial: '?',
  lightBg: 'bg-gray-100',
  darkBg: 'dark:bg-gray-800',
  lightText: 'text-gray-600',
  darkText: 'dark:text-gray-400',
};

export function ToolBadge({ toolId, size = 'sm' }: ToolBadgeProps) {
  const config = toolBadgeConfig[toolId] || defaultConfig;

  const sizeClasses = size === 'sm' ? 'w-5 h-5 text-xs' : 'w-6 h-6 text-sm';

  return (
    <span
      className={`${sizeClasses} rounded flex items-center justify-center font-bold flex-shrink-0
        ${config.lightBg} ${config.darkBg} ${config.lightText} ${config.darkText}`}
    >
      {config.initial}
    </span>
  );
}
