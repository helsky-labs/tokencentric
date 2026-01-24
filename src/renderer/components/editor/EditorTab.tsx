import { useCallback, useRef } from 'react';
import { EditorTab as EditorTabType } from '../../store/editorStore';

interface EditorTabProps {
  tab: EditorTabType;
  paneId: string;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
  onContextMenu?: (e: React.MouseEvent, tab: EditorTabType) => void;
  onDragStart?: (e: React.DragEvent, tabId: string, paneId: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, tabId: string) => void;
  index: number;
}

export function EditorTab({
  tab,
  paneId,
  isActive,
  onSelect,
  onClose,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDrop,
  index,
}: EditorTabProps) {
  const tabRef = useRef<HTMLDivElement>(null);

  // Handle click on tab
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  }, [onSelect]);

  // Handle middle-click to close tab
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1) { // Middle click
      e.preventDefault();
      onClose();
    }
  }, [onClose]);

  // Handle close button click
  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  }, [onClose]);

  // Handle context menu (right-click)
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu?.(e, tab);
  }, [tab, onContextMenu]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tab.id);
    e.dataTransfer.setData('tab-index', String(index));
    e.dataTransfer.setData('source-pane-id', paneId);
    onDragStart?.(e, tab.id, paneId);
  }, [tab.id, index, paneId, onDragStart]);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver?.(e);
  }, [onDragOver]);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    onDrop?.(e, tab.id);
  }, [tab.id, onDrop]);

  // Get icon based on tool
  const getToolIcon = () => {
    const toolId = tab.file.toolId;
    if (toolId === 'claude') {
      return (
        <svg className="w-3.5 h-3.5 text-amber-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    if (toolId === 'cursor') {
      return (
        <svg className="w-3.5 h-3.5 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5.5 3.5L18.5 12L5.5 20.5V3.5Z" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
      );
    }
    if (toolId === 'copilot') {
      return (
        <svg className="w-3.5 h-3.5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M8 12l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    // Default file icon
    return (
      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  return (
    <div
      ref={tabRef}
      draggable
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        group flex items-center gap-1.5 px-3 py-1.5 cursor-pointer
        border-r border-gray-200 dark:border-gray-700
        transition-colors select-none min-w-0 max-w-[200px]
        ${isActive
          ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-750'
        }
      `}
      title={tab.file.path}
    >
      {/* Tool icon */}
      <span className="flex-shrink-0">
        {getToolIcon()}
      </span>

      {/* File name */}
      <span className="truncate text-sm">{tab.file.name}</span>

      {/* Unsaved indicator */}
      {tab.isDirty && (
        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-500" title="Unsaved changes" />
      )}

      {/* Close button */}
      <button
        onClick={handleClose}
        className={`
          flex-shrink-0 p-0.5 rounded
          ${tab.isDirty ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
          hover:bg-gray-300 dark:hover:bg-gray-600
          transition-opacity
        `}
        title="Close"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
