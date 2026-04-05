/**
 * Color palette for process visualization
 * Using distinct, accessible colors
 */
const COLORS = [
  '#3b82f6', // blue-500
  '#ef4444', // red-500
  '#10b981', // green-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
  '#06b6d4', // cyan-500
  '#6366f1', // indigo-500
  '#84cc16', // lime-500
  '#0ea5e9', // sky-500
  '#d946ef', // fuchsia-500
  '#a855f7', // purple-500
  '#22d3ee', // cyan-400
  '#fbbf24', // amber-400
  '#34d399', // emerald-500
  '#fb923c', // orange-400
  '#e879f9', // fuchsia-400
  '#60a5fa', // blue-400
];

/**
 * Dark mode color palette (darker, more muted tones)
 * Designed for better visibility on light backgrounds
 */
const DARK_MODE_COLORS = [
  '#1e40af', // blue-800
  '#991b1b', // red-800
  '#065f46', // green-800
  '#92400e', // amber-800
  '#5b21b6', // violet-800
  '#831843', // pink-800
  '#134e4a', // teal-800
  '#7c2d12', // orange-800
  '#164e63', // cyan-800
  '#3730a3', // indigo-800
  '#365314', // lime-800
  '#0c4a6e', // sky-800
  '#711c91', // fuchsia-800
  '#6b21a8', // purple-800
  '#155e75', // cyan-700
  '#92400e', // amber-800
  '#047857', // emerald-700
  '#9a3412', // orange-700
  '#6b21a8', // fuchsia-800
  '#1e3a8a', // blue-900
];

/**
 * Generate color for a process based on its index
 * @param index - Zero-based index of the process
 * @param darkMode - If true, use dark mode colors
 * @returns Hex color code
 */
export function generateColor(index: number, darkMode: boolean = false): string {
  const colors = darkMode ? DARK_MODE_COLORS : COLORS;
  return colors[index % colors.length];
}

/**
 * Get all available colors
 * @param darkMode - If true, return dark mode colors
 * @returns Array of hex color codes
 */
export function getAllColors(darkMode: boolean = false): string[] {
  const colors = darkMode ? DARK_MODE_COLORS : COLORS;
  return [...colors];
}

/**
 * Darken a hex color
 * @param color - Hex color code
 * @param amount - Amount to darken (0-1, default 0.3)
 * @returns Darkened hex color code
 */
export function darkenColor(color: string, amount: number = 0.3): string {
  // Remove '#' if present
  const hex = color.replace('#', '');

  // Parse hex color
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Darken by reducing each component
  const darkR = Math.max(0, Math.floor(r * (1 - amount)));
  const darkG = Math.max(0, Math.floor(g * (1 - amount)));
  const darkB = Math.max(0, Math.floor(b * (1 - amount)));

  // Convert back to hex
  const toHex = (n: number) => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(darkR)}${toHex(darkG)}${toHex(darkB)}`;
}
