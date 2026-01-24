import { useState, useEffect, useRef, useCallback } from 'react';
import { AIAction, AIStreamChunk } from '../../../shared/types';

interface AIActionsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  projectInfo?: string;
  onContentGenerated: (content: string) => void;
  disabled?: boolean;
  anchorRef: React.RefObject<HTMLElement>;
}

export function AIActionsPopover({
  isOpen,
  onClose,
  content,
  projectInfo,
  onContentGenerated,
  disabled = false,
  anchorRef,
}: AIActionsPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [activeProvider, setActiveProvider] = useState<{
    provider: string;
    model: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAction, setCurrentAction] = useState<AIAction | null>(null);
  const [streamedContent, setStreamedContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [position, setPosition] = useState({ top: 0, right: 0 });

  // Check AI configuration
  useEffect(() => {
    async function checkConfiguration() {
      const configured = await window.electronAPI.aiIsConfigured();
      setIsConfigured(configured);

      if (configured) {
        const provider = await window.electronAPI.aiGetActiveProvider();
        setActiveProvider(provider);
      }
    }

    if (isOpen) {
      checkConfiguration();
    }
  }, [isOpen]);

  // Set up streaming listener
  useEffect(() => {
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

    window.electronAPI.onAiStreamChunk(handleStreamChunk);

    return () => {
      window.electronAPI.removeAiStreamChunkListener();
    };
  }, []);

  // Position the popover relative to anchor
  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen, anchorRef]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        if (!isProcessing) {
          onClose();
        }
      }
    };

    // Close on escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isProcessing, onClose, anchorRef]);

  const executeAction = useCallback(async (action: AIAction) => {
    if (!isConfigured || isProcessing) return;

    setIsProcessing(true);
    setCurrentAction(action);
    setStreamedContent('');
    setError(null);

    await window.electronAPI.aiExecute(action, content, projectInfo, additionalInstructions || undefined);
  }, [isConfigured, isProcessing, content, projectInfo, additionalInstructions]);

  const handleApply = useCallback(() => {
    if (streamedContent) {
      onContentGenerated(streamedContent);
      setStreamedContent('');
      onClose();
    }
  }, [streamedContent, onContentGenerated, onClose]);

  const handleDiscard = useCallback(() => {
    setStreamedContent('');
    setError(null);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="ai-popover"
      style={{
        position: 'fixed',
        top: position.top,
        right: position.right,
      }}
    >
      {/* Header */}
      <div className="ai-popover-header">
        <span className="ai-popover-title">AI Actions</span>
        {activeProvider && (
          <span className="ai-popover-provider">
            {activeProvider.provider} / {activeProvider.model}
          </span>
        )}
        <button
          className="ai-popover-close"
          onClick={onClose}
          disabled={isProcessing}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {!isConfigured ? (
        <div className="ai-popover-message">
          AI not configured. Go to Settings &gt; AI Providers to set up.
        </div>
      ) : streamedContent || isProcessing ? (
        /* Preview mode */
        <div className="ai-popover-preview">
          <div className="ai-popover-status">
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
          </div>
          <div className="ai-popover-content">
            <pre>{streamedContent}</pre>
          </div>
          {!isProcessing && (
            <div className="ai-popover-actions">
              <button className="ai-btn ai-btn-primary" onClick={handleApply}>
                Apply Changes
              </button>
              <button className="ai-btn ai-btn-secondary" onClick={handleDiscard}>
                Discard
              </button>
            </div>
          )}
        </div>
      ) : error ? (
        /* Error state */
        <div className="ai-popover-error">
          <span className="ai-error-message">{error}</span>
          <button className="ai-btn ai-btn-secondary" onClick={handleDiscard}>
            Dismiss
          </button>
        </div>
      ) : (
        /* Action buttons */
        <div className="ai-popover-body">
          {/* Additional instructions */}
          <div className="ai-popover-instructions">
            <textarea
              className="ai-popover-textarea"
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              placeholder="Additional instructions (optional)"
              rows={2}
            />
          </div>

          {/* Action buttons */}
          <div className="ai-popover-buttons">
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
        </div>
      )}
    </div>
  );
}
