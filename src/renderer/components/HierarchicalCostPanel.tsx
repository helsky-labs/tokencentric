import { useEffect, useState, useCallback } from 'react';
import { ContextFile, InheritanceChainItem, AppSettings } from '../../shared/types';
import { getInheritanceChainWithTokens, calculateTotalTokens } from '../utils/findInheritanceChain';

interface HierarchicalCostPanelProps {
  selectedFile: ContextFile | null;
  allFiles: ContextFile[];
  settings: AppSettings | null;
  onSelectFile: (file: ContextFile | null) => void;
}

export function HierarchicalCostPanel({
  selectedFile,
  allFiles,
  settings,
  onSelectFile,
}: HierarchicalCostPanelProps) {
  const [chain, setChain] = useState<InheritanceChainItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Load inheritance chain when selected file changes
  useEffect(() => {
    async function loadChain() {
      if (!selectedFile) {
        setChain([]);
        return;
      }

      setIsLoading(true);
      try {
        const profile = settings?.toolProfiles.find((p) => p.id === selectedFile.toolId);
        const tokenizer = profile?.tokenizer || 'anthropic';
        const inheritanceChain = await getInheritanceChainWithTokens(selectedFile, allFiles, tokenizer);
        setChain(inheritanceChain);
      } catch (error) {
        console.error('Failed to load inheritance chain:', error);
        setChain([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadChain();
  }, [selectedFile, allFiles, settings]);

  const totalTokens = calculateTotalTokens(chain);
  const hasInheritedFiles = chain.length > 1;

  // Get token color based on thresholds
  const getTokenColor = useCallback((tokens: number) => {
    if (tokens < 5000) return 'text-green-600 dark:text-green-400';
    if (tokens < 20000) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  }, []);

  // Get total token color with higher thresholds
  const getTotalTokenColor = useCallback((tokens: number) => {
    if (tokens < 10000) return 'text-green-600 dark:text-green-400';
    if (tokens < 50000) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  }, []);

  // Format token count
  const formatTokens = useCallback((tokens: number) => {
    if (tokens < 1000) return tokens.toString();
    if (tokens < 10000) return `${(tokens / 1000).toFixed(1)}k`;
    return `${Math.round(tokens / 1000)}k`;
  }, []);

  // Handle clicking on a file in the chain
  const handleFileClick = useCallback(
    (item: InheritanceChainItem) => {
      if (item.file && !item.isCurrent) {
        onSelectFile(item.file);
      } else if (item.isGlobal && !item.file) {
        // For global config file, we need to create a ContextFile-like object
        // This will be handled by a special case in the parent component
      }
    },
    [onSelectFile]
  );

  if (!selectedFile || chain.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20">
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm">
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-medium text-gray-700 dark:text-gray-300">Context Cost</span>
          {hasInheritedFiles && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({chain.length} files)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <span className="text-xs text-gray-500 dark:text-gray-400">Loading...</span>
          ) : (
            <span className={`text-sm font-medium ${getTotalTokenColor(totalTokens)}`}>
              {formatTokens(totalTokens)} tokens total
            </span>
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && !isLoading && (
        <div className="px-4 pb-3">
          <div className="space-y-1">
            {chain.map((item, index) => (
              <div
                key={item.path}
                className={`flex items-center gap-2 text-xs ${
                  item.file && !item.isCurrent
                    ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-2 py-1 -mx-2'
                    : 'px-2 py-1 -mx-2'
                }`}
                onClick={() => item.file && !item.isCurrent && handleFileClick(item)}
              >
                {/* Connector line */}
                <div className="flex items-center w-4 justify-center">
                  {index === chain.length - 1 ? (
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
                  <span className={`flex-shrink-0 font-mono ${getTokenColor(item.tokens)}`}>
                    {formatTokens(item.tokens)}
                  </span>
                )}

                {/* Current indicator */}
                {item.isCurrent && (
                  <span className="flex-shrink-0 text-blue-500 dark:text-blue-400 text-[10px] uppercase font-medium">
                    current
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          {hasInheritedFiles && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">
                Total context loaded with this file
              </span>
              <span className={`font-medium ${getTotalTokenColor(totalTokens)}`}>
                {totalTokens.toLocaleString()} tokens
              </span>
            </div>
          )}

          {/* Model fit indicator */}
          <div className="mt-2 text-xs">
            {totalTokens < 50000 ? (
              <span className="text-green-600 dark:text-green-400">
                Fits well within all model contexts
              </span>
            ) : totalTokens < 100000 ? (
              <span className="text-yellow-600 dark:text-yellow-400">
                May impact available conversation length
              </span>
            ) : totalTokens < 200000 ? (
              <span className="text-orange-600 dark:text-orange-400">
                Large context - consider splitting files
              </span>
            ) : (
              <span className="text-red-600 dark:text-red-400">
                Exceeds typical model context limits
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
