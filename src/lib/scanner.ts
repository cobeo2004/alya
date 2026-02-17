import fs from 'fs/promises';
import path from 'path';
import type { ScannedFile } from '../utils/types.js';

/**
 * Recursively scan a directory for files matching the given extensions,
 * while skipping any excluded folders.
 */
export async function scanDirectory(
  rootDir: string,
  extensions: string[],
  excludeFolders: string[],
): Promise<ScannedFile[]> {
  const excludeSet = new Set(excludeFolders);
  const results: ScannedFile[] = [];

  async function walk(currentDir: string): Promise<void> {
    let entryNames: string[];
    try {
      entryNames = await fs.readdir(currentDir);
    } catch {
      // Cannot read directory, skip
      return;
    }

    for (const entryName of entryNames) {
      if (excludeSet.has(entryName)) {
        continue;
      }

      const fullPath = path.join(currentDir, entryName);

      let stat: Awaited<ReturnType<typeof fs.stat>>;
      try {
        stat = await fs.stat(fullPath);
      } catch {
        continue;
      }

      if (stat.isDirectory()) {
        await walk(fullPath);
      } else if (stat.isFile()) {
        const ext = path.extname(entryName);
        if (extensions.includes(ext)) {
          // The folder name is the immediate parent directory
          const folderName = path.basename(currentDir);
          results.push({ filePath: fullPath, folderName });
        }
      }
    }
  }

  await walk(rootDir);
  return results;
}
