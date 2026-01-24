import { ContextFile } from '../../shared/types';

export interface InheritanceItem {
  path: string;
  name: string;
  file?: ContextFile;
  isGlobal?: boolean;
}

/**
 * Finds all parent context files for a given file by walking up the directory tree.
 * Returns an array of path segments and which ones have context files.
 *
 * For example, if viewing `/Users/foo/project/src/CLAUDE.md`:
 * - Checks for context files at each parent directory level
 * - Returns chain: ~/.claude/CLAUDE.md -> /project/CLAUDE.md -> /project/src/CLAUDE.md
 */
export function findInheritanceChain(
  currentFile: ContextFile,
  allFiles: ContextFile[]
): InheritanceItem[] {
  const chain: InheritanceItem[] = [];

  // Get the directory of the current file
  let dirPath = currentFile.path.substring(0, currentFile.path.lastIndexOf('/'));

  // Walk up the directory tree
  const pathStack: string[] = [];
  while (dirPath && dirPath !== '/') {
    pathStack.unshift(dirPath);
    dirPath = dirPath.substring(0, dirPath.lastIndexOf('/'));
  }

  // Build inheritance chain
  for (const dir of pathStack) {
    // Check if any context file exists in this directory
    const contextFileInDir = allFiles.find((f) => {
      const fDir = f.path.substring(0, f.path.lastIndexOf('/'));
      return fDir === dir && f.id !== currentFile.id;
    });

    const name = dir.split('/').pop() || dir;
    chain.push({
      path: dir,
      name,
      file: contextFileInDir,
    });
  }

  // Add the current file's directory
  const currentDir = currentFile.path.substring(0, currentFile.path.lastIndexOf('/'));
  const currentDirName = currentDir.split('/').pop() || currentDir;

  // Only add if not already in chain
  if (!chain.some((item) => item.path === currentDir)) {
    chain.push({
      path: currentDir,
      name: currentDirName,
      file: currentFile,
    });
  } else {
    // Update the existing entry to include the current file
    const existing = chain.find((item) => item.path === currentDir);
    if (existing) {
      existing.file = currentFile;
    }
  }

  return chain;
}

/**
 * Gets only the parent context files (excluding the current file).
 * This is useful for showing what context files are inherited.
 */
export function getParentContextFiles(
  currentFile: ContextFile,
  allFiles: ContextFile[]
): ContextFile[] {
  const parents: ContextFile[] = [];

  // Get current file's directory
  let dirPath = currentFile.path.substring(0, currentFile.path.lastIndexOf('/'));

  // Walk up looking for context files in each parent directory
  while (dirPath && dirPath !== '/') {
    // Move up one directory
    dirPath = dirPath.substring(0, dirPath.lastIndexOf('/'));
    if (!dirPath) break;

    // Find context files in this directory that match the same tool
    const parentFile = allFiles.find((f) => {
      const fDir = f.path.substring(0, f.path.lastIndexOf('/'));
      return fDir === dirPath && f.toolId === currentFile.toolId;
    });

    if (parentFile) {
      parents.unshift(parentFile); // Add to beginning to maintain order
    }
  }

  return parents;
}

/**
 * Simplifies a path by replacing the home directory with ~
 */
export function simplifyPath(path: string): string {
  const home = getHomeDir();
  if (path.startsWith(home)) {
    return '~' + path.substring(home.length);
  }
  return path;
}

/**
 * Gets the home directory path.
 */
function getHomeDir(): string {
  // In a browser/Electron renderer context, we can use the process.env
  // or make an IPC call. For now, we'll try to extract from the path.
  // This is a simplification - in production, this should come from the main process.
  if (typeof process !== 'undefined' && process.env?.HOME) {
    return process.env.HOME;
  }
  // Fallback: try to detect from a typical path pattern
  return '/Users/' + (typeof process !== 'undefined' ? process.env?.USER || 'user' : 'user');
}
