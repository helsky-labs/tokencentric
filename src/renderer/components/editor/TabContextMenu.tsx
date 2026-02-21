import { useEffect, useRef } from 'react';
import { EditorTab } from '../../store/editorStore';

export type TabContextMenuAction =
  | 'close'
  | 'closeOthers'
  | 'closeAll'
  | 'closeSaved'
  | 'copyPath';

interface TabContextMenuProps {
  x: number;
  y: number;
  tab: EditorTab;
  totalTabs: number;
  onAction: (action: TabContextMenuAction) => void;
  onClose: () => void;
}

interface MenuItem {
  action: TabContextMenuAction;
  label: string;
  icon: string;
  shortcut?: string;
  dividerBefore?: boolean;
  disabled?: (tab: EditorTab, totalTabs: number) => boolean;
}

const menuItems: MenuItem[] = [
  {
    action: 'close',
    label: 'Close',
    icon: 'M6 18L18 6M6 6l12 12',
    shortcut: '⌘W'
  },
  {
    action: 'closeOthers',
    label: 'Close Others',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    disabled: (_, totalTabs) => totalTabs <= 1
  },
  {
    action: 'closeAll',
    label: 'Close All',
    icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    shortcut: '⌘⇧W'
  },
  {
    action: 'closeSaved',
    label: 'Close Saved',
    icon: 'M5 13l4 4L19 7',
  },
  {
    action: 'copyPath',
    label: 'Copy Path',
    icon: 'M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3',
    dividerBefore: true,
    shortcut: '⌥⌘C'
  },
];

export function TabContextMenu({ x, y, tab, totalTabs, onAction, onClose }: TabContextMenuProps) {
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
      {menuItems.map((item) => {
        const isDisabled = item.disabled?.(tab, totalTabs) ?? false;

        return (
          <div key={item.action}>
            {item.dividerBefore && (
              <div className="my-1 border-t border-light-border dark:border-surface-border" />
            )}
            <button
              onClick={() => {
                if (!isDisabled) {
                  onAction(item.action);
                  onClose();
                }
              }}
              disabled={isDisabled}
              className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 transition-colors ${
                isDisabled
                  ? 'text-content-tertiary dark:text-surface-border cursor-not-allowed'
                  : 'text-gray-700 dark:text-content-secondary hover:bg-light-surface dark:hover:bg-surface-hover'
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
        );
      })}
    </div>
  );
}
