import type { ValidationResult } from '@domain/types/resource-allocation';

// ============================================================
// Matrix/Vector Dimension Validators
// ============================================================

/**
 * Check that a 2D matrix has consistent row/column dimensions.
 */
export function validateMatrixDimensions(
  matrix: number[][],
  expectedRows: number,
  expectedCols: number,
  label: string
): ValidationResult {
  const errors: string[] = [];

  if (matrix.length !== expectedRows) {
    errors.push(`${label}: expected ${expectedRows} rows, got ${matrix.length}`);
  }

  for (let i = 0; i < matrix.length; i++) {
    if (matrix[i].length !== expectedCols) {
      errors.push(
        `${label}: row ${i} has ${matrix[i].length} columns, expected ${expectedCols}`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check that all values in a 2D matrix are >= 0.
 */
export function validateMatrixNonNegative(
  matrix: number[][],
  label: string
): ValidationResult {
  const errors: string[] = [];

  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      if (!Number.isFinite(matrix[i][j]) || matrix[i][j] < 0) {
        errors.push(`${label}[${i}][${j}] must be a non-negative number`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check that all values in a vector are >= 0.
 */
export function validateVectorNonNegative(
  vector: number[],
  label: string
): ValidationResult {
  const errors: string[] = [];

  for (let j = 0; j < vector.length; j++) {
    if (!Number.isFinite(vector[j]) || vector[j] < 0) {
      errors.push(`${label}[${j}] must be a non-negative number`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Merge multiple ValidationResults into one.
 */
export function mergeValidations(...results: ValidationResult[]): ValidationResult {
  const errors = results.flatMap((r) => r.errors);
  return { valid: errors.length === 0, errors };
}
