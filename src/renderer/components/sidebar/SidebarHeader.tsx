import { LogoMark } from '../Logo';
import { ToolProfile } from '../../../shared/types';

interface SidebarHeaderProps {
  onScanDirectory: () => void;
  onNewFile: () => void;
  onOpenSettings: () => void;
  toolFilter: string;
  onToolFilterChange: (value: string) => void;
  availableTools: ToolProfile[];
  totalFiles: number;
}

/**
 * Compact header with logo and action buttons for the sidebar.
 */
export function SidebarHeader({
  onScanDirectory,
  onNewFile,
  onOpenSettings,
  toolFilter,
  onToolFilterChange,
  availableTools,
  totalFiles,
}: SidebarHeaderProps) {
  return (
    <div className="border-b border-light-border dark:border-surface-border">
      {/* Branding Header */}
      <div className="p-3 border-b border-light-border dark:border-surface-border">
        <div className="flex items-center gap-2">
          <LogoMark size={28} />
          <span className="font-semibold text-gray-800 dark:text-content-primary">Tokencentric</span>
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={onScanDirectory}
            className="flex-1 px-3 py-2 text-sm bg-brand-teal hover:bg-brand-teal-bright text-white rounded-md transition-colors"
          >
            Scan Directory
          </button>
          <button
            onClick={onNewFile}
            className="px-3 py-2 text-sm bg-surface-card hover:bg-surface-hover text-white rounded-md transition-colors"
            title="New File (Cmd+N)"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={onOpenSettings}
            className="px-3 py-2 text-sm bg-light-border dark:bg-surface-hover hover:bg-light-border dark:hover:bg-surface-hover text-gray-700 dark:text-content-secondary rounded-md transition-colors"
            title="Settings (Cmd+,)"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* Tool filter dropdown */}
        {availableTools.length > 1 && (
          <select
            value={toolFilter}
            onChange={(e) => onToolFilterChange(e.target.value)}
            className="w-full px-2 py-1.5 text-sm bg-light-bg dark:bg-surface-bg border border-light-border dark:border-surface-border rounded-md text-gray-700 dark:text-content-secondary"
          >
            <option value="all">All Tools ({totalFiles})</option>
            {availableTools.map((tool) => (
              <option key={tool.id} value={tool.id}>
                {tool.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
