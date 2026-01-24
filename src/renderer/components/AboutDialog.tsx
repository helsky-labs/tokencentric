import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Logo } from './Logo';

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AppInfo {
  version: string;
  platform: string;
  electron: string;
  node: string;
  chrome: string;
}

export function AboutDialog({ isOpen, onClose }: AboutDialogProps) {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    if (isOpen) {
      window.electronAPI.getAppInfo().then(setAppInfo);
    }
  }, [isOpen]);

  const links = [
    {
      label: 'Documentation',
      url: 'https://tokencentric.app/docs',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      label: 'Report Issue',
      url: 'https://github.com/helrabelo/tokencentric/issues',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Buy Me a Coffee',
      url: 'https://buymeacoffee.com/helrabelo',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      label: 'Helsky Labs',
      url: 'https://helsky-labs.com',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
    },
  ];

  const openLink = (url: string) => {
    // Use shell.openExternal via a click on an anchor tag
    window.open(url, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="About Tokencentric" width="sm">
      <div className="flex flex-col items-center text-center">
        {/* App icon */}
        <div className="mb-4">
          <Logo size={80} />
        </div>

        {/* App name and version */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Tokencentric</h3>
        {appInfo && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Version {appInfo.version}</p>
        )}

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-4 max-w-xs">
          Manage your AI context files across all your projects. Track tokens and keep your prompts organized.
        </p>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {links.map((link) => (
            <button
              key={link.label}
              onClick={() => openLink(link.url)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              {link.icon}
              {link.label}
            </button>
          ))}
        </div>

        {/* System info */}
        {appInfo && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 w-full">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <span className="text-right">Electron:</span>
              <span className="text-left font-mono">{appInfo.electron}</span>
              <span className="text-right">Chrome:</span>
              <span className="text-left font-mono">{appInfo.chrome}</span>
              <span className="text-right">Node:</span>
              <span className="text-left font-mono">{appInfo.node}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
          Made with love by Helsky Labs
        </p>
      </div>
    </Modal>
  );
}
