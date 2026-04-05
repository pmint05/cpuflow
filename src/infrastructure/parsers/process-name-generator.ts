import type { ProcessNameTemplate } from '@domain/types/cpu-scheduling';

/**
 * Generate process name based on index and template
 * @param index - Zero-based index of the process
 * @param template - Template type (P_i, ABC, or 123)
 * @returns Generated process name
 */
export function generateProcessName(
  index: number,
  template: ProcessNameTemplate
): string {
  switch (template) {
    case 'P_i':
      return `P${index + 1}`;
    case 'ABC':
      // A, B, C, ... Z, AA, AB, ...
      return indexToLetters(index);
    case '123':
      return (index + 1).toString();
    default:
      return `P${index + 1}`;
  }
}

/**
 * Convert index to letter sequence (A, B, C, ..., Z, AA, AB, ...)
 * @param index - Zero-based index
 * @returns Letter sequence
 */
function indexToLetters(index: number): string {
  let result = '';
  let num = index;

  do {
    result = String.fromCharCode(65 + (num % 26)) + result;
    num = Math.floor(num / 26) - 1;
  } while (num >= 0);

  return result;
}
