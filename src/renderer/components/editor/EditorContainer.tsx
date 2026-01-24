import { useEffect, useCallback, useMemo, useRef } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { EditorPane } from './EditorPane';
import { SplitPaneContainer } from './SplitPaneContainer';
import { ContextFile, AppSettings } from '../../../shared/types';

interface EditorContainerProps {
  allFiles: ContextFile[];
  settings: AppSettings | null;
  isDark: boolean;
}

export function EditorContainer({ allFiles, settings, isDark }: EditorContainerProps) {
  const {
    panes,
    activePaneId,
    splitDirection,
    splitPane,
    unsplit,
    resizePanes,
    saveTab,
    getActiveTab,
    getPersistedState,
    restoreState,
  } = useEditorStore();

  const isRestoringRef = useRef(false);
  const lastSavedStateRef = useRef<string | null>(null);

  // Restore state on mount
  useEffect(() => {
    const restore = async () => {
      if (isRestoringRef.current) return;
      isRestoringRef.current = true;

      try {
        const savedState = await window.electronAPI.getEditorState();
        if (savedState && savedState.panes.some(p => p.tabPaths.length > 0)) {
          await restoreState(savedState, allFiles);
        }
      } catch (error) {
        console.error('Failed to restore editor state:', error);
      } finally {
        isRestoringRef.current = false;
      }
    };

    if (allFiles.length > 0) {
      restore();
    }
  }, [allFiles, restoreState]);

  // Save state on changes (debounced)
  useEffect(() => {
    const saveState = async () => {
      if (isRestoringRef.current) return;

      const state = getPersistedState();
      const stateJson = JSON.stringify(state);

      // Only save if state actually changed
      if (stateJson !== lastSavedStateRef.current) {
        lastSavedStateRef.current = stateJson;
        try {
          await window.electronAPI.setEditorState(state);
        } catch (error) {
          console.error('Failed to save editor state:', error);
        }
      }
    };

    const timeoutId = setTimeout(saveState, 500);
    return () => clearTimeout(timeoutId);
  }, [panes, activePaneId, splitDirection, getPersistedState]);

  // Listen for save-file IPC event (Cmd+S / Ctrl+S from menu)
  useEffect(() => {
    const handleSave = async () => {
      const activeTab = getActiveTab();
      if (activeTab?.isDirty) {
        try {
          await saveTab(activeTab.id);
        } catch (error) {
          console.error('Failed to save file:', error);
        }
      }
    };

    window.electronAPI.onSaveFile(handleSave);
  }, [getActiveTab, saveTab]);

  // Split handlers
  const handleSplitHorizontal = useCallback(() => {
    splitPane('vertical'); // vertical split = side by side
  }, [splitPane]);

  const handleSplitVertical = useCallback(() => {
    splitPane('horizontal'); // horizontal split = top/bottom
  }, [splitPane]);

  // Resize handler
  const handleResize = useCallback((sizes: number[]) => {
    resizePanes(sizes);
  }, [resizePanes]);

  // Get pane sizes
  const paneSizes = useMemo(() => panes.map(p => p.size), [panes]);

  // Can split if only one pane exists
  const canSplit = panes.length < 2;

  // Can unsplit if more than one pane exists
  const canUnsplit = panes.length > 1;

  // Render panes
  const paneElements = useMemo(() =>
    panes.map(pane => (
      <EditorPane
        key={pane.id}
        pane={pane}
        allFiles={allFiles}
        settings={settings}
        isDark={isDark}
        isActive={pane.id === activePaneId}
        onSplitHorizontal={handleSplitHorizontal}
        onSplitVertical={handleSplitVertical}
        onUnsplit={unsplit}
        canSplit={canSplit}
        canUnsplit={canUnsplit}
      />
    )),
    [panes, allFiles, settings, isDark, activePaneId, handleSplitHorizontal, handleSplitVertical, unsplit, canSplit, canUnsplit]
  );

  return (
    <SplitPaneContainer
      direction={splitDirection}
      sizes={paneSizes}
      onResize={handleResize}
    >
      {paneElements}
    </SplitPaneContainer>
  );
}
