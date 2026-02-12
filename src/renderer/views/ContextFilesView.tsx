import { useEffect, useState, useCallback } from 'react';
import { ContextFile, AppSettings, Template } from '../../shared/types';
import { Sidebar } from '../components/Sidebar';
import { EditorContainer } from '../components/editor';
import { StatusBar } from '../components/StatusBar';
import { EmptyState } from '../components/EmptyState';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { ContextMenu, ContextMenuAction } from '../components/ContextMenu';
import { FolderContextMenu, FolderContextMenuAction } from '../components/FolderContextMenu';
import { NewFileDialog } from '../components/NewFileDialog';
import { useEditorStore } from '../store/editorStore';
import { useToast } from '../components/Toast';

interface ContextMenuState {
  file: ContextFile;
  x: number;
  y: number;
}

interface FolderContextMenuState {
  folderPath: string;
  folderName: string;
  x: number;
  y: number;
}

interface ContextFilesViewProps {
  files: ContextFile[];
  setFiles: React.Dispatch<React.SetStateAction<ContextFile[]>>;
  settings: AppSettings | null;
  isDark: boolean;
  onScanDirectory: () => Promise<void>;
  onOpenSettings: () => void;
  onSaveSettings: (settings: Partial<AppSettings>) => Promise<void>;
}

