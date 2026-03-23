/**
 * Parse comma or space-separated number string into array of numbers
 * @param input - String with comma or space-separated numbers (e.g., "0, 3, 5" or "0 3 5")
 * @returns Array of numbers, filtering out NaN and empty values
 */
export function parseNumberArray(input: string): number[] {
  return input
    .split(/[\s,]+/) // Split by spaces and commas
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => parseFloat(s))
    .filter((n) => !isNaN(n) && n >= 0); // Only non-negative numbers
}
