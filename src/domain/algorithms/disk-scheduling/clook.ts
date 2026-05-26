import type { DiskDirection, DiskSimulationResult } from '@domain/types/disk-scheduling';
import {
  compareAscending,
  compareDescending,
  createContext,
  finalizeResult,
  moveHead,
} from './types';

export function calculateDiskCLOOK(
  initialHead: number,
  queue: number[],
  direction: DiskDirection
): DiskSimulationResult {
  const context = createContext('C_LOOK', initialHead, queue);
  let current = initialHead;

  const left = context.pending
    .filter((request) => request.value < initialHead)
    .sort(compareAscending);
  const right = context.pending
    .filter((request) => request.value >= initialHead)
    .sort(compareAscending);

  if (direction === 'RIGHT') {
    for (const request of right) {
      current = moveHead(
        context,
        current,
        request.value,
        'RIGHT',
        `C-LOOK serves ${request.value} while scanning RIGHT.`,
        request.id
      );
    }

    if (left.length > 0) {
      const [jumpTarget, ...remainingLeft] = left;
      current = moveHead(
        context,
        current,
        jumpTarget.value,
        'LEFT',
        `C-LOOK jumps to ${jumpTarget.value} (smallest pending request).`
      );

      for (const request of remainingLeft) {
        current = moveHead(
          context,
          current,
          request.value,
          'RIGHT',
          `C-LOOK continues RIGHT after jump to serve ${request.value}.`,
          request.id
        );
      }
    }
  } else {
    const leftDescending = [...left].sort(compareDescending);
    const rightDescending = [...right].sort(compareDescending);

    for (const request of leftDescending) {
      current = moveHead(
        context,
        current,
        request.value,
        'LEFT',
        `C-LOOK serves ${request.value} while scanning LEFT.`,
        request.id
      );
    }

    if (rightDescending.length > 0) {
      const [jumpTarget, ...remainingRight] = rightDescending;
      current = moveHead(
        context,
        current,
        jumpTarget.value,
        'RIGHT',
        `C-LOOK jumps to ${jumpTarget.value} (largest pending request).`
      );

      for (const request of remainingRight) {
        current = moveHead(
          context,
          current,
          request.value,
          'LEFT',
          `C-LOOK continues LEFT after jump to serve ${request.value}.`,
          request.id
        );
      }
    }
  }

  return finalizeResult(context);
}
