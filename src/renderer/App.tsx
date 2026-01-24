import { useEffect, useState } from 'react';
import { ContextFile, AppSettings } from '../shared/types';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { StatusBar } from './components/StatusBar';
import { EmptyState } from './components/EmptyState';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';
import { ContextMenu, ContextMenuAction } from './components/ContextMenu';
import { NewFileDialog } from './components/NewFileDialog';
import { SettingsDialog } from './components/SettingsDialog';
import { AboutDialog } from './components/AboutDialog';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastContainer, useToast } from './components/Toast';
import { UpdateNotification } from './components/UpdateNotification';

interface ContextMenuState {
  file: ContextFile;
  x: number;
  y: number;
}

function App() {
  const [isDark, setIsDark] = useState(false);
  const [files, setFiles] = useState<ContextFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ContextFile | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  // File management state
  const [fileToDelete, setFileToDelete] = useState<ContextFile | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Toast notifications
  const toast = useToast();

  // Initialize app
  useEffect(() => {
    async function init() {
      try {
        // Check system theme
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDark(prefersDark);

        // Load settings, files, and onboarding status
        const [loadedSettings, loadedFiles, hasCompletedOnboarding] = await Promise.all([
          window.electronAPI.getSettings(),
          window.electronAPI.getFiles(),
          window.electronAPI.getOnboardingStatus(),
        ]);

        setSettings(loadedSettings);
        setFiles(loadedFiles);
        setShowWelcome(!hasCompletedOnboarding);

        // Apply theme
        const shouldBeDark = loadedSettings.theme === 'dark' || (loadedSettings.theme === 'system' && prefersDark);
        setIsDark(shouldBeDark);
        if (shouldBeDark) {
          document.documentElement.classList.add('dark');
        }
        // Track app launch
        window.electronAPI.trackEvent('app_launch', {
          theme: loadedSettings.theme,
          filesCount: loadedFiles.length,
        });
      } catch (error) {
        console.error('Failed to initialize:', error);
      } finally {
        setIsLoading(false);
      }
    }

    init();

    // Listen for theme changes
    window.electronAPI.onThemeChanged((dark) => {
      setIsDark(dark);
      if (settings?.theme === 'system') {
        document.documentElement.classList.toggle('dark', dark);
      }
    });

    // Listen for new file command (Cmd+N)
    window.electronAPI.onNewFile(() => {
      setIsNewFileDialogOpen(true);
    });

    // Listen for open settings command (Cmd+,)
    window.electronAPI.onOpenSettings(() => {
      setIsSettingsOpen(true);
    });

    // Listen for show about command (from menu)
    window.electronAPI.onShowAbout(() => {
      setIsAboutOpen(true);
    });
  }, []);

  const handleScanDirectory = async () => {
    const path = await window.electronAPI.selectDirectory();
    if (path) {
      setIsLoading(true);
      try {
        const scannedFiles = await window.electronAPI.scanDirectory(path);
        setFiles(scannedFiles);
        // Track scan completed
        window.electronAPI.trackEvent('scan_completed', {
          filesFound: scannedFiles.length,
        });
      } catch (error) {
        console.error('Scan failed:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Context menu handler
  const handleContextMenu = (file: ContextFile, x: number, y: number) => {
    setContextMenu({ file, x, y });
  };

  // Context menu action handler
  const handleContextMenuAction = async (action: ContextMenuAction) => {
    if (!contextMenu) return;

    const file = contextMenu.file;

    switch (action) {
      case 'edit':
        setSelectedFile(file);
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
          setSelectedFile(newFile);
        } catch (error) {
          console.error('Failed to duplicate file:', error);
        }
        break;
    }

    setContextMenu(null);
  };

  // Delete file handler
  const handleDeleteFile = async () => {
    if (!fileToDelete) return;

    try {
      await window.electronAPI.deleteFile(fileToDelete.path);
      setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));

      // Clear selection if deleted file was selected
      if (selectedFile?.id === fileToDelete.id) {
        setSelectedFile(null);
      }
      toast.success('File deleted', fileToDelete.name);
      // Track file deletion
      window.electronAPI.trackEvent('file_deleted', {
        toolId: fileToDelete.toolId,
      });
    } catch (error) {
      console.error('Failed to delete file:', error);
      toast.error('Failed to delete file', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setFileToDelete(null);
    }
  };

  // Create new file handler
  const handleCreateFile = async (dirPath: string, fileName: string, toolId: string, content: string) => {
    try {
      const newFile = await window.electronAPI.createFile(dirPath, fileName, toolId, content || undefined);
      setFiles((prev) => [...prev, newFile]);
      setSelectedFile(newFile);
      setIsNewFileDialogOpen(false);
      toast.success('File created', fileName);
      // Track file creation (content presence indicates template usage)
      window.electronAPI.trackEvent('file_created', {
        toolId,
        usedTemplate: !!content,
      });
    } catch (error) {
      console.error('Failed to create file:', error);
      toast.error('Failed to create file', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Save settings handler
  const handleSaveSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      await window.electronAPI.setSettings(newSettings);
      setSettings((prev) => (prev ? { ...prev, ...newSettings } : prev));

      // Apply theme change if changed
      if (newSettings.theme) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldBeDark = newSettings.theme === 'dark' || (newSettings.theme === 'system' && prefersDark);
        setIsDark(shouldBeDark);
        document.documentElement.classList.toggle('dark', shouldBeDark);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  // Complete onboarding
  const handleCompleteOnboarding = async () => {
    await window.electronAPI.setOnboardingComplete();
    setShowWelcome(false);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  // Show welcome screen for first-time users
  if (showWelcome) {
    return (
      <div className="h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {/* Title bar area (for macOS traffic lights) */}
        <div className="h-8 titlebar-drag bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" />
        <div className="flex-1">
          <WelcomeScreen
            onComplete={handleCompleteOnboarding}
            onScanDirectory={handleScanDirectory}
            onCreateFile={() => setIsNewFileDialogOpen(true)}
          />
        </div>

        {/* New file dialog (can be triggered from welcome screen) */}
        <NewFileDialog
          isOpen={isNewFileDialogOpen}
          onClose={() => setIsNewFileDialogOpen(false)}
          onCreateFile={handleCreateFile}
          settings={settings}
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Title bar area (for macOS traffic lights) */}
      <div className="h-8 titlebar-drag bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Tokencentric</span>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {files.length > 0 ? (
          <>
            <Sidebar
              files={files}
              selectedFile={selectedFile}
              onSelectFile={setSelectedFile}
              onScanDirectory={handleScanDirectory}
              onContextMenu={handleContextMenu}
              settings={settings}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
            <MainContent selectedFile={selectedFile} settings={settings} isDark={isDark} />
          </>
        ) : (
          <EmptyState onScanDirectory={handleScanDirectory} />
        )}
      </div>

      {/* Status bar */}
      <StatusBar selectedFile={selectedFile} settings={settings} />

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          file={contextMenu.file}
          onAction={handleContextMenuAction}
          onClose={() => setContextMenu(null)}
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
        onClose={() => setIsNewFileDialogOpen(false)}
        onCreateFile={handleCreateFile}
        settings={settings}
      />

      {/* Settings dialog */}
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      {/* About dialog */}
      <AboutDialog
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* Update notification */}
      <UpdateNotification />

      {/* Toast notifications */}
      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismissToast} />
    </div>
  );
}

function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

export default AppWithErrorBoundary;
