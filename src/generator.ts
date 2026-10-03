/**
 * @fileoverview Roblox Username Generator - Generator Engine
 *
 * @description Generates random candidate usernames respecting official Roblox naming constraints and rules.
 * @author @Chrixtia
 */

export interface GeneratorOptions {
  minLength: number;
  maxLength: number;
  allowUnderscores: boolean;
  allowNumbers: boolean;
}

const LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';

/**
 * @function generateUsername
 *
 * @description Generates a single username adhering to Roblox platform constraints.
 * @param options Configuration options including min/max length and character rules.
 * @returns A randomly generated compliant username.
 */
export function generateUsername(options: GeneratorOptions): string {
  const min = Math.max(3, Math.min(20, options.minLength));
  const max = Math.max(min, Math.min(20, options.maxLength));
  const length = Math.floor(Math.random() * (max - min + 1)) + min;

  let boundaryChars = LETTERS;
  if (options.allowNumbers) {
    boundaryChars += DIGITS;
  }

  const allChars = boundaryChars;
  const includeUnderscore = options.allowUnderscores && length >= 3 && Math.random() < 0.25;
  const underscoreIndex = includeUnderscore ? Math.floor(Math.random() * (length - 2)) + 1 : -1;

  const chars: string[] = new Array(length);

  for (let i = 0; i < length; i++) {
    if (i === underscoreIndex) {
      chars[i] = '_';
    } else if (i === 0 || i === length - 1) {
      chars[i] = boundaryChars[Math.floor(Math.random() * boundaryChars.length)];
    } else {
      chars[i] = allChars[Math.floor(Math.random() * allChars.length)];
    }
  }

  return chars.join('');
}

/**
 * @function generateUsernameBatch
 *
 * @description Generates a batch of distinct candidate usernames without duplicates.
 * @param size Target batch size to produce.
 * @param options Configuration options for generation rules.
 * @param alreadyChecked Optional set of previously generated usernames to avoid re-generating.
 * @returns An array of unique candidate usernames.
 */
export function generateUsernameBatch(
  size: number,
  options: GeneratorOptions,
  alreadyChecked?: Set<string>
): string[] {
  const result = new Set<string>();
  let attempts = 0;
  const maxAttempts = size * 10;

  while (result.size < size && attempts < maxAttempts) {
    attempts++;
    const name = generateUsername(options);
    const lower = name.toLowerCase();

    if (alreadyChecked && alreadyChecked.has(lower)) {
      continue;
    }

    result.add(name);
  }

  return Array.from(result);
}
