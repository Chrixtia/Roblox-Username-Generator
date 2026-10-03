/**
 * @fileoverview Roblox Username Generator - Configuration Module
 *
 * @description Handles loading, validating, and persisting runtime generator settings.
 * @author @Chrixtia
 */

import fs from 'node:fs';
import path from 'node:path';

export interface WebhookConfig {
  enabled: boolean;
  url: string;
}

export interface AppConfig {
  minLength: number;
  maxLength: number;
  batchSize: number;
  checkDelayMs: number;
  allowUnderscores: boolean;
  allowNumbers: boolean;
  validateRegistration: boolean;
  outputDir: string;
  webhook: WebhookConfig;
}

export const DEFAULT_CONFIG: AppConfig = {
  minLength: 4,
  maxLength: 5,
  batchSize: 50,
  checkDelayMs: 600,
  allowUnderscores: true,
  allowNumbers: true,
  validateRegistration: true,
  outputDir: 'results',
  webhook: {
    enabled: false,
    url: '',
  },
};

/**
 * @function loadConfig
 *
 * @description Loads generator settings from disk, applying boundary clamps and default fallbacks.
 * @param customPath Optional custom path to config.json file.
 * @returns Fully validated configuration object.
 */
export function loadConfig(customPath?: string): AppConfig {
  const filePath = customPath ?? path.resolve(process.cwd(), 'config.json');

  let loaded: Partial<AppConfig> = {};

  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8').trim();
      if (raw.length > 0) {
        loaded = JSON.parse(raw);
      }
    } catch (err) {
      console.warn(`[Config] Failed to parse ${filePath}, falling back to defaults:`, (err as Error).message);
    }
  }

  const minLength = Math.max(3, Math.min(20, Number(loaded.minLength ?? DEFAULT_CONFIG.minLength)));
  const maxLength = Math.max(minLength, Math.min(20, Number(loaded.maxLength ?? DEFAULT_CONFIG.maxLength)));
  const batchSize = Math.max(1, Math.min(100, Number(loaded.batchSize ?? DEFAULT_CONFIG.batchSize)));
  const checkDelayMs = Math.max(100, Number(loaded.checkDelayMs ?? DEFAULT_CONFIG.checkDelayMs));

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL || loaded.webhook?.url || DEFAULT_CONFIG.webhook.url;
  const webhookEnabled = Boolean(
    process.env.DISCORD_WEBHOOK_URL ? true : (loaded.webhook?.enabled ?? DEFAULT_CONFIG.webhook.enabled)
  ) && webhookUrl.trim().length > 0;

  return {
    minLength,
    maxLength,
    batchSize,
    checkDelayMs,
    allowUnderscores: loaded.allowUnderscores ?? DEFAULT_CONFIG.allowUnderscores,
    allowNumbers: loaded.allowNumbers ?? DEFAULT_CONFIG.allowNumbers,
    validateRegistration: loaded.validateRegistration ?? DEFAULT_CONFIG.validateRegistration,
    outputDir: loaded.outputDir || DEFAULT_CONFIG.outputDir,
    webhook: {
      enabled: webhookEnabled,
      url: webhookUrl,
    },
  };
}

/**
 * @function saveConfig
 *
 * @description Serializes and saves configuration settings to disk in JSON format.
 * @param config The updated configuration object to persist.
 * @param customPath Optional custom destination file path.
 */
export function saveConfig(config: AppConfig, customPath?: string): void {
  const filePath = customPath ?? path.resolve(process.cwd(), 'config.json');
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
}
