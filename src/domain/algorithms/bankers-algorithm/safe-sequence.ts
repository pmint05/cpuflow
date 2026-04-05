import type { SafeSequenceResult, StepTrace } from '@domain/types/resource-allocation';
import { canProcessFinish } from './calculate';

// ============================================================
// Banker's Algorithm — Safe Sequence Detection (TICKET-006)
// ============================================================

/**
 * Find a safe sequence using the Banker's Safety Algorithm.
 *
 * Algorithm:
 *   Work = Available
 *   Finish[i] = false for all i
 *   Repeat:
 *     Find i such that Finish[i]=false AND Need[i] <= Work
 *     If found: Work += Allocation[i], Finish[i] = true, add i to sequence
 *     Else: break (no progress possible)
 *   If all Finish[i]=true → safe; else unsafe
 *
 * @param allocation  Allocation matrix (processCount × resourceCount)
 * @param need        Need matrix (processCount × resourceCount)
 * @param available   Available vector (resourceCount)
 */
export function findSafeSequence(
  allocation: number[][],
  need: number[][],
  available: number[]
): SafeSequenceResult {
  const processCount = allocation.length;
  const work = [...available];
  const finish = new Array<boolean>(processCount).fill(false);
  const sequence: number[] = [];
  const steps: StepTrace[] = [];
  let stepNumber = 0;

  let progress = true;
  while (progress) {
    progress = false;

    for (let i = 0; i < processCount; i++) {
      if (finish[i]) continue;

      const canFinish = canProcessFinish(i, need, work);

      steps.push({
        stepNumber: ++stepNumber,
        action: canFinish
          ? `P${i} can finish: Need ≤ Work → allocate resources back`
          : `P${i} cannot finish: Need > Work → skip`,
        processId: i,
        work: [...work],
        need: [...need[i]],
        allocation: [...allocation[i]],
        canFinish,
        finished: false,
        finishFlags: [...finish],
      });

      if (canFinish) {
        // Release resources
        for (let j = 0; j < work.length; j++) {
          work[j] += allocation[i][j];
        }
        finish[i] = true;
        sequence.push(i);
        progress = true;

        // Record the completion step
        steps.push({
          stepNumber: ++stepNumber,
          action: `P${i} completed → Work updated, resources released`,
          processId: i,
          work: [...work],
          need: [...need[i]],
          allocation: [...allocation[i]],
          canFinish: true,
          finished: true,
          finishFlags: [...finish],
        });
      }
    }
  }

  const safe = finish.every(Boolean);

  if (!safe) {
    // Add a final step showing which processes are stuck
    const stuck = finish
      .map((f, i) => (f ? null : `P${i}`))
      .filter(Boolean)
      .join(', ');
    steps.push({
      stepNumber: ++stepNumber,
      action: `Unsafe state: ${stuck} cannot finish — circular wait detected`,
      processId: -1,
      work: [...work],
      need: [],
      allocation: [],
      canFinish: false,
      finished: false,
      finishFlags: [...finish],
    });
  } else {
    steps.push({
      stepNumber: ++stepNumber,
      action: `Safe state confirmed. Safe sequence: ${sequence.map((i) => `P${i}`).join(' → ')}`,
      processId: -1,
      work: [...work],
      need: [],
      allocation: [],
      canFinish: true,
      finished: true,
      finishFlags: [...finish],
    });
  }

  return { safe, sequence, steps };
}
