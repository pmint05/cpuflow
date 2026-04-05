import type {
  ResourceAllocationInput,
  ResourceRequest,
  ValidationResult,
} from '@domain/types/resource-allocation';
import {
  validateMatrixDimensions,
  validateMatrixNonNegative,
  validateVectorNonNegative,
  mergeValidations,
} from './matrix-validators';

// ============================================================
// Banker's Algorithm Validators (TICKET-005)
// ============================================================

/**
 * Validate the full ResourceAllocationInput for the Banker's Algorithm.
 * Checks: dimensions consistent, non-negative, Allocation <= Max per cell.
 */
export function validateBankersInput(input: ResourceAllocationInput): ValidationResult {
  const { allocation, max, available, processCount, resourceCount } = input;

  const allocationDim = validateMatrixDimensions(allocation, processCount, resourceCount, 'Allocation');
  const maxDim = validateMatrixDimensions(max, processCount, resourceCount, 'Max');
  const availableLen: ValidationResult =
    available.length === resourceCount
      ? { valid: true, errors: [] }
      : {
          valid: false,
          errors: [`Available vector must have ${resourceCount} elements, got ${available.length}`],
        };

  // Bail early on dimension errors — further checks would be misleading
  const dimCheck = mergeValidations(allocationDim, maxDim, availableLen);
  if (!dimCheck.valid) return dimCheck;

  const allocationNeg = validateMatrixNonNegative(allocation, 'Allocation');
  const maxNeg = validateMatrixNonNegative(max, 'Max');
  const availableNeg = validateVectorNonNegative(available, 'Available');

  // Allocation[i][j] must not exceed Max[i][j]
  const exceedErrors: string[] = [];
  for (let i = 0; i < processCount; i++) {
    for (let j = 0; j < resourceCount; j++) {
      if (allocation[i][j] > max[i][j]) {
        exceedErrors.push(
          `Allocation[${i}][${j}] (${allocation[i][j]}) exceeds Max[${i}][${j}] (${max[i][j]})`
        );
      }
    }
  }
  const exceedCheck: ValidationResult = { valid: exceedErrors.length === 0, errors: exceedErrors };

  return mergeValidations(allocationNeg, maxNeg, availableNeg, exceedCheck);
}

/**
 * Validate a resource request for the Banker's Algorithm.
 * Checks: Request <= Need, Request <= Available.
 * Requires Need matrix to be pre-calculated.
 */
export function validateResourceRequest(
  req: ResourceRequest,
  need: number[][],
  available: number[],
  processCount: number,
  resourceCount: number
): ValidationResult {
  const errors: string[] = [];
  const { processId, request } = req;

  if (processId < 0 || processId >= processCount) {
    errors.push(`Process ID ${processId} is out of range (0–${processCount - 1})`);
    return { valid: false, errors };
  }

  if (request.length !== resourceCount) {
    errors.push(`Request vector must have ${resourceCount} elements`);
    return { valid: false, errors };
  }

  for (let j = 0; j < resourceCount; j++) {
    if (request[j] < 0) {
      errors.push(`Request[${j}] must be non-negative`);
    } else if (request[j] > need[processId][j]) {
      errors.push(
        `Request[${j}] (${request[j]}) exceeds Need[${processId}][${j}] (${need[processId][j]})`
      );
    } else if (request[j] > available[j]) {
      errors.push(
        `Request[${j}] (${request[j]}) exceeds Available[${j}] (${available[j]}) — process must wait`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}
