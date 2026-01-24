import { useCallback, useState } from 'react';
import { EditorTab } from './EditorTab';
import { TabContextMenu, TabContextMenuAction } from './TabContextMenu';
import { CloseConfirmationDialog, CloseConfirmationResult } from './CloseConfirmationDialog';
import { useEditorStore, EditorTab as EditorTabType } from '../../store/editorStore';

interface EditorTabsProps {
  paneId: string;
  tabs: EditorTabType[];
  activeTabId: string | null;
  onSplitHorizontal?: () => void;
  onSplitVertical?: () => void;
  onUnsplit?: () => void;
  showAIButton?: boolean;
  aiButtonRef?: React.RefObject<HTMLButtonElement>;
  onAIClick?: () => void;
}

interface ContextMenuState {
  x: number;
  y: number;
  tab: EditorTabType;
}

interface CloseConfirmationState {
  tabs: EditorTabType[];
  onConfirm: () => void;
}

export function EditorTabs({ paneId, tabs, activeTabId, onSplitHorizontal, onSplitVertical, onUnsplit, showAIButton, aiButtonRef, onAIClick }: EditorTabsProps) {
  const { setActiveTab, closeTab, closeOtherTabs, closeAllTabs, closeSavedTabs, saveTab, reorderTabs, moveTabToPane } = useEditorStore();
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [draggedFromPaneId, setDraggedFromPaneId] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [closeConfirmation, setCloseConfirmation] = useState<CloseConfirmationState | null>(null);

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, tabId: string, sourcePaneId: string) => {
    setDraggedTabId(tabId);
    setDraggedFromPaneId(sourcePaneId);
  }, []);

  // Handle drag over a tab
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dropTargetIndex !== index) {
      setDropTargetIndex(index);
    }
  }, [dropTargetIndex]);

  // Handle drop on a tab or empty space
  const handleDrop = useCallback((e: React.DragEvent, targetTabId?: string) => {
    e.preventDefault();

    const tabId = e.dataTransfer.getData('text/plain');
    const sourcePaneId = e.dataTransfer.getData('source-pane-id');
    const sourceIndex = parseInt(e.dataTransfer.getData('tab-index'), 10);

    // Cross-pane drop
    if (sourcePaneId && sourcePaneId !== paneId && tabId) {
      moveTabToPane(tabId, sourcePaneId, paneId);
    }
    // Same-pane reorder to specific position
    else if (targetTabId && !isNaN(sourceIndex)) {
      const targetIndex = tabs.findIndex(t => t.id === targetTabId);
      if (targetIndex !== -1 && sourceIndex !== targetIndex) {
        reorderTabs(paneId, sourceIndex, targetIndex);
      }
    }
    // Same-pane reorder to end (dropped on empty space)
    else if (!targetTabId && !isNaN(sourceIndex) && sourcePaneId === paneId) {
      if (sourceIndex !== tabs.length - 1) {
        reorderTabs(paneId, sourceIndex, tabs.length - 1);
      }
    }

    setDraggedTabId(null);
    setDraggedFromPaneId(null);
    setDropTargetIndex(null);
  }, [tabs, paneId, reorderTabs, moveTabToPane]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedTabId(null);
    setDraggedFromPaneId(null);
    setDropTargetIndex(null);
  }, []);

  // Handle tab select
  const handleSelectTab = useCallback((tabId: string) => {
    setActiveTab(tabId, paneId);
  }, [setActiveTab, paneId]);

  // Request close with confirmation if needed
  const requestCloseWithConfirmation = useCallback((
    unsavedTabs: EditorTabType[],
    onConfirm: () => void
  ) => {
    if (unsavedTabs.length > 0) {
      setCloseConfirmation({ tabs: unsavedTabs, onConfirm });
    } else {
      onConfirm();
    }
  }, []);

  // Handle tab close
  const handleCloseTab = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.isDirty) {
      requestCloseWithConfirmation([tab], () => closeTab(tabId, paneId));
    } else {
      closeTab(tabId, paneId);
    }
  }, [tabs, closeTab, paneId, requestCloseWithConfirmation]);

  // Handle context menu open
  const handleContextMenu = useCallback((e: React.MouseEvent, tab: EditorTabType) => {
    setContextMenu({ x: e.clientX, y: e.clientY, tab });
  }, []);

  // Handle context menu action
  const handleContextMenuAction = useCallback((action: TabContextMenuAction) => {
    if (!contextMenu) return;

    const { tab } = contextMenu;

    switch (action) {
      case 'close':
        handleCloseTab(tab.id);
        break;

      case 'closeOthers': {
        const otherTabs = tabs.filter(t => t.id !== tab.id);
        const unsavedOthers = otherTabs.filter(t => t.isDirty);
        requestCloseWithConfirmation(unsavedOthers, () => closeOtherTabs(tab.id, paneId));
        break;
      }

      case 'closeAll': {
        const unsavedTabs = tabs.filter(t => t.isDirty);
        requestCloseWithConfirmation(unsavedTabs, () => closeAllTabs(paneId));
        break;
      }

      case 'closeSaved':
        closeSavedTabs(paneId);
        break;

      case 'copyPath':
        navigator.clipboard.writeText(tab.file.path);
        break;
    }
  }, [contextMenu, tabs, paneId, handleCloseTab, closeOtherTabs, closeAllTabs, closeSavedTabs, requestCloseWithConfirmation]);

  // Handle close confirmation result
  const handleCloseConfirmationResult = useCallback(async (result: CloseConfirmationResult) => {
    if (!closeConfirmation) return;

    const { tabs: unsavedTabs, onConfirm } = closeConfirmation;

    if (result === 'save') {
      // Save all unsaved tabs, then proceed
      try {
        await Promise.all(unsavedTabs.map(tab => saveTab(tab.id)));
        onConfirm();
      } catch (error) {
        console.error('Failed to save tabs:', error);
        // Don't close if save failed
      }
    } else if (result === 'discard') {
      // Proceed without saving
      onConfirm();
    }
    // 'cancel' - just close the dialog

    setCloseConfirmation(null);
  }, [closeConfirmation, saveTab]);

  const showSplitButtons = onSplitHorizontal || onSplitVertical || onUnsplit;

  if (tabs.length === 0 && !showSplitButtons) {
    return null;
  }

  return (
    <div
      className="flex items-stretch bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-thin"
      onDragEnd={handleDragEnd}
    >
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          onDragOver={(e) => handleDragOver(e, index)}
          className={`
            relative
            ${dropTargetIndex === index && draggedTabId !== tab.id ? 'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-blue-500' : ''}
          `}
        >
          <EditorTab
            tab={tab}
            paneId={paneId}
            isActive={tab.id === activeTabId}
            onSelect={() => handleSelectTab(tab.id)}
            onClose={() => handleCloseTab(tab.id)}
            onContextMenu={handleContextMenu}
            onDragStart={handleDragStart}
            onDrop={(e) => handleDrop(e, tab.id)}
            index={index}
          />
        </div>
      ))}

      {/* Empty space at the end of tabs - can be a drop target */}
      <div
        className="flex-1 min-w-[40px]"
        onDragOver={(e) => {
          e.preventDefault();
          setDropTargetIndex(tabs.length);
        }}
        onDrop={(e) => handleDrop(e)}
      />

      {/* AI button */}
      {showAIButton && (
        <div className="flex items-center px-1 border-l border-gray-200 dark:border-gray-700">
          <button
            ref={aiButtonRef}
            onClick={onAIClick}
            className="p-1 text-purple-500 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded transition-colors"
            title="AI Actions"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
          </button>
        </div>
      )}

      {/* Split buttons */}
      {showSplitButtons && (
        <div className="flex items-center gap-0.5 px-1 border-l border-gray-200 dark:border-gray-700">
          {onSplitVertical && (
            <button
              onClick={onSplitVertical}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="Split Right"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 4v16M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />
              </svg>
            </button>
          )}
          {onSplitHorizontal && (
            <button
              onClick={onSplitHorizontal}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="Split Down"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 9h16M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />
              </svg>
            </button>
          )}
          {onUnsplit && (
            <button
              onClick={onUnsplit}
              className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="Close Split"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Tab Context Menu */}
      {contextMenu && (
        <TabContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          tab={contextMenu.tab}
          totalTabs={tabs.length}
          onAction={handleContextMenuAction}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Close Confirmation Dialog */}
      <CloseConfirmationDialog
        isOpen={closeConfirmation !== null}
        tabs={closeConfirmation?.tabs ?? []}
        onResult={handleCloseConfirmationResult}
      />
    </div>
  );
}
