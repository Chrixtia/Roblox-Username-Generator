/**
 * @fileoverview Terminal Color Palette Utilities
 *
 * @description Provides ANSI color styling functions featuring a hot pink primary accent.
 * @author @Chrixtia
 */

/**
 * @function pink
 *
 * @description Wraps text in vibrant hot pink ANSI color codes.
 * @param text The string or number to style.
 * @returns Formatted ANSI string.
 */
export function pink(text: string | number): string {
  return `\x1b[38;2;255;105;180m${text}\x1b[39m`;
}

/**
 * @function pinkBold
 *
 * @description Wraps text in bold hot pink ANSI color codes.
 * @param text The string or number to style.
 * @returns Formatted bold ANSI string.
 */
export function pinkBold(text: string | number): string {
  return `\x1b[1m\x1b[38;2;255;105;180m${text}\x1b[22m\x1b[39m`;
}
