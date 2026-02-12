import { useState, useEffect, useCallback, useRef } from 'react';
import { ConfigItem } from '../../shared/types';

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
        className="w-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-400 mr-2 text-sm">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands, agents..."
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 outline-none placeholder-gray-400"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-400 rounded border border-gray-200 dark:border-gray-600">
            esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto">
          {results.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400 dark:text-gray-500">
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
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }
                `}
              >
                <span className="text-sm">
                  {item.category === 'command' ? '⚡' : '🤖'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
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
