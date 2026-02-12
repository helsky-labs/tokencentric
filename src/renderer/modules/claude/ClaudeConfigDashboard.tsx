import { useState, useEffect, useCallback } from 'react';
import { PluginsCard } from './cards/PluginsCard';
import { HooksCard } from './cards/HooksCard';
import { PermissionsCard } from './cards/PermissionsCard';
import { MCPServersCard } from './cards/MCPServersCard';
import { KeybindingsCard } from './cards/KeybindingsCard';

interface ClaudeConfigDashboardProps {
  isDark: boolean;
}

export function ClaudeConfigDashboard({ isDark }: ClaudeConfigDashboardProps) {
  const [claudeSettings, setClaudeSettings] = useState<Record<string, unknown>>({});
  const [permissions, setPermissions] = useState<Record<string, unknown>>({});
  const [mcpServers, setMcpServers] = useState<Record<string, Record<string, unknown>>>({});
  const [keybindings, setKeybindings] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAll = useCallback(async () => {
    try {
      const [settings, perms, mcp, kb] = await Promise.all([
        window.electronAPI.claudeGetSettings(),
        window.electronAPI.claudeGetPermissions(),
        window.electronAPI.claudeGetMcpServers(),
        window.electronAPI.claudeGetKeybindings(),
      ]);
      setClaudeSettings(settings);
      setPermissions(perms);
      setMcpServers(mcp);
      setKeybindings(kb);
    } catch (error) {
      console.error('Failed to load Claude config:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Save handlers that reload after write
  const handleSaveSettings = useCallback(async (partial: Record<string, unknown>) => {
    await window.electronAPI.claudeWriteSettings(partial);
    const updated = await window.electronAPI.claudeGetSettings();
    setClaudeSettings(updated);
  }, []);

  const handleSavePermissions = useCallback(async (partial: Record<string, unknown>) => {
    await window.electronAPI.claudeWritePermissions(partial);
    const updated = await window.electronAPI.claudeGetPermissions();
    setPermissions(updated);
  }, []);

  const handleWriteMcpServer = useCallback(async (projectPath: string, serverName: string, config: Record<string, unknown>) => {
    await window.electronAPI.claudeWriteMcpServer(projectPath, serverName, config);
    const updated = await window.electronAPI.claudeGetMcpServers();
    setMcpServers(updated);
  }, []);

  const handleDeleteMcpServer = useCallback(async (projectPath: string, serverName: string) => {
    await window.electronAPI.claudeDeleteMcpServer(projectPath, serverName);
    const updated = await window.electronAPI.claudeGetMcpServers();
    setMcpServers(updated);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        {/* Header */}
        <div className="mb-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Claude Code Configuration
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Manage settings, hooks, permissions, MCP servers, and keybindings
          </p>
        </div>

        <PluginsCard settings={claudeSettings} onSave={handleSaveSettings} />
        <HooksCard settings={claudeSettings} onSave={handleSaveSettings} />
        <PermissionsCard permissions={permissions} onSave={handleSavePermissions} />
        <MCPServersCard
          servers={mcpServers}
          onWriteServer={handleWriteMcpServer}
          onDeleteServer={handleDeleteMcpServer}
        />
        <KeybindingsCard keybindings={keybindings} />
      </div>
    </div>
  );
}
