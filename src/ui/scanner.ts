/**
 * @fileoverview Username Scanning Engine
 *
 * @description Manages real-time username generation, RoZod queries, and a pinned bottom status line.
 * @author @Chrixtia
 */

import { green, yellow, red, bold, dim } from 'colorette';
import { input } from '@inquirer/prompts';
import { AppConfig } from '../config.js';
import { generateUsernameBatch } from '../generator.js';
import { checkUsernameBatch, validateRegistration } from '../checker.js';
import { UsernameStorage } from '../storage.js';
import { DiscordNotifier } from '../webhook.js';
import { pink, pinkBold } from './colors.js';

/**
 * @function sleep
 *
 * @description Pauses process execution for the given duration in milliseconds.
 * @param ms Delay duration in milliseconds.
 * @returns Promise that resolves after the timeout.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @function runScanner
 *
 * @description Executes the scanning loop, pinning live metrics to the bottom and logging hits above.
 * @param config Active generator configuration settings.
 */
export async function runScanner(config: AppConfig): Promise<void> {
  const sessionTimestamp = Math.floor(Date.now() / 1000);
  const storage = new UsernameStorage(config.outputDir, sessionTimestamp);
  const notifier = new DiscordNotifier(config.webhook);

  console.log();
  console.log(pinkBold('+----------------------------------------------------------------+'));
  console.log(pinkBold('|                  STARTING USERNAME SCANNER                     |'));
  console.log(pinkBold('+----------------------------------------------------------------+'));
  console.log();
  console.log(bold('Session Parameters:'));
  console.log(`  Length Range:        ${pink(`${config.minLength} - ${config.maxLength}`)} characters`);
  console.log(`  Batch Size:          ${pink(config.batchSize.toString())} names/request`);
  console.log(`  Delay:               ${pink(`${config.checkDelayMs}ms`)}`);
  console.log(`  Allow Numbers:       ${config.allowNumbers ? 'Yes' : 'No'}`);
  console.log(`  Allow Underscores:   ${config.allowUnderscores ? 'Yes' : 'No'}`);
  console.log(`  Validation:          ${config.validateRegistration ? 'Strict (Registration check)' : 'Users API only'}`);
  console.log(`  Output File:         ${pink(storage.getSessionFilePath())}`);
  console.log(`  Discord Webhook:     ${config.webhook.enabled ? 'Active' : 'Disabled'}`);
  console.log();
  console.log(dim('------------------------------------------------------------------\n'));

  let totalChecked = 0;
  let totalFound = 0;
  const startTime = Date.now();
  const checkedHistory = new Set<string>();
  let isRunning = true;
  let activeStatusLine = '';

  const logAbove = (text: string): void => {
    process.stdout.write('\r\x1b[2K');
    console.log(text);
    if (activeStatusLine) {
      process.stdout.write(activeStatusLine);
    }
  };

  const updateStatus = (line: string): void => {
    activeStatusLine = line;
    process.stdout.write(`\r\x1b[2K${line}`);
  };

  const onKeypress = (chunk: Buffer | string) => {
    const key = chunk.toString();
    if (key === '\u0011' || key === 'q' || key === 'Q' || key === '\u0003') {
      isRunning = false;
    }
  };

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', onKeypress);
  }

  const onSigInt = () => {
    isRunning = false;
  };
  process.on('SIGINT', onSigInt);

  while (isRunning) {
    const batch = generateUsernameBatch(
      config.batchSize,
      {
        minLength: config.minLength,
        maxLength: config.maxLength,
        allowNumbers: config.allowNumbers,
        allowUnderscores: config.allowUnderscores,
      },
      checkedHistory
    );

    if (batch.length === 0) {
      checkedHistory.clear();
      continue;
    }

    for (const name of batch) {
      checkedHistory.add(name.toLowerCase());
    }

    const result = await checkUsernameBatch(batch);

    if (result.rateLimited) {
      logAbove(yellow('[RATE LIMITED] Roblox API rate limit encountered. Waiting 8s...'));
      await sleep(8000);
      continue;
    }

    if (result.errorMessage) {
      logAbove(red(`[API ERROR] ${result.errorMessage}`));
      await sleep(2000);
      continue;
    }

    totalChecked += batch.length;

    for (const candidate of result.unclaimed) {
      if (storage.isAlreadySaved(candidate)) {
        continue;
      }

      let isConfirmedAvailable = true;

      if (config.validateRegistration) {
        const validation = await validateRegistration(candidate);
        if (!validation.isValid) {
          isConfirmedAvailable = false;
        }
      }

      if (isConfirmedAvailable) {
        const newlySaved = await storage.saveUsername(candidate);
        if (newlySaved) {
          totalFound++;
          logAbove(
            `${green(bold(`[AVAILABLE] >> ${candidate} <<`))}\n${dim(
              `   Saved: ${storage.getSessionFileName()} | Length: ${candidate.length}`
            )}`
          );
          await notifier.notifyAvailable(candidate);
        }
      }
    }

    const elapsedSec = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    const rate = Math.round(totalChecked / elapsedSec);
    const statusLine = `${dim('[STATUS]')} Checked: ${pink(totalChecked.toLocaleString())} | Found: ${green(
      totalFound.toString()
    )} | Rate: ${pink(`${rate}/s`)} | ${dim('[Ctrl+Q to stop]')}`;

    updateStatus(statusLine);

    if (config.checkDelayMs > 0 && isRunning) {
      await sleep(config.checkDelayMs);
    }
  }

  if (process.stdin.isTTY) {
    process.stdin.removeListener('data', onKeypress);
    process.stdin.setRawMode(false);
    process.stdin.pause();
  }
  process.removeListener('SIGINT', onSigInt);

  process.stdout.write('\r\x1b[2K');
  console.log(yellow(bold('[STOPPED] Scanner paused.')));
  const elapsedSec = Math.max(1, Math.round((Date.now() - startTime) / 1000));
  const rate = Math.round(totalChecked / elapsedSec);
  console.log(bold('Session Summary:'));
  console.log(`  Scanned:             ${pink(totalChecked.toLocaleString())}`);
  console.log(`  Available Found:     ${green(totalFound.toLocaleString())}`);
  console.log(`  Saved to:            ${pink(storage.getSessionFilePath())}`);
  console.log(`  Duration:            ${elapsedSec}s (${rate} checks/sec)\n`);

  await input({ message: 'Press Enter to return to main menu...' });
}
