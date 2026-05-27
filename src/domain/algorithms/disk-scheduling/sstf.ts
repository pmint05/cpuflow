import type { DiskSimulationResult } from '@domain/types/disk-scheduling';
import {
  createContext,
  finalizeResult,
  moveHead,
  pickSstfCandidate,
} from './types';

export function calculateDiskSSTF(
  initialHead: number,
  queue: number[],
  countJumps: boolean = false
): DiskSimulationResult {
  const context = createContext('SSTF', initialHead, queue, countJumps);
  let current = initialHead;

  while (context.pending.length > 0) {
    const candidate = pickSstfCandidate(current, context.pending);
    const direction = candidate.value >= current ? 'RIGHT' : 'LEFT';

    current = moveHead(
      context,
      current,
      candidate.value,
      direction,
      `SSTF selects ${candidate.value} because it has the minimum seek distance from ${current}.`,
      candidate.id
    );
  }

  return finalizeResult(context);
}
