import { useEffect, useState } from 'react';
import { ContextFile, AppSettings } from '../shared/types';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { StatusBar } from './components/StatusBar';
import { EmptyState } from './components/EmptyState';

function App() {
  const [isDark, setIsDark] = useState(false);
  const [files, setFiles] = useState<ContextFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ContextFile | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize app
  useEffect(() => {
    async function init() {
      try {
        // Check system theme
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDark(prefersDark);

        // Load settings and files
        const [loadedSettings, loadedFiles] = await Promise.all([
          window.electronAPI.getSettings(),
          window.electronAPI.getFiles(),
        ]);

        setSettings(loadedSettings);
        setFiles(loadedFiles);

        // Apply theme
        const shouldBeDark = loadedSettings.theme === 'dark' || (loadedSettings.theme === 'system' && prefersDark);
        setIsDark(shouldBeDark);
        if (shouldBeDark) {
          document.documentElement.classList.add('dark');
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
  }, []);

  const handleScanDirectory = async () => {
    const path = await window.electronAPI.selectDirectory();
    if (path) {
      setIsLoading(true);
      try {
        const scannedFiles = await window.electronAPI.scanDirectory(path);
        setFiles(scannedFiles);
      } catch (error) {
        console.error('Scan failed:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
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
              settings={settings}
            />
            <MainContent selectedFile={selectedFile} settings={settings} isDark={isDark} />
          </>
        ) : (
          <EmptyState onScanDirectory={handleScanDirectory} />
        )}
      </div>

      {/* Status bar */}
      <StatusBar selectedFile={selectedFile} settings={settings} />
    </div>
  );
}

export default App;
