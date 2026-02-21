import { useState, useEffect, useCallback } from 'react';
import { ConfigItem } from '../../../shared/types';
import { ToolIcon } from '../../components/ToolIcon';

interface ClaudeAgentsAreaProps {
  isDark: boolean;
}

export function ClaudeAgentsArea({ isDark }: ClaudeAgentsAreaProps) {
  const [agents, setAgents] = useState<ConfigItem[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<ConfigItem | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAgents = useCallback(async () => {
    try {
      const [items, depts] = await Promise.all([
        window.electronAPI.getModuleConfigItems('claude', 'agents'),
        window.electronAPI.claudeGetDepartments(),
      ]);
      setAgents(items);
      setDepartments(depts);
      if (depts.length > 0 && !selectedDepartment) {
        setSelectedDepartment(depts[0]);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredAgents = selectedDepartment
    ? agents.filter((a) => (a.metadata.department as string) === selectedDepartment)
    : agents;

  const uncategorizedAgents = agents.filter(
    (a) => (a.metadata.department as string) === 'uncategorized'
  );

  if (agents.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 dark:text-content-tertiary">
        <div className="text-center max-w-sm">
          <div className="mb-3"><ToolIcon toolId="robot" size={40} /></div>
          <div className="text-lg font-medium mb-2">No Agents Found</div>
          <div className="text-sm">
            Agent definitions live in <code className="bg-light-surface dark:bg-surface-hover px-1.5 py-0.5 rounded text-xs">~/.claude/agents/</code>
          </div>
          <div className="text-sm mt-1">
            Organize agents into department subdirectories.
          </div>
          <button
            onClick={handleCreateAgent}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
          >
            Create First Agent
          </button>
        </div>
      </div>
    );
  }

  async function handleCreateAgent() {
    const dept = prompt('Department name (e.g., engineering, design):');
    if (!dept) return;
    const name = prompt('Agent name (e.g., frontend-developer):');
    if (!name) return;
    const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
    const safeDept = dept.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
    const template = `---
name: "${name}"
description: "Describe what this agent does"
---

# ${name}

Add agent instructions here.
`;
    try {
      await window.electronAPI.claudeCreateAgent(safeDept, safeName, template);
      await loadAgents();
      setSelectedDepartment(safeDept);
    } catch (error) {
      console.error('Failed to create agent:', error);
      alert(error instanceof Error ? error.message : 'Failed to create agent');
    }
  }

  async function handleSave() {
    if (!selectedAgent) return;
    const textarea = document.querySelector('[data-agent-editor]') as HTMLTextAreaElement;
    if (!textarea) return;
    try {
      await window.electronAPI.claudeWriteAgent(selectedAgent.path, textarea.value);
      await loadAgents();
    } catch (error) {
      console.error('Failed to save agent:', error);
    }
  }

  async function handleDelete(agent: ConfigItem) {
    if (!confirm(`Delete agent "${agent.name}"?`)) return;
    try {
      await window.electronAPI.claudeDeleteAgent(agent.path);
      if (selectedAgent?.id === agent.id) {
        setSelectedAgent(null);
      }
      await loadAgents();
    } catch (error) {
      console.error('Failed to delete agent:', error);
    }
  }

  return (
    <div className="flex h-full">
      {/* Department + agent list */}
      <div className="w-64 flex-shrink-0 border-r border-light-border dark:border-surface-border flex flex-col">
        <div className="p-3 border-b border-light-border dark:border-surface-border flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 dark:text-content-tertiary uppercase tracking-wider">
            Agents ({agents.length})
          </span>
          <button
            onClick={handleCreateAgent}
            className="text-xs text-blue-500 hover:text-blue-600 font-medium"
          >
            + New
          </button>
        </div>

        {/* Department filter */}
        {departments.length > 0 && (
          <div className="p-2 border-b border-light-border dark:border-surface-border">
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setSelectedDepartment(null)}
                className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                  selectedDepartment === null
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-500 dark:text-content-tertiary hover:bg-light-surface dark:hover:bg-surface-hover/50'
                }`}
              >
                All
              </button>
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`text-[10px] px-2 py-0.5 rounded-full transition-colors capitalize ${
                    selectedDepartment === dept
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-gray-500 dark:text-content-tertiary hover:bg-light-surface dark:hover:bg-surface-hover/50'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Agent list */}
        <div className="flex-1 overflow-y-auto">
          {(selectedDepartment === null ? agents : filteredAgents).map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className={`
                w-full text-left px-3 py-2.5 border-b border-light-surface dark:border-surface-border/50 transition-colors
                ${
                  selectedAgent?.id === agent.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500'
                    : 'hover:bg-light-surface dark:hover:bg-surface-hover/30 border-l-2 border-l-transparent'
                }
              `}
            >
              <div className="flex items-center gap-2">
                {agent.metadata.color && (
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: agent.metadata.color as string }}
                  />
                )}
                <span className="text-sm font-medium text-gray-900 dark:text-content-primary truncate">
                  {agent.name}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-content-tertiary ml-auto flex-shrink-0">
                  {agent.tokens.toLocaleString()} tok
                </span>
              </div>
              {agent.metadata.description && (
                <div className="text-[10px] text-gray-500 dark:text-content-tertiary truncate mt-0.5 ml-4">
                  {agent.metadata.description as string}
                </div>
              )}
              <div className="flex items-center gap-1 mt-0.5 ml-4">
                <span className="text-[10px] text-gray-400 dark:text-content-tertiary capitalize">
                  {agent.metadata.department as string}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedAgent ? (
          <>
            {/* Header */}
            <div className="p-3 border-b border-light-border dark:border-surface-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedAgent.metadata.color && (
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedAgent.metadata.color as string }}
                  />
                )}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-content-primary">
                    {selectedAgent.name}
                  </h3>
                  {selectedAgent.metadata.description && (
                    <div className="text-xs text-gray-500 dark:text-content-tertiary">
                      {selectedAgent.metadata.description as string}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="px-3 py-1 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => handleDelete(selectedAgent)}
                  className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Tools badges */}
            {((selectedAgent.metadata.tools as string[]) || []).length > 0 && (
              <div className="px-3 py-2 bg-light-surface dark:bg-surface-card/50 border-b border-light-border dark:border-surface-border">
                <div className="text-[10px] font-semibold text-gray-500 dark:text-content-tertiary uppercase tracking-wider mb-1">
                  Tools
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {((selectedAgent.metadata.tools as string[]) || []).map((tool, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 bg-light-bg dark:bg-surface-hover text-gray-600 dark:text-content-secondary rounded-full border border-light-border dark:border-surface-border"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Textarea editor */}
            <textarea
              data-agent-editor
              defaultValue={selectedAgent.content}
              key={selectedAgent.id}
              className="flex-1 w-full p-4 font-mono text-sm bg-light-bg dark:bg-surface-bg text-gray-900 dark:text-content-primary resize-none focus:outline-none"
              spellCheck={false}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-content-tertiary">
            <div className="text-center">
              <div className="mb-2"><ToolIcon toolId="robot" size={30} /></div>
              <div className="text-sm">Select an agent to edit</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
