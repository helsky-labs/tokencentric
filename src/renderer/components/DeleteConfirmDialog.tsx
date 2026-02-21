import { ContextFile } from '../../shared/types';
import { Modal } from './Modal';

interface DeleteConfirmDialogProps {
  file: ContextFile | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({ file, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  if (!file) return null;

  const fileName = file.name;
  const dirPath = file.path.substring(0, file.path.lastIndexOf('/'));

  return (
    <Modal isOpen={!!file} onClose={onCancel} title="Delete File" width="sm">
      <div className="space-y-4">
        <p className="text-gray-700 dark:text-content-secondary">
          Are you sure you want to delete this file?
        </p>

        <div className="bg-light-surface dark:bg-surface-bg rounded-md p-3 border border-light-border dark:border-surface-border">
          <div className="font-medium text-gray-900 dark:text-content-primary text-sm">
            {fileName}
          </div>
          <div className="text-xs text-content-tertiary mt-1 truncate">
            {dirPath}
          </div>
        </div>

        <p className="text-sm text-amber-600 dark:text-amber-400">
          This action cannot be undone. The file will be permanently deleted.
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-content-secondary bg-light-surface dark:bg-surface-hover hover:bg-light-border dark:hover:bg-surface-hover rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
