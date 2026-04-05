import type { DeadlockInput, DeadlockResult, StepTrace } from '@domain/types/resource-allocation';

// ============================================================
// Deadlock Detection Algorithm (TICKET-008)
// ============================================================

/**
 * Check if process `i` can finish given the current `work` vector.
 * A process can finish if Request[i][j] <= Work[j] for all j.
 */
export function canProcessFinishDeadlock(
  processId: number,
  request: number[][],
  work: number[]
): boolean {
  return request[processId].every((req, j) => req <= work[j]);
}

/**
 * Detect deadlocked processes using the Resource-Allocation Graph reduction algorithm.
 *
 * Algorithm (analogous to Banker's safety check):
 *   Work = Available
 *   Finish[i] = (Allocation[i] is all-zero)  // process holds no resources
 *   Repeat:
 *     Find i: Finish[i]=false AND Request[i] <= Work
 *     If found: Work += Allocation[i], Finish[i] = true
 *     Else: break
 *   Deadlocked = { i : Finish[i] = false }
 *
 * @param input DeadlockInput (allocation, request, available counts)
 */
export function detectDeadlock(input: DeadlockInput): DeadlockResult {
  const { allocation, request, available, processCount } = input;

  const work = [...available];
  // A process with no allocation is considered "finished" (it can't be deadlocked)
  const finish = allocation.map((row) => row.every((a) => a === 0));
  const steps: StepTrace[] = [];
  let stepNumber = 0;

  // Log the initial state
  steps.push({
    stepNumber: ++stepNumber,
    action: `Initial: Work = [${work.join(', ')}]. Processes with no allocation are pre-marked finished.`,
    processId: -1,
    work: [...work],
    need: [],
    allocation: [],
    canFinish: true,
    finished: false,
    finishFlags: [...finish],
  });

  let progress = true;
  while (progress) {
    progress = false;

    for (let i = 0; i < processCount; i++) {
      if (finish[i]) continue;

      const canFinish = canProcessFinishDeadlock(i, request, work);

      steps.push({
        stepNumber: ++stepNumber,
        action: canFinish
          ? `P${i}: Request ≤ Work → can proceed, will release allocation`
          : `P${i}: Request > Work → waiting, cannot proceed`,
        processId: i,
        work: [...work],
        need: [...request[i]],         // "need" slot used for Request in deadlock context
        allocation: [...allocation[i]],
        canFinish,
        finished: false,
        finishFlags: [...finish],
      });

      if (canFinish) {
        // Process can run to completion — release its resources
        for (let j = 0; j < work.length; j++) {
          work[j] += allocation[i][j];
        }
        finish[i] = true;
        progress = true;

        steps.push({
          stepNumber: ++stepNumber,
          action: `P${i} finished → Work updated to [${work.join(', ')}]`,
          processId: i,
          work: [...work],
          need: [...request[i]],
          allocation: [...allocation[i]],
          canFinish: true,
          finished: true,
          finishFlags: [...finish],
        });
      }
    }
  }

  const deadlockedProcesses = finish
    .map((f, i) => (f ? null : i))
    .filter((i): i is number => i !== null);

  const deadlocked = deadlockedProcesses.length > 0;

  // Final summary step
  if (deadlocked) {
    const labels = deadlockedProcesses.map((i) => `P${i}`).join(', ');
    steps.push({
      stepNumber: ++stepNumber,
      action: `Deadlock detected! Processes stuck: ${labels}`,
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
      action: 'No deadlock detected. All processes can complete.',
      processId: -1,
      work: [...work],
      need: [],
      allocation: [],
      canFinish: true,
      finished: true,
      finishFlags: [...finish],
    });
  }

  return {
    deadlocked,
    deadlockedProcesses,
    work,
    finish,
    steps,
  };
}
