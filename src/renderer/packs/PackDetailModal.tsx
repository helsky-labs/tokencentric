import { useMemo, useState } from 'react';
import { StarterPackMeta } from '@shared/builtinPacks';
import { parsePackContents, ParsedCommand } from '@shared/packUtils';
import { Modal } from '../components/Modal';
import { ToolIcon } from '../components/ToolIcon';

interface PackDetailModalProps {
  packMeta: StarterPackMeta;
  onClose: () => void;
  onInstall: (packMeta: StarterPackMeta) => void;
}

function CommandPromptBlock({ content }: { content: string }) {
  // Strip the title line (first # heading) and trim
  const body = content.replace(/^#\s+.+\n+/, '').trim();
  if (!body) return null;

  return (
    <pre className="mt-1.5 p-2 rounded bg-light-bg dark:bg-surface-card text-[11px] text-gray-600 dark:text-content-tertiary leading-relaxed whitespace-pre-wrap font-mono max-h-40 overflow-y-auto border border-light-border dark:border-surface-border">
      {body}
    </pre>
  );
}

function ExpandableCommand({ cmd }: { cmd: ParsedCommand }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-md bg-light-surface dark:bg-surface-hover/50 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex gap-2 p-2 w-full text-left hover:bg-light-bg/50 dark:hover:bg-surface-card/30 transition-colors"
      >
        <div className="mt-0.5 text-amber-500 dark:text-amber-400 shrink-0">
          <ToolIcon toolId="bolt" size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-gray-900 dark:text-content-primary">
            /{cmd.slug}
            {cmd.title !== cmd.slug && (
              <span className="ml-1.5 font-normal text-gray-500 dark:text-content-tertiary">
                - {cmd.title}
              </span>
            )}
          </div>
          {!expanded && cmd.summary && (
            <div className="text-[11px] text-gray-500 dark:text-content-tertiary mt-0.5 line-clamp-1">
              {cmd.summary}
            </div>
          )}
        </div>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 dark:text-content-tertiary shrink-0 mt-0.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="px-2 pb-2">
          <CommandPromptBlock content={cmd.rawContent} />
          {cmd.stepCount > 0 && (
            <div className="text-[10px] text-gray-400 dark:text-content-tertiary mt-1.5 px-1">
              {cmd.stepCount} steps
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PackDetailModal({ packMeta, onClose, onInstall }: PackDetailModalProps) {
  const { pack } = packMeta;
  const parsed = useMemo(() => parsePackContents(pack), [pack]);
  const toolIds = Object.keys(pack.tools);

  function handleInstall() {
    onInstall(packMeta);
    onClose();
  }

  return (
    <Modal isOpen onClose={onClose} title={pack.name} width="xl">
      <div className="flex flex-col gap-4">
        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-gray-400 dark:text-content-tertiary">
            v{pack.version}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-content-tertiary">
            by {pack.author}
          </span>
          {packMeta.builtin && (
            <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">
              Built-in
            </span>
          )}
          {toolIds.map((toolId) => (
            <span
              key={toolId}
              className="text-[10px] px-2 py-0.5 rounded-full bg-light-surface dark:bg-surface-hover text-gray-600 dark:text-content-secondary capitalize"
            >
              {toolId}
            </span>
          ))}
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 dark:text-content-secondary leading-relaxed">
          {pack.description}
        </p>

        {/* Scrollable content sections */}
        <div className="max-h-[60vh] overflow-y-auto -mx-4 px-4 space-y-4">
          {/* Commands section */}
          {parsed.commands.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-content-tertiary">
                  Commands ({parsed.commands.length})
                </div>
                <div className="flex-1 border-t border-light-border dark:border-surface-border" />
              </div>
              <div className="space-y-1.5">
                {parsed.commands.map((cmd) => (
                  <ExpandableCommand key={cmd.slug} cmd={cmd} />
                ))}
              </div>
            </div>
          )}

          {/* Agents section */}
          {parsed.agents.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-content-tertiary">
                  Agents ({parsed.agents.length})
                </div>
                <div className="flex-1 border-t border-light-border dark:border-surface-border" />
              </div>
              <div className="space-y-1.5">
                {parsed.agents.map((agent) => (
                  <div
                    key={agent.name}
                    className="p-2 rounded-md bg-light-surface dark:bg-surface-hover/50"
                  >
                    <div className="flex gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                        style={{ backgroundColor: agent.color || '#6B7280' }}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-gray-900 dark:text-content-primary">
                          {agent.name}
                        </div>
                        {agent.description && (
                          <div className="text-[11px] text-gray-500 dark:text-content-tertiary mt-0.5">
                            {agent.description}
                          </div>
                        )}
                        {agent.tools.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {agent.tools.map((tool) => (
                              <span
                                key={tool}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-light-bg dark:bg-surface-card text-gray-500 dark:text-content-tertiary"
                              >
                                {tool}
                              </span>
                            ))}
                          </div>
                        )}
                        {agent.capabilities.length > 0 && (
                          <ul className="mt-1.5 space-y-0.5">
                            {agent.capabilities.map((cap) => (
                              <li key={cap} className="text-[11px] text-gray-500 dark:text-content-tertiary flex gap-1.5">
                                <span className="text-gray-400 shrink-0">-</span>
                                {cap}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings section */}
          {parsed.settings && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-content-tertiary">
                  Settings
                </div>
                <div className="flex-1 border-t border-light-border dark:border-surface-border" />
              </div>
              <div className="p-2 rounded-md bg-light-surface dark:bg-surface-hover/50">
                <div className="flex gap-2 items-start">
                  <div className="mt-0.5 text-gray-400 dark:text-content-tertiary shrink-0">
                    <ToolIcon toolId="gear" size={14} />
                  </div>
                  <div className="text-xs text-gray-600 dark:text-content-secondary">
                    {parsed.settings.hookEvents.length > 0 && (
                      <div>
                        {parsed.settings.hookCommands.length} hook{parsed.settings.hookCommands.length !== 1 ? 's' : ''} on{' '}
                        &ldquo;{parsed.settings.hookEvents.join(', ')}&rdquo; event{parsed.settings.hookEvents.length !== 1 ? 's' : ''}
                      </div>
                    )}
                    {parsed.settings.hookCommands.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {parsed.settings.hookCommands.map((cmd) => (
                          <code key={cmd} className="block text-[11px] px-1.5 py-0.5 rounded bg-light-bg dark:bg-surface-card text-gray-500 dark:text-content-tertiary font-mono">
                            {cmd}
                          </code>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-light-border dark:border-surface-border">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-content-tertiary border border-light-border dark:border-surface-border hover:bg-light-surface dark:hover:bg-surface-hover rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleInstall}
            className="px-4 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
          >
            Install Pack
          </button>
        </div>
      </div>
    </Modal>
  );
}
