import { ContextFile, FileTreeNode } from '../../shared/types';

/**
 * Builds a tree structure from a flat array of context files.
 * Groups files by their directory paths and creates a hierarchical tree.
 */
export function buildFileTree(files: ContextFile[]): FileTreeNode[] {
  if (files.length === 0) return [];

  // Find the common root path
  const paths = files.map((f) => f.path);
  const commonRoot = findCommonRoot(paths);

  // Build a map of path -> node
  const nodeMap = new Map<string, FileTreeNode>();

  // First pass: create all directory nodes and file nodes
  for (const file of files) {
    // Create file node
    const fileNode: FileTreeNode = {
      name: file.name,
      path: file.path,
      isDirectory: false,
      file,
    };
    nodeMap.set(file.path, fileNode);

    // Create all parent directory nodes
    let dirPath = file.path.substring(0, file.path.lastIndexOf('/'));
    while (dirPath && dirPath.length >= commonRoot.length) {
      if (!nodeMap.has(dirPath)) {
        const dirName = dirPath.split('/').pop() || dirPath;
        nodeMap.set(dirPath, {
          name: dirName,
          path: dirPath,
          isDirectory: true,
          children: [],
        });
      }
      dirPath = dirPath.substring(0, dirPath.lastIndexOf('/'));
    }
  }

  // Second pass: link children to parents
  for (const [path, node] of nodeMap) {
    if (!node.isDirectory) {
      const parentPath = path.substring(0, path.lastIndexOf('/'));
      const parent = nodeMap.get(parentPath);
      if (parent && parent.children) {
        parent.children.push(node);
      }
    } else if (node.children) {
      const parentPath = path.substring(0, path.lastIndexOf('/'));
      const parent = nodeMap.get(parentPath);
      if (parent && parent.children) {
        parent.children.push(node);
      }
    }
  }

  // Find root nodes (nodes whose parent is not in the map)
  const rootNodes: FileTreeNode[] = [];
  for (const [path, node] of nodeMap) {
    const parentPath = path.substring(0, path.lastIndexOf('/'));
    if (!nodeMap.has(parentPath) || parentPath.length < commonRoot.length) {
      rootNodes.push(node);
    }
  }

  // Sort all children: directories first, then alphabetically
  sortTree(rootNodes);

  return rootNodes;
}

/**
 * Finds the longest common path prefix among all file paths.
 */
function findCommonRoot(paths: string[]): string {
  if (paths.length === 0) return '';
  if (paths.length === 1) {
    return paths[0].substring(0, paths[0].lastIndexOf('/'));
  }

  const parts = paths.map((p) => p.split('/'));
  const minLength = Math.min(...parts.map((p) => p.length));
  const commonParts: string[] = [];

  for (let i = 0; i < minLength - 1; i++) {
    const part = parts[0][i];
    if (parts.every((p) => p[i] === part)) {
      commonParts.push(part);
    } else {
      break;
    }
  }

  return commonParts.join('/');
}

/**
 * Recursively sorts tree nodes: directories first, then alphabetically by name.
 */
function sortTree(nodes: FileTreeNode[]): void {
  nodes.sort((a, b) => {
    // Directories come first
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    // Then sort alphabetically
    return a.name.localeCompare(b.name);
  });

  for (const node of nodes) {
    if (node.children && node.children.length > 0) {
      sortTree(node.children);
    }
  }
}

/**
 * Calculates the total token count for a tree node.
 * For files, returns the file's token count.
 * For directories, returns the sum of all descendant files' token counts.
 */
export function getNodeTokenCount(node: FileTreeNode): number {
  if (!node.isDirectory && node.file) {
    return node.file.tokens || 0;
  }

  if (node.children) {
    return node.children.reduce((sum, child) => sum + getNodeTokenCount(child), 0);
  }

  return 0;
}

/**
 * Gets all paths that should be expanded to show a specific file.
 */
export function getExpandedPathsForFile(filePath: string): string[] {
  const paths: string[] = [];
  let dirPath = filePath.substring(0, filePath.lastIndexOf('/'));

  while (dirPath) {
    paths.push(dirPath);
    const lastSlash = dirPath.lastIndexOf('/');
    if (lastSlash <= 0) break;
    dirPath = dirPath.substring(0, lastSlash);
  }

  return paths;
}

/**
 * Flattens a tree back into an array of files (for iteration).
 */
export function flattenTree(nodes: FileTreeNode[]): ContextFile[] {
  const files: ContextFile[] = [];

  function traverse(node: FileTreeNode) {
    if (!node.isDirectory && node.file) {
      files.push(node.file);
    }
    if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  for (const node of nodes) {
    traverse(node);
  }

  return files;
}
