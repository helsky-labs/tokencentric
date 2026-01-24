import { useCallback, useState } from 'react';
import { EditorTab } from './EditorTab';
import { useEditorStore, EditorTab as EditorTabType } from '../../store/editorStore';

interface EditorTabsProps {
  paneId: string;
  tabs: EditorTabType[];
  activeTabId: string | null;
}

export function EditorTabs({ paneId, tabs, activeTabId }: EditorTabsProps) {
  const { setActiveTab, closeTab, reorderTabs } = useEditorStore();
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

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

  // Handle tab close
  const handleCloseTab = useCallback((tabId: string) => {
    closeTab(tabId, paneId);
  }, [closeTab, paneId]);

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
    </div>
  );
}
