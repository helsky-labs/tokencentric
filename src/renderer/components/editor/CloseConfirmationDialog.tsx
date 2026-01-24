import { Modal } from '../Modal';
import { EditorTab } from '../../store/editorStore';

export type CloseConfirmationResult = 'save' | 'discard' | 'cancel';

interface CloseConfirmationDialogProps {
  isOpen: boolean;
  tabs: EditorTab[];
  onResult: (result: CloseConfirmationResult) => void;
}

export function CloseConfirmationDialog({
  isOpen,
  tabs,
  onResult,
}: CloseConfirmationDialogProps) {
  const isSingleTab = tabs.length === 1;
  const tabName = isSingleTab ? tabs[0]?.file.name : `${tabs.length} files`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => onResult('cancel')}
      title="Unsaved Changes"
      width="sm"
    >
      <div className="space-y-4">
        <p className="text-gray-700 dark:text-gray-300">
          {isSingleTab ? (
            <>
              <span className="font-medium">{tabName}</span> has unsaved changes.
              Do you want to save before closing?
            </>
          ) : (
            <>
              You have unsaved changes in <span className="font-medium">{tabName}</span>.
              Do you want to save all before closing?
            </>
          )}
        </p>

        {!isSingleTab && (
          <ul className="max-h-32 overflow-y-auto text-sm text-gray-600 dark:text-gray-400 space-y-1">
            {tabs.map((tab) => (
              <li key={tab.id} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                <span className="truncate">{tab.file.name}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => onResult('cancel')}
            className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onResult('discard')}
            className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
          >
            Don't Save
          </button>
          <button
            onClick={() => onResult('save')}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
          >
            {isSingleTab ? 'Save' : 'Save All'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
