import { useEffect, useState } from 'react';
import { ContextFile, AppSettings } from '../../shared/types';
import { getInheritanceChainWithTokens, calculateTotalTokens } from '../utils/findInheritanceChain';

interface StatusBarProps {
  selectedFile: ContextFile | null;
  allFiles: ContextFile[];
  settings: AppSettings | null;
}

export function StatusBar({ selectedFile, allFiles, settings }: StatusBarProps) {
  const [tokens, setTokens] = useState<number | null>(null);
  const [totalTokens, setTotalTokens] = useState<number | null>(null);
  const [inheritedCount, setInheritedCount] = useState<number>(0);

  useEffect(() => {
    async function loadTokenInfo() {
      if (!selectedFile) {
        setTokens(null);
        setTotalTokens(null);
        setInheritedCount(0);
        return;
      }

      try {
        // Get current file tokens
        const content = await window.electronAPI.readFile(selectedFile.path);
        const profile = settings?.toolProfiles.find((p) => p.id === selectedFile.toolId);
        const tokenizer = profile?.tokenizer || 'anthropic';
        const count = await window.electronAPI.countTokens(content, tokenizer);
        setTokens(count);

        // Get full inheritance chain for total
        const chain = await getInheritanceChainWithTokens(selectedFile, allFiles, tokenizer);
        const total = calculateTotalTokens(chain);
        setTotalTokens(total);
        setInheritedCount(chain.length - 1); // Exclude current file
      } catch (error) {
        setTokens(null);
        setTotalTokens(null);
        setInheritedCount(0);
      }
    }

    loadTokenInfo();
  }, [selectedFile, allFiles, settings]);

  const getModelFit = (tokenCount: number) => {
    // All current models support 200k context
    if (tokenCount < 50000) return { status: 'good', text: 'Fits all models' };
    if (tokenCount < 100000) return { status: 'ok', text: 'Fits all models' };
    if (tokenCount < 200000) return { status: 'warn', text: 'Large context' };
    return { status: 'error', text: 'Exceeds 200k' };
  };

  const getToolName = (toolId: string) => {
    const profile = settings?.toolProfiles.find((p) => p.id === toolId);
    return profile?.name || 'Unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
      case 'ok':
        return 'text-green-600 dark:text-green-400';
      case 'warn':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return '';
    }
  };

  return (
    <div className="h-6 px-3 flex items-center gap-4 text-xs bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
      {selectedFile ? (
        <>
          <span>{getToolName(selectedFile.toolId)}</span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          {tokens !== null ? (
            <>
              <span>This file: {tokens.toLocaleString()}</span>
              {totalTokens !== null && inheritedCount > 0 && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <span title={`Includes ${inheritedCount} inherited file${inheritedCount > 1 ? 's' : ''}`}>
                    Total: {totalTokens.toLocaleString()}
                  </span>
                </>
              )}
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span className={getStatusColor(getModelFit(totalTokens || tokens).status)}>
                {getModelFit(totalTokens || tokens).text}
              </span>
            </>
          ) : (
            <span>Counting tokens...</span>
          )}
        </>
      ) : (
        <span>No file selected</span>
      )}

      {/* Right side */}
      <div className="flex-1" />
      <span>v0.1.0</span>
    </div>
  );
}
