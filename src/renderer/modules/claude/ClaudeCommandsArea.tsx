import { useState, useEffect, useCallback } from 'react';
import { ConfigItem } from '../../../shared/types';
import { ToolIcon } from '../../components/ToolIcon';

interface ClaudeCommandsAreaProps {
  isDark: boolean;
}

export function ClaudeCommandsArea({ isDark }: ClaudeCommandsAreaProps) {
  const [commands, setCommands] = useState<ConfigItem[]>([]);
  const [selectedCommand, setSelectedCommand] = useState<ConfigItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadCommands = useCallback(async () => {
    try {
      const items = await window.electronAPI.getModuleConfigItems('claude', 'commands');
      setCommands(items);
      if (items.length > 0 && !selectedCommand) {
        setSelectedCommand(items[0]);
      }
    } catch (error) {
      console.error('Failed to load commands:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCommands();
  }, [loadCommands]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (commands.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 dark:text-content-tertiary">
        <div className="text-center max-w-sm">
          <div className="mb-3"><ToolIcon toolId="bolt" size={40} /></div>
          <div className="text-lg font-medium mb-2">No Commands Found</div>
          <div className="text-sm">
            Custom slash commands live in <code className="bg-light-surface dark:bg-surface-hover px-1.5 py-0.5 rounded text-xs">~/.claude/commands/</code>
          </div>
          <div className="text-sm mt-1">
            Create a <code className="bg-light-surface dark:bg-surface-hover px-1.5 py-0.5 rounded text-xs">.md</code> file to add a command.
          </div>
          <button
            onClick={handleCreateCommand}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
          >
            Create First Command
          </button>
        </div>
      </div>
    );
  }

  async function handleCreateCommand() {
    const name = prompt('Command name (becomes /name):');
    if (!name) return;
    const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
    const template = `# ${name}\n\nDescribe what this command does.\n\n## Instructions\n\nAdd your instructions here.\n`;
    try {
      await window.electronAPI.claudeCreateCommand(safeName, template);
      await loadCommands();
    } catch (error) {
      console.error('Failed to create command:', error);
      alert(error instanceof Error ? error.message : 'Failed to create command');
    }
  }

  async function handleSave() {
    if (!selectedCommand) return;
    const textarea = document.querySelector('[data-command-editor]') as HTMLTextAreaElement;
    if (!textarea) return;
    try {
      await window.electronAPI.claudeWriteCommand(selectedCommand.path, textarea.value);
      await loadCommands();
    } catch (error) {
      console.error('Failed to save command:', error);
    }
  }

  async function handleDelete(cmd: ConfigItem) {
    if (!confirm(`Delete command "${cmd.name}"?`)) return;
    try {
      await window.electronAPI.claudeDeleteCommand(cmd.path);
      if (selectedCommand?.id === cmd.id) {
        setSelectedCommand(null);
      }
      await loadCommands();
    } catch (error) {
      console.error('Failed to delete command:', error);
    }
  }

  return (
    <div className="flex h-full">
      {/* Command list */}
      <div className="w-64 flex-shrink-0 border-r border-light-border dark:border-surface-border flex flex-col">
        <div className="p-3 border-b border-light-border dark:border-surface-border flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 dark:text-content-tertiary uppercase tracking-wider">
            Commands ({commands.length})
          </span>
          <button
            onClick={handleCreateCommand}
            className="text-xs text-blue-500 hover:text-blue-600 font-medium"
          >
            + New
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {commands.map((cmd) => (
            <button
              key={cmd.id}
              onClick={() => setSelectedCommand(cmd)}
              className={`
                w-full text-left px-3 py-2.5 border-b border-light-surface dark:border-surface-border/50 transition-colors
                ${
                  selectedCommand?.id === cmd.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500'
                    : 'hover:bg-light-surface dark:hover:bg-surface-hover/30 border-l-2 border-l-transparent'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-content-primary truncate">
                  {cmd.name}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-content-tertiary ml-2 flex-shrink-0">
                  {cmd.tokens.toLocaleString()} tok
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <code className="text-[10px] text-amber-600 dark:text-amber-400">
                  {(cmd.metadata.slashCommand as string) || ''}
                </code>
                {(cmd.metadata.phaseCount as number) > 0 && (
                  <span className="text-[10px] text-gray-400 dark:text-content-tertiary">
                    {cmd.metadata.phaseCount as number} phases
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedCommand ? (
          <>
            {/* Header */}
            <div className="p-3 border-b border-light-border dark:border-surface-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-content-primary">
                  {selectedCommand.name}
                </h3>
                <code className="text-xs text-amber-600 dark:text-amber-400">
                  {(selectedCommand.metadata.slashCommand as string) || ''}
                </code>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="px-3 py-1 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => handleDelete(selectedCommand)}
                  className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Phase outline */}
            {((selectedCommand.metadata.phases as string[]) || []).length > 0 && (
              <div className="px-3 py-2 bg-light-surface dark:bg-surface-card/50 border-b border-light-border dark:border-surface-border">
                <div className="text-[10px] font-semibold text-gray-500 dark:text-content-tertiary uppercase tracking-wider mb-1">
                  Phases
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {((selectedCommand.metadata.phases as string[]) || []).map((phase, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 bg-light-bg dark:bg-surface-hover text-gray-600 dark:text-content-secondary rounded-full border border-light-border dark:border-surface-border"
                    >
                      {i + 1}. {phase}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Textarea editor */}
            <textarea
              data-command-editor
              defaultValue={selectedCommand.content}
              key={selectedCommand.id}
              className="flex-1 w-full p-4 font-mono text-sm bg-light-bg dark:bg-surface-bg text-gray-900 dark:text-content-primary resize-none focus:outline-none"
              spellCheck={false}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-content-tertiary">
            <div className="text-center">
              <div className="mb-2"><ToolIcon toolId="bolt" size={30} /></div>
              <div className="text-sm">Select a command to edit</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
