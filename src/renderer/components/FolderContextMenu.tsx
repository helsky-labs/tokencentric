import { useEffect, useRef } from 'react';

export type FolderContextMenuAction = 'add-file' | 'reveal';

interface FolderContextMenuProps {
  x: number;
  y: number;
  folderPath: string;
  folderName: string;
  onAction: (action: FolderContextMenuAction, folderPath: string) => void;
  onClose: () => void;
}

interface MenuItem {
  action: FolderContextMenuAction;
  label: string;
  icon: string;
}

const menuItems: MenuItem[] = [
  {
    action: 'add-file',
    label: 'New File Here',
    icon: 'M12 4v16m8-8H4',
  },
  {
    action: 'reveal',
    label: 'Reveal in Finder',
    icon: 'M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z',
  },
];

export function FolderContextMenu({
  x,
  y,
  folderPath,
  folderName,
  onAction,
  onClose,
}: FolderContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }, 0);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    if (!menuRef.current) return;

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (rect.right > viewportWidth) {
      menu.style.left = `${viewportWidth - rect.width - 8}px`;
    }
    if (rect.bottom > viewportHeight) {
      menu.style.top = `${viewportHeight - rect.height - 8}px`;
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[180px] py-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
      style={{ left: x, top: y }}
    >
      {/* Folder name header */}
      <div className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 truncate">
        {folderName}
      </div>

      {menuItems.map((item) => (
        <button
          key={item.action}
          onClick={() => {
            onAction(item.action, folderPath);
            onClose();
          }}
          className="w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
          </svg>
          <span className="flex-1">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
