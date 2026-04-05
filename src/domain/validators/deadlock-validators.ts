import type { DeadlockInput, ValidationResult } from '@domain/types/resource-allocation';
import {
  validateMatrixDimensions,
  validateMatrixNonNegative,
  validateVectorNonNegative,
  mergeValidations,
} from './matrix-validators';

// ============================================================
// Deadlock Detection Validators (TICKET-007)
// ============================================================

/**
 * Validate the full DeadlockInput.
 * Checks: dimensions consistent, non-negative values.
 * Note: We do NOT require available = total - sum(allocation)
 * because the user may describe a partial snapshot.
 */
export function validateDeadlockInput(input: DeadlockInput): ValidationResult {
  const { allocation, request, available, processCount, resourceCount } = input;

  const allocationDim = validateMatrixDimensions(allocation, processCount, resourceCount, 'Allocation');
  const requestDim = validateMatrixDimensions(request, processCount, resourceCount, 'Request');
  const availableLen: ValidationResult =
    available.length === resourceCount
      ? { valid: true, errors: [] }
      : {
          valid: false,
          errors: [`Available vector must have ${resourceCount} elements, got ${available.length}`],
        };

  const dimCheck = mergeValidations(allocationDim, requestDim, availableLen);
  if (!dimCheck.valid) return dimCheck;

  const allocationNeg = validateMatrixNonNegative(allocation, 'Allocation');
  const requestNeg = validateMatrixNonNegative(request, 'Request');
  const availableNeg = validateVectorNonNegative(available, 'Available');

  return mergeValidations(allocationNeg, requestNeg, availableNeg);
}
