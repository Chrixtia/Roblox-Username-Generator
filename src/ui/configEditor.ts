/**
 * @fileoverview Configuration Settings Editor UI
 *
 * @description Provides an interactive settings dashboard with real-time in-line values, instant toggles, and pageSize: 15.
 * @author @Chrixtia
 */

import { select, input, confirm, Separator } from '@inquirer/prompts';
import { green, dim, yellow } from 'colorette';
import { AppConfig, saveConfig } from '../config.js';
import { pink, pinkBold } from './colors.js';

/**
 * @function runConfigEditor
 *
 * @description Launches the interactive settings editor, handling immediate boolean flips and persisting user changes.
 * @param config Current application configuration.
 * @returns Updated application configuration.
 */
export async function runConfigEditor(config: AppConfig): Promise<AppConfig> {
  let current = { ...config };
  let hasChanges = false;
  let editing = true;

  while (editing) {
    console.clear();
    console.log(pinkBold('+----------------------------------------------------------------+'));
    console.log(pinkBold('|                     CONFIGURATION SETTINGS                     |'));
    console.log(pinkBold('+----------------------------------------------------------------+'));
    console.log();
    if (hasChanges) {
      console.log(yellow('  * You have unsaved changes. Select [Save Changes] to persist.\n'));
    }

    const numbersLabel = current.allowNumbers ? green('Enabled') : yellow('Disabled');
    const underscoresLabel = current.allowUnderscores ? green('Enabled') : yellow('Disabled');
    const validationLabel = current.validateRegistration ? green('Enabled (Strict)') : yellow('Disabled (Fast)');
    const webhookLabel = current.webhook.enabled ? green(current.webhook.url ? 'Configured' : 'Enabled') : dim('Disabled');

    const choice = await select({
      message: 'Select a setting to modify:',
      pageSize: 15,
      choices: [
        {
          name: `[1] Length Range:         ${pink(`${current.minLength} to ${current.maxLength} chars`)}`,
          value: 'length',
        },
        {
          name: `[2] Allow Numbers:        ${numbersLabel}`,
          value: 'numbers',
        },
        {
          name: `[3] Allow Underscores:    ${underscoresLabel}`,
          value: 'underscores',
        },
        {
          name: `[4] Batch Size:           ${pink(`${current.batchSize} names/request`)}`,
          value: 'batch',
        },
        {
          name: `[5] Request Delay:        ${pink(`${current.checkDelayMs} ms`)}`,
          value: 'delay',
        },
        {
          name: `[6] Sign-up Validation:   ${validationLabel}`,
          value: 'validation',
        },
        {
          name: `[7] Output Directory:     ${pink(`${current.outputDir}/`)}`,
          value: 'outputDir',
        },
        {
          name: `[8] Discord Webhook:      ${webhookLabel}`,
          value: 'webhook',
        },
        new Separator(),
        {
          name: `[S] Save Changes`,
          value: 'save',
        },
        {
          name: `[B] Back to Main Menu`,
          value: 'back',
        },
      ],
    });

    if (choice === 'numbers') {
      current.allowNumbers = !current.allowNumbers;
      hasChanges = true;
    } else if (choice === 'underscores') {
      current.allowUnderscores = !current.allowUnderscores;
      hasChanges = true;
    } else if (choice === 'validation') {
      current.validateRegistration = !current.validateRegistration;
      hasChanges = true;
    } else if (choice === 'length') {
      console.log();
      const minStr = await input({
        message: 'Minimum username length (3 - 20):',
        default: current.minLength.toString(),
      });
      const maxStr = await input({
        message: 'Maximum username length (3 - 20):',
        default: current.maxLength.toString(),
      });
      const min = Math.max(3, Math.min(20, parseInt(minStr, 10) || current.minLength));
      const max = Math.max(min, Math.min(20, parseInt(maxStr, 10) || current.maxLength));
      current.minLength = min;
      current.maxLength = max;
      hasChanges = true;
    } else if (choice === 'batch') {
      console.log();
      const bStr = await input({
        message: 'Batch size per request (1 - 100):',
        default: current.batchSize.toString(),
      });
      current.batchSize = Math.max(1, Math.min(100, parseInt(bStr, 10) || current.batchSize));
      hasChanges = true;
    } else if (choice === 'delay') {
      console.log();
      const dStr = await input({
        message: 'Request delay in milliseconds (min 100):',
        default: current.checkDelayMs.toString(),
      });
      current.checkDelayMs = Math.max(100, parseInt(dStr, 10) || current.checkDelayMs);
      hasChanges = true;
    } else if (choice === 'outputDir') {
      console.log();
      const dir = await input({
        message: 'Output directory name:',
        default: current.outputDir,
      });
      if (dir.trim()) {
        current.outputDir = dir.trim();
        hasChanges = true;
      }
    } else if (choice === 'webhook') {
      console.log();
      const enable = await confirm({
        message: 'Enable Discord webhook notifications?',
        default: current.webhook.enabled,
      });
      let url = current.webhook.url;
      if (enable) {
        url = await input({
          message: 'Discord webhook URL:',
          default: current.webhook.url,
        });
      }
      current.webhook = {
        enabled: enable && url.trim().length > 0,
        url: url.trim(),
      };
      hasChanges = true;
    } else if (choice === 'save') {
      saveConfig(current);
      hasChanges = false;
      editing = false;
      return current;
    } else if (choice === 'back') {
      if (hasChanges) {
        const wantSave = await confirm({
          message: 'You have unsaved changes. Would you like to save before returning?',
          default: true,
        });
        if (wantSave) {
          saveConfig(current);
          return current;
        }
      }
      editing = false;
      return config;
    }
  }

  return current;
}
