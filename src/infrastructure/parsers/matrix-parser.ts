// ============================================================
// Matrix / Vector string parsers (TICKET-010)
// ============================================================

/**
 * Parse a comma/space-delimited string into a number[].
 *
 * Accepted formats:
 *   "1,2,3"  →  [1, 2, 3]
 *   "1 2 3"  →  [1, 2, 3]
 *   "1, 2, 3" → [1, 2, 3]
 *
 * Returns null if:
 *  - input is empty / whitespace-only
 *  - any token is non-numeric
 */
export function parseVectorString(input: string): number[] | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const tokens = trimmed.split(/[\s,]+/).filter((t) => t.length > 0);
  if (tokens.length === 0) return null;

  const result: number[] = [];
  for (const token of tokens) {
    const n = Number(token);
    if (!Number.isFinite(n)) return null;
    result.push(n);
  }

  return result;
}

/**
 * Parse a newline-separated, comma/space-delimited string into a number[][].
 *
 * Accepted formats:
 *   "1,2,3\n4,5,6"   →  [[1,2,3],[4,5,6]]
 *   "1 2\n3 4"        →  [[1,2],[3,4]]
 *
 * Returns null if:
 *  - input is empty
 *  - any row is non-parseable
 *  - rows have inconsistent column counts
 */
export function parseMatrixString(input: string): number[][] | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const rawRows = trimmed.split(/\n/).map((r) => r.trim()).filter((r) => r.length > 0);
  if (rawRows.length === 0) return null;

  const matrix: number[][] = [];
  let expectedCols: number | null = null;

  for (const rawRow of rawRows) {
    const row = parseVectorString(rawRow);
    if (row === null) return null;

    if (expectedCols === null) {
      expectedCols = row.length;
    } else if (row.length !== expectedCols) {
      return null;   // inconsistent column count
    }

    matrix.push(row);
  }

  return matrix;
}

/**
 * Parse a vector string and validate expected length.
 * Returns { value, error } for UI consumption.
 */
export function parseAndValidateVector(
  input: string,
  expectedLength: number | null,
  label: string
): { value: number[] | null; error: string | null } {
  const value = parseVectorString(input);
  if (value === null) return { value: null, error: `${label}: invalid format` };
  if (expectedLength !== null && value.length !== expectedLength) {
    return {
      value: null,
      error: `${label}: expected ${expectedLength} elements, got ${value.length}`,
    };
  }
  return { value, error: null };
}

/**
 * Parse a matrix string and validate expected dimensions.
 * Returns { value, error } for UI consumption.
 */
export function parseAndValidateMatrix(
  input: string,
  expectedRows: number | null,
  expectedCols: number | null,
  label: string
): { value: number[][] | null; error: string | null } {
  const value = parseMatrixString(input);
  if (value === null) return { value: null, error: `${label}: invalid format` };

  if (expectedRows !== null && value.length !== expectedRows) {
    return {
      value: null,
      error: `${label}: expected ${expectedRows} rows, got ${value.length}`,
    };
  }
  if (expectedCols !== null && value[0] && value[0].length !== expectedCols) {
    return {
      value: null,
      error: `${label}: expected ${expectedCols} columns, got ${value[0].length}`,
    };
  }
  return { value, error: null };
}

/**
 * Serialize a number[][] back to a multiline string for display / URL storage.
 */
export function matrixToString(matrix: number[][]): string {
  return matrix.map((row) => row.join(',')).join('\n');
}

/**
 * Serialize a number[] back to a comma-separated string.
 */
export function vectorToString(vector: number[]): string {
  return vector.join(',');
}
