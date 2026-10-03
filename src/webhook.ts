/**
 * @fileoverview Roblox Username Generator - Webhook Notifier Module
 *
 * @description Dispatches rich Discord webhook embeds when valid usernames are discovered.
 * @author @Chrixtia
 */

import { WebhookConfig } from './config.js';

/**
 * @class DiscordNotifier
 *
 * @description Manages formatting and transmission of Discord webhook embeds.
 * @author @Chrixtia
 */
export class DiscordNotifier {
  private config: WebhookConfig;

  /**
   * @constructor
   *
   * @description Initializes notifier with webhook configuration settings.
   * @param config The active webhook configuration.
   */
  constructor(config: WebhookConfig) {
    this.config = config;
  }

  /**
   * @method notifyAvailable
   *
   * @description Sends a Discord embed notification when an available username is discovered.
   * @param username The newly discovered available username.
   */
  public async notifyAvailable(username: string): Promise<void> {
    if (!this.config.enabled || !this.config.url) {
      return;
    }

    const payload = {
      embeds: [
        {
          title: 'New Roblox Username Available',
          color: 0x00e3fd,
          fields: [
            {
              name: 'Username',
              value: `\`${username}\``,
              inline: true,
            },
            {
              name: 'Length',
              value: `${username.length} characters`,
              inline: true,
            },
            {
              name: 'Quick Links',
              value: `[Register Here](https://www.roblox.com/signup) • [Roblox Profile](https://www.roblox.com/search/users?keyword=${encodeURIComponent(username)})`,
              inline: false,
            },
          ],
          footer: {
            text: 'Roblox Username Generator • Powered by RoZod',
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    try {
      const response = await fetch(this.config.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.warn(`[Webhook] Discord webhook failed with HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.warn(`[Webhook] Error sending Discord notification:`, (err as Error).message);
    }
  }
}