export function ContextFilesView({
  files,
  setFiles,
  settings,
  isDark,
  onScanDirectory,
  onOpenSettings,
  onSaveSettings,
}: ContextFilesViewProps) {
  const { openFile, openFileInPane, closeActiveTab, tabs, panes, activePaneId, splitPane } =
    useEditorStore();

  // Get selected file from active tab
  const activePane = panes.find((p) => p.id === activePaneId);
  const activeTab = activePane?.activeTabId ? tabs.get(activePane.activeTabId) : null;
  const selectedFile = activeTab?.file || null;

  const handleSelectFile = useCallback(
    (file: ContextFile | null) => {
      if (file) {
        openFile(file);
        window.electronAPI.trackEvent('file_opened', { toolId: file.toolId });
      }
    },
    [openFile]
  );

  const handleSelectFileAlternate = useCallback(
    (file: ContextFile) => {
      const otherPane = panes.find((p) => p.id !== activePaneId);
      if (otherPane) {
        openFileInPane(file, otherPane.id);
      } else {
        splitPane('vertical');
        setTimeout(() => {
          const state = useEditorStore.getState();
          const newPane = state.panes.find((p) => p.id !== activePaneId);
          if (newPane) {
            openFileInPane(file, newPane.id);
          }
        }, 0);
      }
    },
    [panes, activePaneId, openFileInPane, splitPane]
  );

  // File management state
  const [fileToDelete, setFileToDelete] = useState<ContextFile | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [folderContextMenu, setFolderContextMenu] = useState<FolderContextMenuState | null>(null);
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
  const [newFileDefaultDir, setNewFileDefaultDir] = useState<string | undefined>(undefined);
  const [newFilePreselectedTemplate, setNewFilePreselectedTemplate] = useState<Template | null>(
    null
  );

  const toast = useToast();

  // Listen for new file command from menu
  useEffect(() => {
    window.electronAPI.onNewFile(() => {
      setIsNewFileDialogOpen(true);
    });
  }, []);

  const handleContextMenu = (file: ContextFile, x: number, y: number) => {
    setContextMenu({ file, x, y });
  };

  const handleContextMenuAction = async (action: ContextMenuAction) => {
    if (!contextMenu) return;
    const file = contextMenu.file;

    switch (action) {
      case 'edit':
        handleSelectFile(file);
        break;
      case 'delete':
        setFileToDelete(file);
        break;
      case 'reveal':
        await window.electronAPI.showInFolder(file.path);
        break;
      case 'duplicate':
        try {
          const newFile = await window.electronAPI.duplicateFile(file.path);
          setFiles((prev) => [...prev, newFile]);
          handleSelectFile(newFile);
        } catch (error) {
          console.error('Failed to duplicate file:', error);
        }
        break;
    }
    setContextMenu(null);
  };

  const handleFolderContextMenu = (
    folderPath: string,
    folderName: string,
    x: number,
    y: number
  ) => {
    setFolderContextMenu({ folderPath, folderName, x, y });
  };

  const handleFolderContextMenuAction = async (
    action: FolderContextMenuAction,
    folderPath: string
  ) => {
    switch (action) {
      case 'add-file':
        setNewFileDefaultDir(folderPath);
        setIsNewFileDialogOpen(true);
        break;
      case 'reveal':
        await window.electronAPI.showInFolder(folderPath);
        break;
      case 'remove':
        setFiles((prev) => prev.filter((f) => !f.path.startsWith(folderPath + '/')));
        if (selectedFile?.path.startsWith(folderPath + '/')) {
          closeActiveTab();
        }
        toast.success('Folder removed', `Removed ${folderPath.split('/').pop()} from scan`);
        break;
    }
    setFolderContextMenu(null);
  };

  const handleOpenNewFileDialog = (preselectedTemplate?: Template, defaultDir?: string) => {
    setNewFilePreselectedTemplate(preselectedTemplate || null);
    setNewFileDefaultDir(defaultDir);
    setIsNewFileDialogOpen(true);
  };

  const handleCloseNewFileDialog = () => {
    setIsNewFileDialogOpen(false);
    setNewFileDefaultDir(undefined);
    setNewFilePreselectedTemplate(null);
  };

  const handleDeleteFile = async () => {
    if (!fileToDelete) return;
    try {
      await window.electronAPI.deleteFile(fileToDelete.path);
      setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      if (selectedFile?.id === fileToDelete.id) {
        closeActiveTab();
      }
      toast.success('File deleted', fileToDelete.name);
      window.electronAPI.trackEvent('file_deleted', { toolId: fileToDelete.toolId });
    } catch (error) {
      console.error('Failed to delete file:', error);
      toast.error(
        'Failed to delete file',
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      setFileToDelete(null);
    }
  };

  const handleCreateFile = async (
    dirPath: string,
    fileName: string,
    toolId: string,
    content: string
  ) => {
    try {
      const newFile = await window.electronAPI.createFile(
        dirPath,
        fileName,
        toolId,
        content || undefined
      );
      setFiles((prev) => [...prev, newFile]);
      handleSelectFile(newFile);
      setIsNewFileDialogOpen(false);
      toast.success('File created', fileName);
      window.electronAPI.trackEvent('file_created', { toolId, usedTemplate: !!content });
      if (content) {
        window.electronAPI.trackEvent('template_used', { toolId });
      }
    } catch (error) {
      console.error('Failed to create file:', error);
      toast.error(
        'Failed to create file',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  return (
    <>
      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {files.length > 0 ? (
          <>
            <Sidebar
              files={files}
              selectedFile={selectedFile}
              onSelectFile={handleSelectFile}
              onSelectFileAlternate={handleSelectFileAlternate}
              onScanDirectory={onScanDirectory}
              onContextMenu={handleContextMenu}
              onFolderContextMenu={handleFolderContextMenu}
              onNewFile={handleOpenNewFileDialog}
              settings={settings}
              onOpenSettings={onOpenSettings}
              onUpdateSettings={onSaveSettings}
            />
            <EditorContainer allFiles={files} settings={settings} isDark={isDark} />
          </>
        ) : (
          <EmptyState
            onScanDirectory={onScanDirectory}
            onNewFile={() => handleOpenNewFileDialog()}
          />
        )}
      </div>

      {/* Status bar */}
      <StatusBar selectedFile={selectedFile} allFiles={files} settings={settings} />

      {/* File context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          file={contextMenu.file}
          onAction={handleContextMenuAction}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Folder context menu */}
      {folderContextMenu && (
        <FolderContextMenu
          x={folderContextMenu.x}
          y={folderContextMenu.y}
          folderPath={folderContextMenu.folderPath}
          folderName={folderContextMenu.folderName}
          onAction={handleFolderContextMenuAction}
          onClose={() => setFolderContextMenu(null)}
        />
      )}

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        file={fileToDelete}
        onConfirm={handleDeleteFile}
        onCancel={() => setFileToDelete(null)}
      />

      {/* New file dialog */}
      <NewFileDialog
        isOpen={isNewFileDialogOpen}
        onClose={handleCloseNewFileDialog}
        onCreateFile={handleCreateFile}
        settings={settings}
        defaultDirectory={newFileDefaultDir}
        preselectedTemplate={newFilePreselectedTemplate}
      />
    </>
  );
}
