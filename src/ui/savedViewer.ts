/**
 * @fileoverview Saved Results Viewer UI
 *
 * @description Provides an interactive interface to browse and inspect past username scanning sessions.
 * @author @Chrixtia
 */

import { select, input } from '@inquirer/prompts';
import { dim, yellow } from 'colorette';
import { UsernameStorage } from '../storage.js';
import { pinkBold } from './colors.js';

/**
 * @function runSavedViewer
 *
 * @description Lists timestamped files in the results folder and displays contents of chosen sessions.
 * @param storage Initialized UsernameStorage instance.
 */
export async function runSavedViewer(storage: UsernameStorage): Promise<void> {
  console.log();
  console.log(pinkBold('--- Saved Usernames ---'));

  const files = storage.listSavedFiles();

  if (files.length === 0) {
    console.log(yellow('\n[INFO] No saved results found yet in output directory.\n'));
    await input({ message: 'Press Enter to return to main menu...' });
    return;
  }

  console.log(`Found ${files.length} saved session file(s):\n`);

  const choices = files.map((f) => {
    const dateStr = f.timestamp > 0 ? new Date(f.timestamp * 1000).toLocaleString() : 'Unknown date';
    return {
      name: `${f.name} (${f.count} usernames) - ${dateStr}`,
      value: f.name,
    };
  });

  choices.push({ name: '[Return to Main Menu]', value: '__back__' });

  const selectedFile = await select({
    message: 'Select a file to inspect:',
    pageSize: 15,
    choices,
  });

  if (selectedFile === '__back__') {
    return;
  }

  const names = storage.getFileContent(selectedFile);
  console.log(pinkBold(`\nContents of ${selectedFile} (${names.length} usernames):`));
  console.log(dim('----------------------------------------'));
  for (const name of names) {
    console.log(`  ${name}`);
  }
  console.log(dim('----------------------------------------\n'));

  await input({ message: 'Press Enter to return to main menu...' });
}
