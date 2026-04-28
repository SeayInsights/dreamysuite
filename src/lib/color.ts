/**
 * Color Conversion Utilities
 *
 * Functions for converting between hex and RGB color formats.
 */

/**
 * Parse a hex color string to RGB tuple
 *
 * Accepts both `#rrggbb` and `rrggbb` formats (case-insensitive).
 * Invalid inputs return white `[255, 255, 255]`.
 *
 * @param hex - Hex color string (e.g., "#ff0000" or "ff0000")
 * @returns RGB tuple [r, g, b] where each value is 0-255
 *
 * @example
 * hexToRgb('#ff0000') // [255, 0, 0] (red)
 * hexToRgb('00ff00')  // [0, 255, 0] (green)
 * hexToRgb('invalid') // [255, 255, 255] (white fallback)
 */
export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return [255, 255, 255];
  return [
    parseInt(m[1].slice(0, 2), 16),
    parseInt(m[1].slice(2, 4), 16),
    parseInt(m[1].slice(4, 6), 16),
  ];
}

/**
 * Convert RGB values to hex color string
 *
 * Values are clamped to 0-255 range and rounded.
 * Always returns lowercase hex string with `#` prefix.
 *
 * @param r - Red channel (0-255)
 * @param g - Green channel (0-255)
 * @param b - Blue channel (0-255)
 * @returns Hex color string (e.g., "#ff0000")
 *
 * @example
 * rgbToHex(255, 0, 0)    // '#ff0000' (red)
 * rgbToHex(0, 255, 0)    // '#00ff00' (green)
 * rgbToHex(300, -10, 128) // '#ff0080' (clamped to valid range)
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}
