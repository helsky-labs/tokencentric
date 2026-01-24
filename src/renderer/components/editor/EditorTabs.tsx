import { useCallback, useState } from 'react';
import { EditorTab } from './EditorTab';
import { TabContextMenu, TabContextMenuAction } from './TabContextMenu';
import { CloseConfirmationDialog, CloseConfirmationResult } from './CloseConfirmationDialog';
import { useEditorStore, EditorTab as EditorTabType } from '../../store/editorStore';

interface EditorTabsProps {
  paneId: string;
  tabs: EditorTabType[];
  activeTabId: string | null;
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

export function EditorTabs({ paneId, tabs, activeTabId }: EditorTabsProps) {
  const { setActiveTab, closeTab, closeOtherTabs, closeAllTabs, closeSavedTabs, saveTab, reorderTabs } = useEditorStore();
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [closeConfirmation, setCloseConfirmation] = useState<CloseConfirmationState | null>(null);

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, tabId: string) => {
    setDraggedTabId(tabId);
  }, []);

  // Handle drag over a tab
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dropTargetIndex !== index) {
      setDropTargetIndex(index);
    }
  }, [dropTargetIndex]);

  // Handle drop on a tab
  const handleDrop = useCallback((e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();

    const sourceIndex = parseInt(e.dataTransfer.getData('tab-index'), 10);
    const targetIndex = tabs.findIndex(t => t.id === targetTabId);

    if (!isNaN(sourceIndex) && targetIndex !== -1 && sourceIndex !== targetIndex) {
      reorderTabs(paneId, sourceIndex, targetIndex);
    }

    setDraggedTabId(null);
    setDropTargetIndex(null);
  }, [tabs, paneId, reorderTabs]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedTabId(null);
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

  if (tabs.length === 0) {
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
            isActive={tab.id === activeTabId}
            onSelect={() => handleSelectTab(tab.id)}
            onClose={() => handleCloseTab(tab.id)}
            onContextMenu={handleContextMenu}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
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
        onDrop={(e) => {
          e.preventDefault();
          const sourceIndex = parseInt(e.dataTransfer.getData('tab-index'), 10);
          if (!isNaN(sourceIndex) && sourceIndex !== tabs.length - 1) {
            reorderTabs(paneId, sourceIndex, tabs.length - 1);
          }
          setDraggedTabId(null);
          setDropTargetIndex(null);
        }}
      />

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
