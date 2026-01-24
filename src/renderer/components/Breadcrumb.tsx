import { ContextFile } from '../../shared/types';
import { getParentContextFiles, simplifyPath } from '../utils/findInheritanceChain';

interface BreadcrumbProps {
  selectedFile: ContextFile;
  allFiles: ContextFile[];
  onSelectFile: (file: ContextFile) => void;
}

/**
 * Displays the inheritance chain for a selected context file.
 * Shows parent context files that would be inherited by the AI.
 */
export function Breadcrumb({ selectedFile, allFiles, onSelectFile }: BreadcrumbProps) {
  const parentFiles = getParentContextFiles(selectedFile, allFiles);

  // If no parent files, just show the current file's directory
  if (parentFiles.length === 0) {
    const currentDir = selectedFile.path.substring(0, selectedFile.path.lastIndexOf('/'));
    const simplifiedPath = simplifyPath(currentDir);

    return (
      <div className="breadcrumb-container">
        <span className="breadcrumb-path" title={currentDir}>
          {simplifiedPath}
        </span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{selectedFile.name}</span>
      </div>
    );
  }

  return (
    <div className="breadcrumb-container">
      <span className="breadcrumb-label">Inherits from:</span>
      {parentFiles.map((file, index) => (
        <span key={file.id} className="breadcrumb-item-wrapper">
          {index > 0 && <span className="breadcrumb-arrow">→</span>}
          <button
            className="breadcrumb-item"
            onClick={() => onSelectFile(file)}
            title={file.path}
          >
            {getDisplayName(file)}
          </button>
        </span>
      ))}
      <span className="breadcrumb-arrow">→</span>
      <span className="breadcrumb-current" title={selectedFile.path}>
        {selectedFile.name}
      </span>
    </div>
  );
}

/**
 * Gets a short display name for a file in the breadcrumb.
 * Uses the parent folder name + file name for context.
 */
function getDisplayName(file: ContextFile): string {
  const parts = file.path.split('/');
  if (parts.length >= 2) {
    // Return parent folder + filename
    return `${parts[parts.length - 2]}/${file.name}`;
  }
  return file.name;
}
