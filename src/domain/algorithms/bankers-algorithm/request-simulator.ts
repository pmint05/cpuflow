import type {
  ResourceAllocationInput,
  ResourceRequest,
  RequestResult,
  SafeSequenceResult,
} from '@domain/types/resource-allocation';
import { calculateNeedMatrix, applyRequest } from './calculate';
import { findSafeSequence } from './safe-sequence';

// ============================================================
// Banker's Algorithm — Request Simulation (TICKET-006)
// ============================================================

/**
 * Simulate granting a resource request to a process.
 * Steps:
 *   1. Check Request <= Need[i]  (process isn't exceeding its claim)
 *   2. Check Request <= Available (resources are actually free)
 *   3. Tentatively allocate: Available -= Request; Allocation[i] += Request
 *   4. Run safety algorithm on the new state
 *   5. If safe → grant; else → rollback, deny
 */
export function simulateRequest(
  input: ResourceAllocationInput,
  req: ResourceRequest
): RequestResult {
  const { allocation, max, available } = input;
  const { processId, request } = req;

  const need = calculateNeedMatrix(allocation, max);

  // Check Request <= Need
  for (let j = 0; j < request.length; j++) {
    if (request[j] > need[processId][j]) {
      return {
        granted: false,
        reason: `Request[${j}] (${request[j]}) > Need[${processId}][${j}] (${need[processId][j]}) — process has exceeded its maximum claim`,
      };
    }
  }

  // Check Request <= Available
  for (let j = 0; j < request.length; j++) {
    if (request[j] > available[j]) {
      return {
        granted: false,
        reason: `Request[${j}] (${request[j]}) > Available[${j}] (${available[j]}) — insufficient resources, process must wait`,
      };
    }
  }

  // Tentatively grant
  const { newAllocation, newAvailable } = applyRequest(request, processId, allocation, available);
  const newNeed = calculateNeedMatrix(newAllocation, max);
  const safeResult: SafeSequenceResult = findSafeSequence(newAllocation, newNeed, newAvailable);

  if (safeResult.safe) {
    return {
      granted: true,
      newState: {
        allocation: newAllocation,
        available: newAvailable,
        safeSequenceResult: safeResult,
      },
    };
  }

  return {
    granted: false,
    reason: 'Granting this request would lead to an unsafe state — request denied',
  };
}
