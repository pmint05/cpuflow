import type { ResourceAllocationInput } from '@domain/types/resource-allocation';

// ============================================================
// Pure calculation helpers for Banker's Algorithm (TICKET-006)
// ============================================================

/**
 * Calculate the Need matrix: Need[i][j] = Max[i][j] - Allocation[i][j]
 */
export function calculateNeedMatrix(
  allocation: number[][],
  max: number[][]
): number[][] {
  return allocation.map((row, i) => row.map((alloc, j) => max[i][j] - alloc));
}

/**
 * Check if process `i` can finish given the current `work` vector.
 * Returns true if Need[i][j] <= work[j] for all j.
 */
export function canProcessFinish(
  processId: number,
  need: number[][],
  work: number[]
): boolean {
  return need[processId].every((n, j) => n <= work[j]);
}

/**
 * Check if granting a resource request keeps the system in a safe state.
 * Returns true if the request can be granted (i.e., it's <= Need and <= Available).
 * Does NOT simulate — use simulateRequest for that.
 */
export function isRequestGrantable(
  request: number[],
  processId: number,
  need: number[][],
  available: number[]
): boolean {
  return request.every(
    (req, j) => req <= need[processId][j] && req <= available[j]
  );
}

/**
 * Simulate granting resources: create new allocation & available matrices.
 * Pure — does not mutate inputs.
 */
export function applyRequest(
  request: number[],
  processId: number,
  allocation: number[][],
  available: number[]
): { newAllocation: number[][]; newAvailable: number[] } {
  const newAllocation = allocation.map((row, i) =>
    i === processId ? row.map((a, j) => a + request[j]) : [...row]
  );
  const newAvailable = available.map((a, j) => a - request[j]);
  return { newAllocation, newAvailable };
}

/**
 * Compute resource conservation check: for all j,
 * sum(Allocation[*][j]) + Available[j] should equal the total resources.
 * Returns true if consistent (useful for debugging inputs).
 */
export function computeTotalResources(input: ResourceAllocationInput): number[] {
  const totals = [...input.available];
  for (let i = 0; i < input.processCount; i++) {
    for (let j = 0; j < input.resourceCount; j++) {
      totals[j] += input.allocation[i][j];
    }
  }
  return totals;
}
