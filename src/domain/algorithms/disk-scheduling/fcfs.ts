import type { DiskSimulationResult } from '@domain/types/disk-scheduling';
import { createContext, finalizeResult, moveHead } from './types';

export function calculateDiskFCFS(
  initialHead: number,
  queue: number[],
  countJumps: boolean = false
): DiskSimulationResult {
  const context = createContext('FCFS', initialHead, queue, countJumps);
  let current = initialHead;

  for (const request of [...context.pending]) {
    const direction = request.value >= current ? 'RIGHT' : 'LEFT';
    current = moveHead(
      context,
      current,
      request.value,
      direction,
      `FCFS serves ${request.value} in arrival order.`,
      request.id
    );
  }

  return finalizeResult(context);
}
