import { useEffect, useState } from 'react';
import { ContextFile, AppSettings } from '../../shared/types';

interface MainContentProps {
  selectedFile: ContextFile | null;
  settings: AppSettings | null;
}

export function MainContent({ selectedFile, settings }: MainContentProps) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadFile() {
      if (!selectedFile) {
        setContent('');
        return;
      }

      setIsLoading(true);
      try {
        const fileContent = await window.electronAPI.readFile(selectedFile.path);
        setContent(fileContent);
      } catch (error) {
        console.error('Failed to load file:', error);
        setContent('Failed to load file');
      } finally {
        setIsLoading(false);
      }
    }

    loadFile();
  }, [selectedFile]);

  if (!selectedFile) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📄</div>
          <div>Select a file to view</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* File header */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="text-sm font-medium truncate">{selectedFile.path}</div>
      </div>

      {/* Editor area (placeholder - will add Monaco later) */}
      <div className="flex-1 overflow-auto">
        <pre
          className="p-4 text-sm font-mono whitespace-pre-wrap"
          style={{ fontSize: settings?.editorFontSize || 14 }}
        >
          {content}
        </pre>
      </div>
    </div>
  );
}
