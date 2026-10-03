/**
 * @fileoverview Roblox Username Generator - CLI Bootstrap
 *
 * @description Main application entry point routing between headless and interactive terminal modes.
 * @author @Chrixtia
 */

import { startMainMenu } from './ui/menu.js';
import { runScanner } from './ui/scanner.js';
import { loadConfig } from './config.js';

/**
 * @function main
 *
 * @description Boots the application in either headless mode or interactive menu mode.
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--start') || args.includes('-s')) {
    const config = loadConfig();
    await runScanner(config);
  } else {
    await startMainMenu();
  }
}

main().catch((err) => {
  console.error('[FATAL ERROR]', (err as Error).stack || err);
  process.exit(1);
});
