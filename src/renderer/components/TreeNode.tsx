import { useState } from 'react';
import { FileTreeNode, ContextFile, AppSettings, Template } from '../../shared/types';
import { getNodeTokenCount } from '../utils/buildFileTree';
import { ToolBadge } from './ToolBadge';

interface TreeNodeProps {
  node: FileTreeNode;
  depth: number;
  expandedPaths: Set<string>;
  selectedFile: ContextFile | null;
  settings: AppSettings | null;
  onToggleExpand: (path: string) => void;
  onSelectFile: (file: ContextFile) => void;
  onSelectFileAlternate?: (file: ContextFile) => void;
  onContextMenu: (file: ContextFile, x: number, y: number) => void;
  onFolderContextMenu: (folderPath: string, folderName: string, x: number, y: number) => void;
  onCreateFromTemplate?: (template: Template, folderPath: string) => void;
}

/**
 * Format token count in compact form
 * e.g., 1234 -> "1.2k", 45678 -> "45k", 123456 -> "123k"
 */
function formatTokenCount(tokens: number): string {
  if (tokens < 1000) {
    return tokens.toString();
  }
  if (tokens < 10000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }
  return `${Math.round(tokens / 1000)}k`;
}

/**
 * Get Tailwind classes based on token count thresholds
 * Green: < 4,000 tokens (fits comfortably)
 * Yellow: 4,000 - 8,000 tokens (medium, watch the size)
 * Red: > 8,000 tokens (large, consider splitting)
 */
function getTokenColorClass(tokens: number): string {
  if (tokens < 4000) {
    return 'text-green-600 dark:text-green-400';
  }
  if (tokens <= 8000) {
    return 'text-yellow-600 dark:text-yellow-400';
  }
  return 'text-red-600 dark:text-red-400';
}

export function TreeNode({
  node,
  depth,
  expandedPaths,
  selectedFile,
  settings,
  onToggleExpand,
  onSelectFile,
  onSelectFileAlternate,
  onContextMenu,
  onFolderContextMenu,
  onCreateFromTemplate,
}: TreeNodeProps) {
  const [isDropTarget, setIsDropTarget] = useState(false);
  const isExpanded = expandedPaths.has(node.path);
  const tokenCount = getNodeTokenCount(node);

  // Handle template drag over for directories
  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/template')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setIsDropTarget(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only handle if leaving the element itself, not children
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDropTarget(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropTarget(false);

    const templateData = e.dataTransfer.getData('application/template');
    if (templateData && onCreateFromTemplate) {
      try {
        const template = JSON.parse(templateData) as Template;
        onCreateFromTemplate(template, node.path);
      } catch (err) {
        console.error('Failed to parse template data:', err);
      }
    }
  };

  if (node.isDirectory) {
    return (
      <div className={`tree-directory ${isDropTarget ? 'template-drop-target' : ''}`}>
        <div
          className="tree-directory-header"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => onToggleExpand(node.path)}
          onContextMenu={(e) => {
            e.preventDefault();
            onFolderContextMenu(node.path, node.name, e.clientX, e.clientY);
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <span className={`tree-chevron ${isExpanded ? 'expanded' : ''}`}>
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </span>
          <span className="tree-folder-icon">
            {isExpanded ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            )}
          </span>
          <span className="flex-1 truncate text-sm font-medium">{node.name}</span>
          {tokenCount > 0 && (
            <span
              className={`text-xs font-medium ml-1 tabular-nums opacity-70 ${getTokenColorClass(tokenCount)}`}
              title={`${tokenCount.toLocaleString()} total tokens`}
            >
              {formatTokenCount(tokenCount)}
            </span>
          )}
        </div>
        {isExpanded && node.children && (
          <div className="tree-children">
            {node.children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                expandedPaths={expandedPaths}
                selectedFile={selectedFile}
                settings={settings}
                onToggleExpand={onToggleExpand}
                onSelectFile={onSelectFile}
                onSelectFileAlternate={onSelectFileAlternate}
                onContextMenu={onContextMenu}
                onFolderContextMenu={onFolderContextMenu}
                onCreateFromTemplate={onCreateFromTemplate}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // File node
  const file = node.file!;
  const isSelected = selectedFile?.id === file.id;

  // Handle drag start for sidebar file
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify(file));
    e.dataTransfer.setData('text/plain', file.path);
    e.dataTransfer.effectAllowed = 'move';
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.add('dragging');
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.remove('dragging');
    }
  };

  // Handle click with modifier key detection
  const handleClick = (e: React.MouseEvent) => {
    if ((e.metaKey || e.ctrlKey) && onSelectFileAlternate) {
      onSelectFileAlternate(file);
    } else {
      onSelectFile(file);
    }
  };

  return (
    <div
      className={`tree-file ${isSelected ? 'selected' : ''}`}
      style={{ paddingLeft: `${depth * 12 + 24}px` }}
      draggable
      onClick={handleClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(file, e.clientX, e.clientY);
      }}
    >
      <ToolBadge toolId={file.toolId} />
      <span className="flex-1 truncate text-sm">{file.name}</span>
      {file.tokens !== undefined && (
        <span
          className={`text-xs font-medium ml-1 tabular-nums ${getTokenColorClass(file.tokens)}`}
          title={`${file.tokens.toLocaleString()} tokens`}
        >
          {formatTokenCount(file.tokens)}
        </span>
      )}
    </div>
  );
}
