import { useState, useEffect, useCallback, useMemo } from 'react';
import { ContextFile, InheritanceChainItem, AppSettings } from '../../../shared/types';
import { getInheritanceChainWithTokens, calculateTotalTokens } from '../../utils/findInheritanceChain';
import { ViewMode } from '../../store/editorStore';

interface FileInfoBarProps {
  file: ContextFile;
  allFiles: ContextFile[];
  settings: AppSettings | null;
  viewMode: ViewMode;
  isDirty: boolean;
  isReadOnly: boolean;
  isSaving: boolean;
  onSelectFile: (file: ContextFile | null) => void;
  onViewModeChange: (mode: ViewMode) => void;
}

/**
 * Format token count in compact form
 */
function formatTokens(tokens: number): string {
  if (tokens < 1000) return tokens.toString();
  if (tokens < 10000) return `${(tokens / 1000).toFixed(1)}k`;
  return `${Math.round(tokens / 1000)}k`;
}

/**
 * Get token color based on thresholds
 */
function getTokenColor(tokens: number): string {
  if (tokens < 10000) return 'text-green-600 dark:text-green-400';
  if (tokens < 50000) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

export function FileInfoBar({
  file,
  allFiles,
  settings,
  viewMode,
  isDirty,
  isReadOnly,
  isSaving,
  onSelectFile,
  onViewModeChange,
}: FileInfoBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [chain, setChain] = useState<InheritanceChainItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Detect if file is markdown
  const isMarkdown = useMemo(() => file.name.match(/\.(md|mdx|markdown)$/i), [file.name]);

  // Load inheritance chain
  useEffect(() => {
    async function loadChain() {
      setIsLoading(true);
      try {
        const profile = settings?.toolProfiles.find((p) => p.id === file.toolId);
        const tokenizer = profile?.tokenizer || 'anthropic';
        const inheritanceChain = await getInheritanceChainWithTokens(file, allFiles, tokenizer);
        setChain(inheritanceChain);
      } catch (error) {
        console.error('Failed to load inheritance chain:', error);
        setChain([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadChain();
  }, [file, allFiles, settings]);

  const totalTokens = calculateTotalTokens(chain);
  const hasInheritedFiles = chain.length > 1;
  const inheritedFileCount = chain.length - 1;

  // Handle clicking on a file in the chain
  const handleFileClick = useCallback(
    (item: InheritanceChainItem) => {
      if (item.file && !item.isCurrent) {
        onSelectFile(item.file);
      }
    },
    [onSelectFile]
  );

  return (
    <div className="file-info-bar border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
      {/* Collapsed state - single line */}
      <div
        className="file-info-bar-header flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Expand/collapse chevron */}
          <svg
            className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>

          {/* File name */}
          <span className="text-sm font-medium truncate">{file.name}</span>

          {/* Status badges */}
          {isReadOnly && (
            <span className="file-info-badge file-info-badge-readonly">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              read-only
            </span>
          )}
          {!isReadOnly && isDirty && (
            <span className="file-info-badge file-info-badge-unsaved">unsaved</span>
          )}
          {isSaving && (
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">Saving...</span>
          )}

          {/* Separator */}
          <span className="text-gray-300 dark:text-gray-600 flex-shrink-0">|</span>

          {/* Token info */}
          {isLoading ? (
            <span className="text-xs text-gray-500 dark:text-gray-400">Loading...</span>
          ) : (
            <span className={`text-xs font-medium ${getTokenColor(totalTokens)}`}>
              {formatTokens(totalTokens)} tokens
            </span>
          )}

          {/* Inheritance indicator */}
          {hasInheritedFiles && !isLoading && (
            <>
              <span className="text-gray-300 dark:text-gray-600 flex-shrink-0">|</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Inherits: {inheritedFileCount} file{inheritedFileCount > 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>

        {/* View mode toggle - only for markdown */}
        {isMarkdown && (
          <div
            className="flex items-center gap-0.5 bg-gray-200 dark:bg-gray-700 rounded p-0.5 ml-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onViewModeChange('editor')}
              className={`px-1.5 py-0.5 text-xs rounded transition-colors ${
                viewMode === 'editor'
                  ? 'bg-white dark:bg-gray-600 shadow-sm'
                  : 'hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              title="Editor only"
            >
              Edit
            </button>
            <button
              onClick={() => onViewModeChange('split')}
              className={`px-1.5 py-0.5 text-xs rounded transition-colors ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-gray-600 shadow-sm'
                  : 'hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              title="Side by side"
            >
              Split
            </button>
            <button
              onClick={() => onViewModeChange('preview')}
              className={`px-1.5 py-0.5 text-xs rounded transition-colors ${
                viewMode === 'preview'
                  ? 'bg-white dark:bg-gray-600 shadow-sm'
                  : 'hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              title="Preview only"
            >
              Preview
            </button>
          </div>
        )}
      </div>

      {/* Expanded state - full details */}
      {isExpanded && !isLoading && (
        <div className="file-info-bar-expanded px-3 pb-2 pt-1">
          {/* Inheritance chain header */}
          <div className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
            Context Inheritance Chain
          </div>

          {/* Chain items */}
          <div className="space-y-0.5">
            {chain.map((item, index) => (
              <div
                key={item.path}
                className={`flex items-center gap-2 text-xs py-1 px-2 -mx-2 rounded ${
                  item.file && !item.isCurrent
                    ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800'
                    : ''
                }`}
                onClick={() => item.file && !item.isCurrent && handleFileClick(item)}
              >
                {/* Connector */}
                <div className="flex items-center w-4 justify-center flex-shrink-0">
                  {item.isCurrent ? (
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                  )}
                </div>

                {/* File icon */}
                {item.isGlobal ? (
                  <svg
                    className="w-3.5 h-3.5 text-purple-500 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                ) : (
                  <svg
                    className={`w-3.5 h-3.5 flex-shrink-0 ${
                      item.isCurrent ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                )}

                {/* Path */}
                <span
                  className={`truncate flex-1 ${
                    item.isCurrent
                      ? 'font-medium text-gray-900 dark:text-gray-100'
                      : item.isGlobal
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-gray-600 dark:text-gray-400'
                  }`}
                  title={item.path}
                >
                  {item.displayPath}
                </span>

                {/* Tokens */}
                {item.tokens !== undefined && (
                  <span className="flex-shrink-0 font-mono text-xs text-gray-500 dark:text-gray-400">
                    {formatTokens(item.tokens)}
                  </span>
                )}

                {/* Arrow to next */}
                {index < chain.length - 1 && (
                  <span className="text-gray-300 dark:text-gray-600 flex-shrink-0">+</span>
                )}
              </div>
            ))}
          </div>

          {/* Total and model fit */}
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">
              Total context cost
            </span>
            <div className="flex items-center gap-2">
              <span className={`font-medium ${getTokenColor(totalTokens)}`}>
                {totalTokens.toLocaleString()} tokens
              </span>
              <span className="text-gray-400 dark:text-gray-500">|</span>
              {totalTokens < 50000 ? (
                <span className="text-green-600 dark:text-green-400">Fits all models</span>
              ) : totalTokens < 100000 ? (
                <span className="text-yellow-600 dark:text-yellow-400">Large context</span>
              ) : (
                <span className="text-red-600 dark:text-red-400">May exceed limits</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
