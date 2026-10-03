/**
 * @fileoverview Main Menu Router Module
 *
 * @description Coordinates the top-level interactive terminal CLI menu using @inquirer/prompts.
 * @author @Chrixtia
 */

import { select } from '@inquirer/prompts';
import { bold, dim, green } from 'colorette';
import { loadConfig, AppConfig } from '../config.js';
import { UsernameStorage } from '../storage.js';
import { runScanner } from './scanner.js';
import { runAdHocChecker } from './adHocChecker.js';
import { runConfigEditor } from './configEditor.js';
import { runSavedViewer } from './savedViewer.js';
import { pink, pinkBold } from './colors.js';

/**
 * @function printAsciiBanner
 *
 * @description Renders the main ASCII header banner with pink accents and author credit.
 */
export function printAsciiBanner(): void {
  console.clear();
  console.log(pinkBold('+----------------------------------------------------------------+'));
  console.log(pinkBold('|                   ROBLOX USERNAME GENERATOR                    |'));
  console.log(pinkBold('|                 Powered by RoZod & TypeScript                  |'));
  console.log(pinkBold('|                        GitHub @Chrixtia                        |'));
  console.log(pinkBold('+----------------------------------------------------------------+'));
  console.log();
}

/**
 * @function startMainMenu
 *
 * @description Runs the primary interactive menu loop, routing user choices to corresponding UI actions.
 */
export async function startMainMenu(): Promise<void> {
  let config: AppConfig = loadConfig();

  while (true) {
    printAsciiBanner();
    const storage = new UsernameStorage(config.outputDir);

    console.log(bold('Status:'));
    console.log(`  Length Range:    ${pink(`${config.minLength}-${config.maxLength}`)} chars`);
    console.log(`  Batch Size:      ${pink(config.batchSize.toString())} names/request`);
    console.log(`  Output Folder:   ${pink(`${config.outputDir}/`)}`);
    console.log(`  Saved in Storage:${pink(storage.getSavedCount().toString())} usernames`);
    console.log();

    try {
      const choice = await select({
        message: 'Select an action:',
        choices: [
          { name: '[1] Start Generating Usernames', value: 'start' },
          { name: '[2] Check Specific Username(s)', value: 'check' },
          { name: '[3] Configure Settings (Length, Batch, Webhook)', value: 'config' },
          { name: '[4] View Saved Usernames', value: 'saved' },
          { name: '[5] Exit', value: 'exit' },
        ],
      });

      if (choice === 'start') {
        await runScanner(config);
      } else if (choice === 'check') {
        await runAdHocChecker();
      } else if (choice === 'config') {
        config = await runConfigEditor(config);
      } else if (choice === 'saved') {
        await runSavedViewer(storage);
      } else if (choice === 'exit') {
        console.log(green('\n[INFO] Exiting Roblox Username Generator. Goodbye!\n'));
        process.exit(0);
      }
    } catch {
      console.log(dim('\n[INFO] Exiting...'));
      process.exit(0);
    }
  }
}
