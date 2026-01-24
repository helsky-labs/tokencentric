import { create } from 'zustand';
import { ContextFile } from '../../shared/types';

export type ViewMode = 'editor' | 'preview' | 'split';

export interface EditorTab {
  id: string;                    // file.path as ID
  file: ContextFile;
  content: string;
  originalContent: string;
  isDirty: boolean;
  viewMode: ViewMode;
  cursorPosition?: { line: number; column: number };
}

export interface EditorPane {
  id: string;
  tabIds: string[];
  activeTabId: string | null;
  size: number;  // percentage
}

export type SplitDirection = 'horizontal' | 'vertical' | null;

interface EditorState {
  // State
  tabs: Map<string, EditorTab>;
  panes: EditorPane[];
  activePaneId: string;
  splitDirection: SplitDirection;

  // Actions
  openFile: (file: ContextFile) => Promise<void>;
  closeTab: (tabId: string, paneId?: string) => void;
  closeOtherTabs: (tabId: string, paneId?: string) => void;
  closeAllTabs: (paneId?: string) => void;
  closeSavedTabs: (paneId?: string) => void;
  setActiveTab: (tabId: string, paneId?: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  saveTab: (tabId: string) => Promise<void>;
  reorderTabs: (paneId: string, fromIndex: number, toIndex: number) => void;
  setTabViewMode: (tabId: string, viewMode: ViewMode) => void;
  nextTab: (paneId?: string) => void;
  previousTab: (paneId?: string) => void;
  closeActiveTab: (paneId?: string) => void;
  getActiveTab: (paneId?: string) => EditorTab | null;
  getActivePane: () => EditorPane | null;
  getUnsavedTabs: (paneId?: string) => EditorTab[];
}

// Default pane for initial state
const defaultPane: EditorPane = {
  id: 'pane-1',
  tabIds: [],
  activeTabId: null,
  size: 100,
};

export const useEditorStore = create<EditorState>((set, get) => ({
  // Initial state
  tabs: new Map(),
  panes: [defaultPane],
  activePaneId: 'pane-1',
  splitDirection: null,

  // Open a file in a new tab or focus existing tab
  openFile: async (file: ContextFile) => {
    const { tabs, panes, activePaneId } = get();

    // Check if file is already open in any pane
    const existingTab = tabs.get(file.path);
    if (existingTab) {
      // Focus the existing tab
      const paneWithTab = panes.find(p => p.tabIds.includes(file.path));
      if (paneWithTab) {
        set({
          activePaneId: paneWithTab.id,
          panes: panes.map(p =>
            p.id === paneWithTab.id
              ? { ...p, activeTabId: file.path }
              : p
          ),
        });
      }
      return;
    }

    // Load file content
    let content = '';
    try {
      content = await window.electronAPI.readFile(file.path);
    } catch (error) {
      console.error('Failed to load file:', error);
      content = `Failed to load file: ${error}`;
    }

    // Create new tab
    const newTab: EditorTab = {
      id: file.path,
      file,
      content,
      originalContent: content,
      isDirty: false,
      viewMode: 'split', // Default to split for markdown
    };

    // Add tab to active pane
    const newTabs = new Map(tabs);
    newTabs.set(file.path, newTab);

    set({
      tabs: newTabs,
      panes: panes.map(p =>
        p.id === activePaneId
          ? {
              ...p,
              tabIds: [...p.tabIds, file.path],
              activeTabId: file.path,
            }
          : p
      ),
    });
  },

  // Close a tab
  closeTab: (tabId: string, paneId?: string) => {
    const { tabs, panes, activePaneId } = get();

    const targetPaneId = paneId || activePaneId;
    const targetPane = panes.find(p => p.id === targetPaneId);

    if (!targetPane || !targetPane.tabIds.includes(tabId)) return;

    // Get the index of the tab being closed
    const tabIndex = targetPane.tabIds.indexOf(tabId);
    const newTabIds = targetPane.tabIds.filter(id => id !== tabId);

    // Determine new active tab
    let newActiveTabId: string | null = null;
    if (newTabIds.length > 0) {
      // Select the next tab, or the previous if we closed the last one
      const newIndex = tabIndex >= newTabIds.length ? newTabIds.length - 1 : tabIndex;
      newActiveTabId = newTabIds[newIndex];
    }

    // Remove tab from tabs map
    const newTabs = new Map(tabs);
    newTabs.delete(tabId);

    set({
      tabs: newTabs,
      panes: panes.map(p =>
        p.id === targetPaneId
          ? { ...p, tabIds: newTabIds, activeTabId: newActiveTabId }
          : p
      ),
    });
  },

  // Close all tabs except the specified one
  closeOtherTabs: (tabId: string, paneId?: string) => {
    const { tabs, panes, activePaneId } = get();

    const targetPaneId = paneId || activePaneId;
    const targetPane = panes.find(p => p.id === targetPaneId);

    if (!targetPane || !targetPane.tabIds.includes(tabId)) return;

    // Get tabs to remove (all except the specified one)
    const tabsToRemove = targetPane.tabIds.filter(id => id !== tabId);

    // Remove tabs from map
    const newTabs = new Map(tabs);
    tabsToRemove.forEach(id => newTabs.delete(id));

    set({
      tabs: newTabs,
      panes: panes.map(p =>
        p.id === targetPaneId
          ? { ...p, tabIds: [tabId], activeTabId: tabId }
          : p
      ),
    });
  },

  // Close all tabs in a pane
  closeAllTabs: (paneId?: string) => {
    const { tabs, panes, activePaneId } = get();

    const targetPaneId = paneId || activePaneId;
    const targetPane = panes.find(p => p.id === targetPaneId);

    if (!targetPane) return;

    // Remove all tabs in this pane from the map
    const newTabs = new Map(tabs);
    targetPane.tabIds.forEach(id => newTabs.delete(id));

    set({
      tabs: newTabs,
      panes: panes.map(p =>
        p.id === targetPaneId
          ? { ...p, tabIds: [], activeTabId: null }
          : p
      ),
    });
  },

  // Close only saved (non-dirty) tabs in a pane
  closeSavedTabs: (paneId?: string) => {
    const { tabs, panes, activePaneId } = get();

    const targetPaneId = paneId || activePaneId;
    const targetPane = panes.find(p => p.id === targetPaneId);

    if (!targetPane) return;

    // Get tabs to keep (dirty ones) and remove (saved ones)
    const tabsToKeep: string[] = [];
    const tabsToRemove: string[] = [];

    targetPane.tabIds.forEach(id => {
      const tab = tabs.get(id);
      if (tab?.isDirty) {
        tabsToKeep.push(id);
      } else {
        tabsToRemove.push(id);
      }
    });

    // Remove saved tabs from map
    const newTabs = new Map(tabs);
    tabsToRemove.forEach(id => newTabs.delete(id));

    // Determine new active tab
    let newActiveTabId: string | null = null;
    if (tabsToKeep.length > 0) {
      // If current active tab is being kept, keep it active
      if (targetPane.activeTabId && tabsToKeep.includes(targetPane.activeTabId)) {
        newActiveTabId = targetPane.activeTabId;
      } else {
        // Otherwise select the first remaining tab
        newActiveTabId = tabsToKeep[0];
      }
    }

    set({
      tabs: newTabs,
      panes: panes.map(p =>
        p.id === targetPaneId
          ? { ...p, tabIds: tabsToKeep, activeTabId: newActiveTabId }
          : p
      ),
    });
  },

  // Set active tab in a pane
  setActiveTab: (tabId: string, paneId?: string) => {
    const { panes, activePaneId } = get();

    const targetPaneId = paneId || activePaneId;
    const targetPane = panes.find(p => p.id === targetPaneId);

    if (!targetPane || !targetPane.tabIds.includes(tabId)) return;

    set({
      activePaneId: targetPaneId,
      panes: panes.map(p =>
        p.id === targetPaneId
          ? { ...p, activeTabId: tabId }
          : p
      ),
    });
  },

  // Update content of a tab
  updateTabContent: (tabId: string, content: string) => {
    const { tabs } = get();
    const tab = tabs.get(tabId);

    if (!tab) return;

    const newTabs = new Map(tabs);
    newTabs.set(tabId, {
      ...tab,
      content,
      isDirty: content !== tab.originalContent,
    });

    set({ tabs: newTabs });
  },

  // Save a tab
  saveTab: async (tabId: string) => {
    const { tabs } = get();
    const tab = tabs.get(tabId);

    if (!tab || !tab.isDirty) return;

    try {
      await window.electronAPI.writeFile(tab.file.path, tab.content);

      const newTabs = new Map(tabs);
      newTabs.set(tabId, {
        ...tab,
        originalContent: tab.content,
        isDirty: false,
      });

      set({ tabs: newTabs });
    } catch (error) {
      console.error('Failed to save file:', error);
      throw error;
    }
  },

  // Reorder tabs within a pane
  reorderTabs: (paneId: string, fromIndex: number, toIndex: number) => {
    const { panes } = get();
    const targetPane = panes.find(p => p.id === paneId);

    if (!targetPane) return;

    const newTabIds = [...targetPane.tabIds];
    const [movedTabId] = newTabIds.splice(fromIndex, 1);
    newTabIds.splice(toIndex, 0, movedTabId);

    set({
      panes: panes.map(p =>
        p.id === paneId
          ? { ...p, tabIds: newTabIds }
          : p
      ),
    });
  },

  // Set view mode for a tab
  setTabViewMode: (tabId: string, viewMode: ViewMode) => {
    const { tabs } = get();
    const tab = tabs.get(tabId);

    if (!tab) return;

    const newTabs = new Map(tabs);
    newTabs.set(tabId, { ...tab, viewMode });

    set({ tabs: newTabs });
  },

  // Navigate to next tab
  nextTab: (paneId?: string) => {
    const { panes, activePaneId } = get();
    const targetPaneId = paneId || activePaneId;
    const targetPane = panes.find(p => p.id === targetPaneId);

    if (!targetPane || targetPane.tabIds.length === 0 || !targetPane.activeTabId) return;

    const currentIndex = targetPane.tabIds.indexOf(targetPane.activeTabId);
    const nextIndex = (currentIndex + 1) % targetPane.tabIds.length;
    const nextTabId = targetPane.tabIds[nextIndex];

    set({
      panes: panes.map(p =>
        p.id === targetPaneId
          ? { ...p, activeTabId: nextTabId }
          : p
      ),
    });
  },

  // Navigate to previous tab
  previousTab: (paneId?: string) => {
    const { panes, activePaneId } = get();
    const targetPaneId = paneId || activePaneId;
    const targetPane = panes.find(p => p.id === targetPaneId);

    if (!targetPane || targetPane.tabIds.length === 0 || !targetPane.activeTabId) return;

    const currentIndex = targetPane.tabIds.indexOf(targetPane.activeTabId);
    const prevIndex = currentIndex === 0 ? targetPane.tabIds.length - 1 : currentIndex - 1;
    const prevTabId = targetPane.tabIds[prevIndex];

    set({
      panes: panes.map(p =>
        p.id === targetPaneId
          ? { ...p, activeTabId: prevTabId }
          : p
      ),
    });
  },

  // Close the active tab in a pane
  closeActiveTab: (paneId?: string) => {
    const { panes, activePaneId, closeTab } = get();
    const targetPaneId = paneId || activePaneId;
    const targetPane = panes.find(p => p.id === targetPaneId);

    if (!targetPane || !targetPane.activeTabId) return;

    closeTab(targetPane.activeTabId, targetPaneId);
  },

  // Get the active tab in a pane
  getActiveTab: (paneId?: string) => {
    const { tabs, panes, activePaneId } = get();
    const targetPaneId = paneId || activePaneId;
    const targetPane = panes.find(p => p.id === targetPaneId);

    if (!targetPane || !targetPane.activeTabId) return null;

    return tabs.get(targetPane.activeTabId) || null;
  },

  // Get the active pane
  getActivePane: () => {
    const { panes, activePaneId } = get();
    return panes.find(p => p.id === activePaneId) || null;
  },

  // Get all unsaved tabs in a pane
  getUnsavedTabs: (paneId?: string) => {
    const { tabs, panes, activePaneId } = get();
    const targetPaneId = paneId || activePaneId;
    const targetPane = panes.find(p => p.id === targetPaneId);

    if (!targetPane) return [];

    return targetPane.tabIds
      .map(id => tabs.get(id))
      .filter((tab): tab is EditorTab => tab !== undefined && tab.isDirty);
  },
}));
