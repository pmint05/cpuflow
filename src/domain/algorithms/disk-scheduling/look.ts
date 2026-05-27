import type { DiskDirection, DiskSimulationResult } from '@domain/types/disk-scheduling';
import {
  compareAscending,
  compareDescending,
  createContext,
  finalizeResult,
  moveHead,
} from './types';

export function calculateDiskLOOK(
  initialHead: number,
  queue: number[],
  direction: DiskDirection,
  countJumps: boolean = false
): DiskSimulationResult {
  const context = createContext('LOOK', initialHead, queue, countJumps);
  let current = initialHead;

  const left = context.pending
    .filter((request) => request.value < initialHead)
    .sort(compareDescending);
  const right = context.pending
    .filter((request) => request.value >= initialHead)
    .sort(compareAscending);

  if (direction === 'LEFT') {
    for (const request of left) {
      current = moveHead(
        context,
        current,
        request.value,
        'LEFT',
        `LOOK serves ${request.value} while scanning LEFT.`,
        request.id
      );
    }

    for (const request of right) {
      current = moveHead(
        context,
        current,
        request.value,
        'RIGHT',
        `LOOK reverses and serves ${request.value} on the RIGHT side.`,
        request.id
      );
    }
  } else {
    for (const request of right) {
      current = moveHead(
        context,
        current,
        request.value,
        'RIGHT',
        `LOOK serves ${request.value} while scanning RIGHT.`,
        request.id
      );
    }

    for (const request of left) {
      current = moveHead(
        context,
        current,
        request.value,
        'LEFT',
        `LOOK reverses and serves ${request.value} on the LEFT side.`,
        request.id
      );
    }
  }

  return finalizeResult(context);
}
