import { useState } from 'react';

interface MCPServer {
  type?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
}

interface MCPServersCardProps {
  servers: Record<string, Record<string, unknown>>; // projectPath -> { serverName: serverConfig }
  onWriteServer: (projectPath: string, serverName: string, config: Record<string, unknown>) => Promise<void>;
  onDeleteServer: (projectPath: string, serverName: string) => Promise<void>;
}

// Shorten home dir paths for display
function shortenPath(p: string): string {
  const home = '~';
  if (p.startsWith('/Users/')) {
    const parts = p.split('/');
    return home + '/' + parts.slice(3).join('/');
  }
  return p;
}

export function MCPServersCard({ servers, onDeleteServer }: MCPServersCardProps) {
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const projectPaths = Object.keys(servers).sort((a, b) => a.localeCompare(b));
  const totalServers = projectPaths.reduce(
    (sum, p) => sum + Object.keys(servers[p]).length,
    0
  );

  async function handleDelete(projectPath: string, serverName: string) {
    if (!confirm(`Remove MCP server "${serverName}" from ${shortenPath(projectPath)}?`)) return;
    setDeleting(true);
    try {
      await onDeleteServer(projectPath, serverName);
    } finally {
      setDeleting(false);
    }
  }

  function toggleProject(projectPath: string) {
    setExpandedProject(expandedProject === projectPath ? null : projectPath);
  }

  return (
    <div className="rounded-lg border border-light-border dark:border-surface-border bg-light-bg dark:bg-surface-card/50">
      <div className="px-4 py-3 border-b border-light-border dark:border-surface-border">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-content-primary">MCP Servers</h3>
        <p className="text-xs text-gray-500 dark:text-content-tertiary mt-0.5">
          {totalServers} server{totalServers !== 1 ? 's' : ''} across {projectPaths.length} project{projectPaths.length !== 1 ? 's' : ''} in ~/.claude.json
        </p>
      </div>
      <div className="p-4">
        {projectPaths.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-content-tertiary">No MCP servers configured.</p>
        ) : (
          <div className="space-y-2">
            {projectPaths.map((projectPath) => {
              const projectServers = servers[projectPath] as Record<string, MCPServer>;
              const serverNames = Object.keys(projectServers);
              const isExpanded = expandedProject === projectPath;

              return (
                <div
                  key={projectPath}
                  className="border border-light-surface dark:border-surface-border rounded-md overflow-hidden"
                >
                  {/* Project header */}
                  <button
                    onClick={() => toggleProject(projectPath)}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-light-surface dark:bg-surface-bg/50 hover:bg-light-surface dark:hover:bg-surface-bg transition-colors text-left"
                  >
                    <span className="text-[10px] text-gray-400 transition-transform" style={{ transform: isExpanded ? 'rotate(90deg)' : '' }}>
                      ▶
                    </span>
                    <code className="text-xs text-gray-700 dark:text-content-secondary truncate flex-1 font-mono">
                      {shortenPath(projectPath)}
                    </code>
                    <span className="text-[10px] text-gray-400 dark:text-content-tertiary flex-shrink-0">
                      {serverNames.length} server{serverNames.length !== 1 ? 's' : ''}
                    </span>
                  </button>

                  {/* Server list */}
                  {isExpanded && (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                      {serverNames.map((name) => {
                        const server = projectServers[name];
                        return (
                          <div key={name} className="group px-3 py-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900 dark:text-content-primary">
                                {name}
                              </span>
                              <button
                                onClick={() => handleDelete(projectPath, name)}
                                disabled={deleting}
                                className="text-[10px] text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="space-y-0.5">
                              {server.type && (
                                <div className="text-[10px] text-gray-500 dark:text-content-tertiary">
                                  <span className="text-gray-400 dark:text-content-tertiary">type:</span>{' '}
                                  {server.type}
                                </div>
                              )}
                              {server.command && (
                                <div className="text-[10px] text-gray-500 dark:text-content-tertiary">
                                  <span className="text-gray-400 dark:text-content-tertiary">command:</span>{' '}
                                  <code className="font-mono">{server.command}</code>
                                </div>
                              )}
                              {server.args && server.args.length > 0 && (
                                <div className="text-[10px] text-gray-500 dark:text-content-tertiary">
                                  <span className="text-gray-400 dark:text-content-tertiary">args:</span>{' '}
                                  <code className="font-mono">{server.args.join(' ')}</code>
                                </div>
                              )}
                              {server.url && (
                                <div className="text-[10px] text-gray-500 dark:text-content-tertiary">
                                  <span className="text-gray-400 dark:text-content-tertiary">url:</span>{' '}
                                  <code className="font-mono">{server.url}</code>
                                </div>
                              )}
                              {server.env && Object.keys(server.env).length > 0 && (
                                <div className="text-[10px] text-gray-500 dark:text-content-tertiary">
                                  <span className="text-gray-400 dark:text-content-tertiary">env:</span>{' '}
                                  {Object.keys(server.env).join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
