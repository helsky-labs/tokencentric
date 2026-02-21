import { useState, useEffect, useCallback } from 'react';
import { StarterPackMeta } from '../../../shared/builtinPacks';
import { PackCard } from '../packs/PackCard';
import { PackDetailModal } from '../packs/PackDetailModal';
import { InstallPreviewDialog } from '../packs/InstallPreviewDialog';
import { ExportDialog } from '../packs/ExportDialog';
import { ToolIcon } from '../components/ToolIcon';

interface StarterPacksViewProps {
  isDark: boolean;
}

export function StarterPacksView({ isDark }: StarterPacksViewProps) {
  const [packs, setPacks] = useState<StarterPackMeta[]>([]);
  const [importedPacks, setImportedPacks] = useState<StarterPackMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [installingPack, setInstallingPack] = useState<StarterPackMeta | null>(null);
  const [detailPack, setDetailPack] = useState<StarterPackMeta | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadPacks = useCallback(async () => {
    try {
      const builtins = await window.electronAPI.getStarterPacks();
      setPacks(builtins);
    } catch (error) {
      console.error('Failed to load starter packs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPacks();
  }, [loadPacks]);

  const allPacks = [...packs, ...importedPacks];

  async function handleInstall(selectedFiles: string[], overwrite: boolean) {
    if (!installingPack) return;
    try {
      const result = await window.electronAPI.installStarterPack(
        installingPack.id,
        selectedFiles,
        overwrite
      );
      const parts: string[] = [];
      if (result.installed.length > 0) parts.push(`Installed ${result.installed.length} file(s)`);
      if (result.skipped.length > 0) parts.push(`Skipped ${result.skipped.length} existing`);
      if (result.errors.length > 0) parts.push(`${result.errors.length} error(s)`);
      setResultMessage({
        type: result.errors.length > 0 ? 'error' : 'success',
        text: parts.join('. '),
      });
      setInstallingPack(null);
      // Auto-dismiss after 5 seconds
      setTimeout(() => setResultMessage(null), 5000);
    } catch (error) {
      setResultMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Installation failed',
      });
      setInstallingPack(null);
    }
  }

  async function handleExport(options: { name: string; description: string; includeCommands: boolean; includeAgents: boolean; includeSettings: boolean }) {
    try {
      const filePath = await window.electronAPI.exportStarterPack(options);
      setShowExport(false);
      setResultMessage({ type: 'success', text: `Exported to ${filePath}` });
      setTimeout(() => setResultMessage(null), 5000);
    } catch (error) {
      if (error instanceof Error && error.message === 'Export cancelled') {
        // User cancelled, do nothing
        return;
      }
      setResultMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Export failed',
      });
    }
  }

  async function handleImport() {
    try {
      const imported = await window.electronAPI.importStarterPack();
      if (imported) {
        setImportedPacks((prev) => [...prev, imported]);
        setResultMessage({ type: 'success', text: `Imported "${imported.pack.name}"` });
        setTimeout(() => setResultMessage(null), 5000);
      }
    } catch (error) {
      setResultMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Import failed',
      });
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-content-primary">
              Starter Packs
            </h2>
            <p className="text-xs text-gray-500 dark:text-content-tertiary mt-0.5">
              Pre-built config bundles you can install with one click
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleImport}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-content-tertiary border border-light-border dark:border-surface-border hover:bg-light-surface dark:hover:bg-surface-hover rounded-md transition-colors"
            >
              Import .tcpack
            </button>
            <button
              onClick={() => setShowExport(true)}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
            >
              Export My Config
            </button>
          </div>
        </div>

        {/* Result message */}
        {resultMessage && (
          <div
            className={`mb-4 px-4 py-2 rounded-md text-xs font-medium ${
              resultMessage.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}
          >
            {resultMessage.text}
          </div>
        )}

        {/* Pack grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allPacks.map((packMeta) => (
            <PackCard
              key={packMeta.id}
              packMeta={packMeta}
              onInstall={setInstallingPack}
              onViewDetails={setDetailPack}
            />
          ))}
        </div>

        {allPacks.length === 0 && (
          <div className="text-center py-12 text-gray-400 dark:text-content-tertiary">
            <div className="mb-3 text-gray-400 dark:text-content-tertiary"><ToolIcon toolId="package" size={40} /></div>
            <div className="text-sm">No starter packs available.</div>
            <div className="text-xs mt-1">Import a .tcpack file or export your current config.</div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detailPack && (
        <PackDetailModal
          packMeta={detailPack}
          onClose={() => setDetailPack(null)}
          onInstall={(pm) => {
            setDetailPack(null);
            setInstallingPack(pm);
          }}
        />
      )}

      {/* Install preview dialog */}
      {installingPack && (
        <InstallPreviewDialog
          packMeta={installingPack}
          onInstall={handleInstall}
          onCancel={() => setInstallingPack(null)}
        />
      )}

      {/* Export dialog */}
      {showExport && (
        <ExportDialog
          onExport={handleExport}
          onCancel={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
