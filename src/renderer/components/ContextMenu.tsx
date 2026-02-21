import { useEffect, useRef } from 'react';
import { ContextFile } from '../../shared/types';

export type ContextMenuAction = 'edit' | 'delete' | 'reveal' | 'duplicate';

interface ContextMenuProps {
  x: number;
  y: number;
  file: ContextFile;
  onAction: (action: ContextMenuAction) => void;
  onClose: () => void;
}

interface MenuItem {
  action: ContextMenuAction;
  label: string;
  icon: string;
  shortcut?: string;
  danger?: boolean;
}

const menuItems: MenuItem[] = [
  { action: 'edit', label: 'Edit', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
  { action: 'reveal', label: 'Reveal in Finder', icon: 'M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z', shortcut: '⌘⇧R' },
  { action: 'duplicate', label: 'Duplicate', icon: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z', shortcut: '⌘D' },
  { action: 'delete', label: 'Delete', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16', shortcut: '⌘⌫', danger: true },
];

export function ContextMenu({ x, y, file, onAction, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
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

    // Use setTimeout to avoid closing immediately when opening
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }, 0);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Adjust position to stay within viewport
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
      className="fixed z-50 min-w-[180px] py-1 bg-light-bg dark:bg-surface-card rounded-lg shadow-lg border border-light-border dark:border-surface-border"
      style={{ left: x, top: y }}
    >
      {menuItems.map((item, index) => (
        <div key={item.action}>
          {item.danger && index > 0 && (
            <div className="my-1 border-t border-light-border dark:border-surface-border" />
          )}
          <button
            onClick={() => {
              onAction(item.action);
              onClose();
            }}
            className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-light-surface dark:hover:bg-surface-hover transition-colors ${
              item.danger ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-content-secondary'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
            </svg>
            <span className="flex-1">{item.label}</span>
            {item.shortcut && (
              <span className="text-xs text-content-tertiary">{item.shortcut}</span>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
