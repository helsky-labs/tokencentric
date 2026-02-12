import { ToolModule } from '../../../shared/types';

export const claudeModule: ToolModule = {
  id: 'claude',
  name: 'Claude Code',
  icon: '🟠',
  color: '#D97706',
  detected: false, // Will be updated by IPC detection
  configAreas: [
    {
      id: 'commands',
      name: 'Commands',
      description: 'Custom slash commands for Claude Code',
      type: 'file-list',
      icon: '⚡',
    },
    {
      id: 'agents',
      name: 'Agents',
      description: 'Agent definitions organized by department',
      type: 'file-list',
      icon: '🤖',
    },
    {
      id: 'settings',
      name: 'Settings & Config',
      description: 'Settings, hooks, permissions, MCP servers',
      type: 'dashboard',
      icon: '⚙️',
    },
  ],
};
