/**
 * @fileoverview Ad-hoc Username Checker UI
 *
 * @description Provides an interactive prompt allowing users to query individual usernames in real time.
 * @author @Chrixtia
 */

import { input } from '@inquirer/prompts';
import { green, red, yellow, bold, dim } from 'colorette';
import { checkUsernameBatch, validateRegistration } from '../checker.js';
import { pinkBold } from './colors.js';

/**
 * @function runAdHocChecker
 *
 * @description Prompts the user for specific usernames, querying RoZod and formatting status badges.
 */
export async function runAdHocChecker(): Promise<void> {
  console.log();
  console.log(pinkBold('--- Check Specific Username(s) ---'));
  console.log(dim('Check if specific Roblox usernames are available or taken.\n'));

  const rawInput = await input({
    message: 'Enter username(s) separated by spaces or commas:',
  });

  const names = rawInput
    .split(/[\s,]+/)
    .map((n) => n.trim())
    .filter((n) => n.length > 0);

  if (names.length === 0) {
    console.log(yellow('\n[INFO] No usernames provided.\n'));
    return;
  }

  console.log(dim(`\nChecking ${names.length} username(s) via Roblox API...\n`));

  const batchResult = await checkUsernameBatch(names);

  if (batchResult.rateLimited) {
    console.log(yellow('[WARNING] Rate limited by Roblox API. Please try again later.'));
    return;
  }

  if (batchResult.errorMessage) {
    console.log(red(`[ERROR] API request failed: ${batchResult.errorMessage}`));
    return;
  }

  console.log(bold('Results:'));

  for (const name of names) {
    const isTaken = batchResult.taken.some((t) => t.toLowerCase() === name.toLowerCase());

    if (isTaken) {
      console.log(`  ${red('[TAKEN]')}      ${bold(name)} (Already registered)`);
    } else {
      const validation = await validateRegistration(name);
      if (validation.isValid) {
        console.log(`  ${green('[AVAILABLE]')}  ${bold(name)} (Ready to register: https://www.roblox.com/signup)`);
      } else {
        console.log(`  ${yellow('[MODERATED]')}  ${bold(name)} (${validation.message})`);
      }
    }
  }

  console.log();
  await input({ message: 'Press Enter to return to main menu...' });
}
