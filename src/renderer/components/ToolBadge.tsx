import { ToolIcon } from './ToolIcon';

interface ToolBadgeProps {
  toolId: string;
  size?: 'sm' | 'md';
}

const toolBadgeConfig: Record<string, { lightBg: string; darkBg: string; lightText: string; darkText: string }> = {
  claude: {
    lightBg: 'bg-orange-100',
    darkBg: 'dark:bg-orange-800/60',
    lightText: 'text-orange-700',
    darkText: 'dark:text-orange-300',
  },
  cursor: {
    lightBg: 'bg-blue-100',
    darkBg: 'dark:bg-blue-800/60',
    lightText: 'text-blue-700',
    darkText: 'dark:text-blue-300',
  },
  copilot: {
    lightBg: 'bg-indigo-100',
    darkBg: 'dark:bg-indigo-800/60',
    lightText: 'text-indigo-700',
    darkText: 'dark:text-indigo-300',
  },
  windsurf: {
    lightBg: 'bg-sky-100',
    darkBg: 'dark:bg-sky-800/60',
    lightText: 'text-sky-700',
    darkText: 'dark:text-sky-300',
  },
  openai: {
    lightBg: 'bg-brand-teal/15',
    darkBg: 'dark:bg-brand-teal-deep/60',
    lightText: 'text-brand-teal-deep',
    darkText: 'dark:text-brand-teal-bright',
  },
};

const defaultConfig = {
  lightBg: 'bg-light-surface',
  darkBg: 'dark:bg-surface-card',
  lightText: 'text-gray-600',
  darkText: 'dark:text-content-tertiary',
};

export function ToolBadge({ toolId, size = 'sm' }: ToolBadgeProps) {
  const config = toolBadgeConfig[toolId] || defaultConfig;

  const sizeClasses = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';
  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <span
      className={`${sizeClasses} rounded flex items-center justify-center flex-shrink-0
        ${config.lightBg} ${config.darkBg} ${config.lightText} ${config.darkText}`}
    >
      <ToolIcon toolId={toolId} size={iconSize} />
    </span>
  );
}
