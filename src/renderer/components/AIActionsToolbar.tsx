import React, { useState, useEffect } from 'react';
import { AIAction, AIStreamChunk } from '../../shared/types';

interface AIActionsToolbarProps {
  content: string;
  projectInfo?: string;
  onContentGenerated: (content: string) => void;
  disabled?: boolean;
}

export function AIActionsToolbar({
  content,
  projectInfo,
  onContentGenerated,
  disabled = false,
}: AIActionsToolbarProps) {
  const [isConfigured, setIsConfigured] = useState(false);
  const [activeProvider, setActiveProvider] = useState<{
    provider: string;
    model: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAction, setCurrentAction] = useState<AIAction | null>(null);
  const [streamedContent, setStreamedContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConfiguration();
  }, []);

  useEffect(() => {
    // Set up streaming listener
    window.electronAPI.onAiStreamChunk(handleStreamChunk);

    return () => {
      window.electronAPI.removeAiStreamChunkListener();
    };
  }, []);

  const checkConfiguration = async () => {
    const configured = await window.electronAPI.aiIsConfigured();
    setIsConfigured(configured);

    if (configured) {
      const provider = await window.electronAPI.aiGetActiveProvider();
      setActiveProvider(provider);
    }
  };

  const handleStreamChunk = (chunk: AIStreamChunk) => {
    switch (chunk.type) {
      case 'text':
        setStreamedContent((prev) => prev + chunk.content);
        break;
      case 'done':
        setIsProcessing(false);
        setCurrentAction(null);
        break;
      case 'error':
        setError(chunk.content);
        setIsProcessing(false);
        setCurrentAction(null);
        break;
    }
  };

  const executeAction = async (action: AIAction) => {
    if (!isConfigured || isProcessing) return;

    setIsProcessing(true);
    setCurrentAction(action);
    setStreamedContent('');
    setError(null);

    await window.electronAPI.aiExecute(action, content, projectInfo);
  };

  const handleApply = () => {
    if (streamedContent) {
      onContentGenerated(streamedContent);
      setStreamedContent('');
    }
  };

  const handleDiscard = () => {
    setStreamedContent('');
    setError(null);
  };

  if (!isConfigured) {
    return (
      <div className="ai-toolbar ai-toolbar-disabled">
        <span className="ai-toolbar-message">
          AI not configured. Go to Settings &gt; AI Providers to set up.
        </span>
      </div>
    );
  }

  if (streamedContent || isProcessing) {
    return (
      <div className="ai-toolbar ai-toolbar-preview">
        <div className="ai-toolbar-header">
          <span className="ai-toolbar-status">
            {isProcessing ? (
              <>
                <span className="ai-spinner"></span>
                {currentAction === 'generate' && 'Generating...'}
                {currentAction === 'improve' && 'Improving...'}
                {currentAction === 'summarize' && 'Summarizing...'}
              </>
            ) : (
              <>AI {currentAction} complete</>
            )}
          </span>
          {activeProvider && (
            <span className="ai-toolbar-provider">
              {activeProvider.provider} / {activeProvider.model}
            </span>
          )}
        </div>
        <div className="ai-preview-content">
          <pre>{streamedContent}</pre>
        </div>
        {!isProcessing && (
          <div className="ai-toolbar-actions">
            <button
              className="ai-btn ai-btn-primary"
              onClick={handleApply}
              title="Replace editor content with AI result"
            >
              Apply Changes
            </button>
            <button
              className="ai-btn ai-btn-secondary"
              onClick={handleDiscard}
              title="Discard AI result"
            >
              Discard
            </button>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-toolbar ai-toolbar-error">
        <span className="ai-error-message">{error}</span>
        <button className="ai-btn ai-btn-secondary" onClick={handleDiscard}>
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="ai-toolbar">
      <div className="ai-toolbar-buttons">
        <button
          className="ai-btn ai-btn-action"
          onClick={() => executeAction('generate')}
          disabled={disabled || isProcessing}
          title="Generate a new context file based on project structure"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="ai-icon"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          Generate
        </button>
        <button
          className="ai-btn ai-btn-action"
          onClick={() => executeAction('improve')}
          disabled={disabled || isProcessing || !content}
          title="Improve the current context file"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="ai-icon"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          Improve
        </button>
        <button
          className="ai-btn ai-btn-action"
          onClick={() => executeAction('summarize')}
          disabled={disabled || isProcessing || !content}
          title="Summarize to reduce token count"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="ai-icon"
          >
            <path d="M4 6h16" />
            <path d="M4 12h10" />
            <path d="M4 18h6" />
          </svg>
          Summarize
        </button>
      </div>
      {activeProvider && (
        <span className="ai-toolbar-provider">
          Using {activeProvider.provider} / {activeProvider.model}
        </span>
      )}
    </div>
  );
}
