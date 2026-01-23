import { useEffect, useState } from 'react';
import { ContextFile, AppSettings } from '../../shared/types';

interface StatusBarProps {
  selectedFile: ContextFile | null;
  settings: AppSettings | null;
}

export function StatusBar({ selectedFile, settings }: StatusBarProps) {
  const [tokens, setTokens] = useState<number | null>(null);

  useEffect(() => {
    async function countTokens() {
      if (!selectedFile) {
        setTokens(null);
        return;
      }

      try {
        const content = await window.electronAPI.readFile(selectedFile.path);
        const profile = settings?.toolProfiles.find((p) => p.id === selectedFile.toolId);
        const count = await window.electronAPI.countTokens(content, profile?.tokenizer || 'openai');
        setTokens(count);
      } catch (error) {
        setTokens(null);
      }
    }

    countTokens();
  }, [selectedFile, settings]);

  const getModelFit = (tokenCount: number) => {
    // All current models support 200k context
    if (tokenCount < 50000) return { status: 'good', text: 'Fits all models' };
    if (tokenCount < 100000) return { status: 'ok', text: 'Fits all models' };
    if (tokenCount < 200000) return { status: 'warn', text: 'Large file' };
    return { status: 'error', text: 'Exceeds 200k' };
  };

  const getToolName = (toolId: string) => {
    const profile = settings?.toolProfiles.find((p) => p.id === toolId);
    return profile?.name || 'Unknown';
  };

  return (
    <div className="h-6 px-3 flex items-center gap-4 text-xs bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
      {selectedFile ? (
        <>
          <span>{getToolName(selectedFile.toolId)}</span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          {tokens !== null ? (
            <>
              <span>Tokens: {tokens.toLocaleString()}</span>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span
                className={
                  getModelFit(tokens).status === 'good'
                    ? 'text-green-600 dark:text-green-400'
                    : getModelFit(tokens).status === 'warn'
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : getModelFit(tokens).status === 'error'
                        ? 'text-red-600 dark:text-red-400'
                        : ''
                }
              >
                {getModelFit(tokens).text}
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
