import { useEffect, useState } from 'react';
import { ContextFile, AppSettings, AppView, ToolModule } from '../shared/types';
import { SettingsDialog } from './components/SettingsDialog';
import { AboutDialog } from './components/AboutDialog';
import { WelcomeScreen } from './components/WelcomeScreen';
import { NewFileDialog } from './components/NewFileDialog';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastContainer, useToast } from './components/Toast';
import { UpdateNotification } from './components/UpdateNotification';
import { useEditorStore } from './store/editorStore';
import { ContextFilesView } from './views/ContextFilesView';
import { AppTabBar } from './components/AppTabBar';
import { ToolModuleView } from './views/ToolModuleView';

function App() {
  const [isDark, setIsDark] = useState(false);
  const [files, setFiles] = useState<ContextFile[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  // View routing
  const [activeView, setActiveView] = useState<AppView>('context-files');
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [toolModules, setToolModules] = useState<ToolModule[]>([]);

  // Dialog state (shared across views)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Editor store (for keyboard shortcuts)
  const { closeActiveTab, nextTab, previousTab } = useEditorStore();

  // Toast notifications
  const toast = useToast();

  // Initialize app
  useEffect(() => {
    async function init() {
      try {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDark(prefersDark);

        const [loadedSettings, loadedFiles, hasCompletedOnboarding, modules] = await Promise.all([
          window.electronAPI.getSettings(),
          window.electronAPI.getFiles(),
          window.electronAPI.getOnboardingStatus(),
          window.electronAPI.getToolModules(),
        ]);

        setSettings(loadedSettings);
        setFiles(loadedFiles);
        setShowWelcome(!hasCompletedOnboarding);
        setToolModules(modules);

        // Apply theme
        const shouldBeDark =
          loadedSettings.theme === 'dark' ||
          (loadedSettings.theme === 'system' && prefersDark);
        setIsDark(shouldBeDark);
        if (shouldBeDark) {
          document.documentElement.classList.add('dark');
        }

        window.electronAPI.trackEvent('app_launch', {
          theme: loadedSettings.theme,
          filesCount: loadedFiles.length,
        });

        // Background re-scan
        if (loadedFiles.length > 0) {
          window.electronAPI
            .rescanCachedPaths()
            .then((freshFiles) => setFiles(freshFiles))
            .catch((err) => console.error('Background rescan failed:', err));
        }
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

    // Listen for open settings command (Cmd+,)
    window.electronAPI.onOpenSettings(() => {
      setIsSettingsOpen(true);
      window.electronAPI.trackEvent('settings_opened');
    });

    // Listen for show about command
    window.electronAPI.onShowAbout(() => {
      setIsAboutOpen(true);
    });

    // Listen for tab commands (Cmd+W, Cmd+Shift+], Cmd+Shift+[)
    window.electronAPI.onCloseTab?.(() => closeActiveTab());
    window.electronAPI.onNextTab?.(() => nextTab());
    window.electronAPI.onPreviousTab?.(() => previousTab());
  }, [closeActiveTab, nextTab, previousTab]);

  const handleScanDirectory = async () => {
    const path = await window.electronAPI.selectDirectory();
    if (path) {
      setIsLoading(true);
      try {
        const scannedFiles = await window.electronAPI.scanDirectory(path);
        setFiles(scannedFiles);
        window.electronAPI.trackEvent('scan_completed', { filesFound: scannedFiles.length });
      } catch (error) {
        console.error('Scan failed:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSaveSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      await window.electronAPI.setSettings(newSettings);
      setSettings((prev) => (prev ? { ...prev, ...newSettings } : prev));

      if (newSettings.theme) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldBeDark =
          newSettings.theme === 'dark' || (newSettings.theme === 'system' && prefersDark);
        setIsDark(shouldBeDark);
        document.documentElement.classList.toggle('dark', shouldBeDark);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleCompleteOnboarding = async () => {
    await window.electronAPI.setOnboardingComplete();
    setShowWelcome(false);
    window.electronAPI.trackEvent('onboarding_completed');
  };

  const handleTabSelect = (view: AppView, moduleId?: string) => {
    setActiveView(view);
    setActiveModuleId(moduleId || null);
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

  if (showWelcome) {
    return (
      <div className="h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="h-8 titlebar-drag bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" />
        <div className="flex-1">
          <WelcomeScreen
            onComplete={handleCompleteOnboarding}
            onScanDirectory={handleScanDirectory}
            onCreateFile={() => {}}
          />
        </div>
        <NewFileDialog
          isOpen={false}
          onClose={() => {}}
          onCreateFile={async () => {}}
          settings={settings}
        />
      </div>
    );
  }

  const activeModule = toolModules.find((m) => m.id === activeModuleId) || null;

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Title bar with tab bar */}
      <AppTabBar
        activeView={activeView}
        activeModuleId={activeModuleId}
        toolModules={toolModules.filter((m) => m.detected)}
        onTabSelect={handleTabSelect}
      />

      {/* View router */}
      {activeView === 'context-files' && (
        <ContextFilesView
          files={files}
          setFiles={setFiles}
          settings={settings}
          isDark={isDark}
          onScanDirectory={handleScanDirectory}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onSaveSettings={handleSaveSettings}
        />
      )}

      {activeView === 'tool-module' && activeModule && (
        <ToolModuleView module={activeModule} isDark={isDark} />
      )}

      {activeView === 'starter-packs' && (
        <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-3">📦</div>
            <div className="text-lg font-medium">Starter Packs</div>
            <div className="text-sm mt-1">Coming soon</div>
          </div>
        </div>
      )}

      {/* Settings dialog */}
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      {/* About dialog */}
      <AboutDialog isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

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
