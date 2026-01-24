import { ContextFile, InheritanceChainItem, TokenizerType } from '../../shared/types';

export interface InheritanceItem {
  path: string;
  name: string;
  file?: ContextFile;
  isGlobal?: boolean;
}

/**
 * Builds a complete inheritance chain with token counts for hierarchical cost display.
 * Order: Global (~/.claude/CLAUDE.md) -> Parent files -> Current file
 */
export async function getInheritanceChainWithTokens(
  currentFile: ContextFile,
  allFiles: ContextFile[],
  tokenizer: TokenizerType = 'anthropic'
): Promise<InheritanceChainItem[]> {
  const chain: InheritanceChainItem[] = [];

  // 1. Get global context file (~/.claude/CLAUDE.md) if it exists
  try {
    const globalFile = await window.electronAPI.getGlobalContextFile(tokenizer);
    if (globalFile) {
      chain.push({
        path: globalFile.path,
        name: globalFile.name,
        displayPath: '~/.claude/CLAUDE.md',
        tokens: globalFile.tokens,
        isGlobal: true,
        isCurrent: false,
      });
    }
  } catch (error) {
    console.error('Failed to get global context file:', error);
  }

  // 2. Get parent context files (sorted from root to deepest)
  const parentFiles = getParentContextFiles(currentFile, allFiles);

  // 3. Get token counts for all files in the chain (if not already cached)
  const filesToCount = parentFiles.filter((f) => f.tokens === undefined);
  if (filesToCount.length > 0) {
    try {
      const tokenCounts = await window.electronAPI.countTokensBatch(
        filesToCount.map((f) => f.path),
        tokenizer
      );
      // Update cached token counts
      filesToCount.forEach((f) => {
        if (tokenCounts[f.path] !== undefined) {
          f.tokens = tokenCounts[f.path];
        }
      });
    } catch (error) {
      console.error('Failed to count tokens for parent files:', error);
    }
  }

  // 4. Add parent files to chain
  for (const file of parentFiles) {
    chain.push({
      path: file.path,
      name: file.name,
      displayPath: simplifyPath(file.path),
      file,
      tokens: file.tokens,
      isGlobal: false,
      isCurrent: false,
    });
  }

  // 5. Add current file
  // Get current file tokens if needed
  let currentTokens = currentFile.tokens;
  if (currentTokens === undefined) {
    try {
      const content = await window.electronAPI.readFile(currentFile.path);
      currentTokens = await window.electronAPI.countTokens(content, tokenizer);
    } catch (error) {
      console.error('Failed to count tokens for current file:', error);
    }
  }

  chain.push({
    path: currentFile.path,
    name: currentFile.name,
    displayPath: simplifyPath(currentFile.path),
    file: currentFile,
    tokens: currentTokens,
    isGlobal: false,
    isCurrent: true,
  });

  return chain;
}

/**
 * Calculate total tokens from an inheritance chain
 */
export function calculateTotalTokens(chain: InheritanceChainItem[]): number {
  return chain.reduce((total, item) => total + (item.tokens || 0), 0);
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
