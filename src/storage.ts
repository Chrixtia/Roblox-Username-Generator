/**
 * @fileoverview Roblox Username Generator - Storage Module
 *
 * @description Manages session file persistence and cross-file deduplication in the results directory.
 * @author @Chrixtia
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * @class UsernameStorage
 *
 * @description Coordinates file writing, directory initialization, and username deduplication across sessions.
 * @author @Chrixtia
 */
export class UsernameStorage {
  private outputDir: string;
  private sessionTimestamp: number;
  private sessionFilePath: string;
  private savedSet = new Set<string>();

  /**
   * @constructor
   *
   * @description Initializes storage targeting the designated output folder and session timestamp.
   * @param outputDir Target folder name or path for result files.
   * @param customTimestamp Optional Unix timestamp to name the session file.
   */
  constructor(outputDir = 'results', customTimestamp?: number) {
    this.outputDir = path.isAbsolute(outputDir) ? outputDir : path.resolve(process.cwd(), outputDir);
    this.sessionTimestamp = customTimestamp ?? Math.floor(Date.now() / 1000);

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    this.sessionFilePath = path.join(this.outputDir, `${this.sessionTimestamp}.txt`);
    this.initExisting();
  }

  private initExisting(): void {
    try {
      const files = fs.readdirSync(this.outputDir);
      for (const file of files) {
        if (file.endsWith('.txt')) {
          const fullPath = path.join(this.outputDir, file);
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
          for (const line of lines) {
            this.savedSet.add(line.toLowerCase());
          }
        }
      }
    } catch (err) {
      console.warn(`[Storage] Could not read existing files in ${this.outputDir}:`, (err as Error).message);
    }
  }

  /**
   * @method isAlreadySaved
   *
   * @description Checks if a username has already been registered in storage.
   * @param username The username to check.
   * @returns True if already present, false otherwise.
   */
  public isAlreadySaved(username: string): boolean {
    return this.savedSet.has(username.toLowerCase());
  }

  /**
   * @method saveUsername
   *
   * @description Appends an available username to the active session file.
   * @param username The username to persist.
   * @returns True if newly saved, false if previously recorded.
   */
  public async saveUsername(username: string): Promise<boolean> {
    const lower = username.toLowerCase();
    if (this.savedSet.has(lower)) {
      return false;
    }

    this.savedSet.add(lower);
    await fs.promises.appendFile(this.sessionFilePath, `${username}\n`, 'utf-8');
    return true;
  }

  /**
   * @method getSessionFilePath
   *
   * @description Returns the absolute file path of the current session file.
   * @returns Absolute path to session file.
   */
  public getSessionFilePath(): string {
    return this.sessionFilePath;
  }

  /**
   * @method getSessionFileName
   *
   * @description Returns the file name of the current session file.
   * @returns Formatted filename like `<timestamp>.txt`.
   */
  public getSessionFileName(): string {
    return `${this.sessionTimestamp}.txt`;
  }

  /**
   * @method getSavedCount
   *
   * @description Returns the total number of unique saved usernames in storage.
   * @returns Number of unique saved usernames.
   */
  public getSavedCount(): number {
    return this.savedSet.size;
  }

  /**
   * @method listSavedFiles
   *
   * @description Scans and lists all saved result text files in the output directory.
   * @returns Array of file metadata objects ordered by newest timestamp first.
   */
  public listSavedFiles(): { name: string; fullPath: string; count: number; timestamp: number }[] {
    if (!fs.existsSync(this.outputDir)) {
      return [];
    }

    const files = fs.readdirSync(this.outputDir);
    const result: { name: string; fullPath: string; count: number; timestamp: number }[] = [];

    for (const file of files) {
      if (file.endsWith('.txt')) {
        const fullPath = path.join(this.outputDir, file);
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const count = content.split(/\r?\n/).filter((l) => l.trim().length > 0).length;
          const ts = parseInt(file.replace('.txt', ''), 10) || 0;
          result.push({ name: file, fullPath, count, timestamp: ts });
        } catch {
          // Skip unreadable files
        }
      }
    }

    return result.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * @method getFileContent
   *
   * @description Reads and returns the list of usernames saved within a specific result file.
   * @param filename Target file name within the output directory.
   * @returns Array of trimmed usernames from the file.
   */
  public getFileContent(filename: string): string[] {
    const targetPath = path.join(this.outputDir, filename);
    if (!fs.existsSync(targetPath)) {
      return [];
    }
    const content = fs.readFileSync(targetPath, 'utf-8');
    return content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  }
}
