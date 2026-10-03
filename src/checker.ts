/**
 * @fileoverview Roblox Username Generator - API Checker Module
 *
 * @description Integrates with the official Roblox Web API via RoZod for high-throughput batch checks and registration validation.
 * @author @Chrixtia
 */

import { fetchApi, isAnyErrorResponse } from 'rozod';
import { postUsernamesUsers } from 'rozod/endpoints/usersv1';
import { getUsernamesValidate } from 'rozod/endpoints/authv1';

export interface BatchCheckResult {
  taken: string[];
  unclaimed: string[];
  rateLimited: boolean;
  errorMessage?: string;
}

export interface ValidationResult {
  isValid: boolean;
  code: number | string;
  message: string;
}

/**
 * @function checkUsernameBatch
 *
 * @description Evaluates candidate usernames against the Roblox Users API in batches of up to 100 via RoZod.
 * @param usernames Array of candidate usernames to evaluate.
 * @returns Batch check result categorizing taken vs unclaimed usernames.
 */
export async function checkUsernameBatch(usernames: string[]): Promise<BatchCheckResult> {
  if (usernames.length === 0) {
    return { taken: [], unclaimed: [], rateLimited: false };
  }

  try {
    const response = await fetchApi(postUsernamesUsers, {
      body: {
        usernames,
        excludeBannedUsers: false,
      },
    });

    if (isAnyErrorResponse(response)) {
      const err = response as any;
      const is429 = err.status === 429 || (typeof err.message === 'string' && err.message.includes('429'));
      return {
        taken: [],
        unclaimed: [],
        rateLimited: is429,
        errorMessage: err.message || 'Unknown API error',
      };
    }

    const takenSet = new Set<string>();
    if (response && Array.isArray(response.data)) {
      for (const item of response.data) {
        if (item.requestedUsername) {
          takenSet.add(item.requestedUsername.toLowerCase());
        }
      }
    }

    const taken: string[] = [];
    const unclaimed: string[] = [];

    for (const name of usernames) {
      if (takenSet.has(name.toLowerCase())) {
        taken.push(name);
      } else {
        unclaimed.push(name);
      }
    }

    return {
      taken,
      unclaimed,
      rateLimited: false,
    };
  } catch (err) {
    const errorMsg = (err as Error).message || String(err);
    const is429 = errorMsg.includes('429') || errorMsg.includes('Too Many Requests');
    return {
      taken: [],
      unclaimed: [],
      rateLimited: is429,
      errorMessage: errorMsg,
    };
  }
}

/**
 * @function validateRegistration
 *
 * @description Validates whether an unclaimed candidate username can be officially registered on Roblox.
 * @param username Candidate username to check against moderation and reserved filters.
 * @returns Object indicating validity status and moderation message.
 */
export async function validateRegistration(username: string): Promise<ValidationResult> {
  try {
    const response = await fetchApi(getUsernamesValidate, {
      Username: username,
      Birthday: '2000-01-01T00:00:00.000Z',
      Context: 0,
    });

    if (isAnyErrorResponse(response)) {
      const err = response as any;
      return {
        isValid: false,
        code: err.status || 'ERROR',
        message: err.message || 'Validation request failed',
      };
    }

    const res = response as any;
    const isValid = res.code === 0 || res.code === 'ValidUsername';

    return {
      isValid,
      code: res.code,
      message: res.message || (isValid ? 'Username is valid' : 'Unavailable'),
    };
  } catch (err) {
    return {
      isValid: false,
      code: 'EXCEPTION',
      message: (err as Error).message,
    };
  }
}
