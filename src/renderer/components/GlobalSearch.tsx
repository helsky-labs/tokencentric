import { useState, useEffect, useCallback, useRef } from 'react';
import { ConfigItem } from '../../shared/types';
import { ToolIcon } from './ToolIcon';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: ConfigItem) => void;
}

export function GlobalSearch({ isOpen, onClose, onSelect }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ConfigItem[]>([]);
  const [allItems, setAllItems] = useState<ConfigItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load all config items on open
  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setSelectedIndex(0);

    async function loadItems() {
      try {
        const [commands, agents] = await Promise.all([
          window.electronAPI.getModuleConfigItems('claude', 'commands'),
          window.electronAPI.getModuleConfigItems('claude', 'agents'),
        ]);
        setAllItems([...commands, ...agents]);
      } catch (error) {
        console.error('Failed to load config items for search:', error);
      }
    }

    loadItems();

    // Focus input after render
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  // Filter results on query change
  useEffect(() => {
    if (!query.trim()) {
      setResults(allItems.slice(0, 20));
      return;
    }

    const lower = query.toLowerCase();
    const filtered = allItems.filter((item) => {
      return (
        item.name.toLowerCase().includes(lower) ||
        item.category.toLowerCase().includes(lower) ||
        (item.metadata.department as string || '').toLowerCase().includes(lower) ||
        (item.metadata.slashCommand as string || '').toLowerCase().includes(lower) ||
        (item.metadata.description as string || '').toLowerCase().includes(lower)
      );
    });

    setResults(filtered.slice(0, 20));
    setSelectedIndex(0);
  }, [query, allItems]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        onSelect(results[selectedIndex]);
        onClose();
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [results, selectedIndex, onSelect, onClose]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div
        className="w-[500px] bg-light-bg dark:bg-surface-card rounded-lg shadow-2xl border border-light-border dark:border-surface-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center px-4 py-3 border-b border-light-border dark:border-surface-border">
          <ToolIcon toolId="search" size={14} className="text-gray-400 mr-2 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands, agents..."
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-content-primary outline-none placeholder-gray-400"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 bg-light-surface dark:bg-surface-hover text-gray-400 rounded border border-light-border dark:border-surface-border">
            esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto">
          {results.length === 0 ? (
            <div className="py-8 text-center text-xs text-content-tertiary">
              {query ? 'No results found' : 'Loading...'}
            </div>
          ) : (
            results.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
                className={`
                  w-full text-left px-4 py-2 flex items-center gap-3 transition-colors
                  ${idx === selectedIndex
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : 'hover:bg-light-surface dark:hover:bg-surface-hover/50'
                  }
                `}
              >
                <ToolIcon toolId={item.category === 'command' ? 'bolt' : 'robot'} size={14} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-content-primary truncate">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-content-tertiary truncate">
                    {item.category === 'command'
                      ? (item.metadata.slashCommand as string)
                      : (item.metadata.department as string)
                    }
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 flex-shrink-0">
                  {item.tokens.toLocaleString()} tok
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
