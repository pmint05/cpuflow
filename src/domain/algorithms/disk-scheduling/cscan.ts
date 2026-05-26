import type { DiskDirection, DiskSimulationResult } from '@domain/types/disk-scheduling';
import {
  compareAscending,
  compareDescending,
  createContext,
  finalizeResult,
  moveHead,
} from './types';

export function calculateDiskCSCAN(
  initialHead: number,
  queue: number[],
  direction: DiskDirection,
  maxCylinder: number,
  includeEdges = true
): DiskSimulationResult {
  const context = createContext('C_SCAN', initialHead, queue);
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
        `C-SCAN serves ${request.value} while moving RIGHT.`,
        request.id
      );
    }

    if (left.length > 0) {
      if (includeEdges && current !== maxCylinder) {
        current = moveHead(
          context,
          current,
          maxCylinder,
          'RIGHT',
          'C-SCAN continues to the right edge before wrap-around.'
        );
      }

      const jumpTarget = includeEdges ? 0 : left[0].value;
      current = moveHead(
        context,
        current,
        jumpTarget,
        'LEFT',
        `C-SCAN jumps to ${jumpTarget} and resumes from the smallest pending request.`
      );

      for (const request of left) {
        current = moveHead(
          context,
          current,
          request.value,
          'RIGHT',
          `C-SCAN continues RIGHT after jump to serve ${request.value}.`,
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
        `C-SCAN serves ${request.value} while moving LEFT.`,
        request.id
      );
    }

    if (rightDescending.length > 0) {
      if (includeEdges && current !== 0) {
        current = moveHead(
          context,
          current,
          0,
          'LEFT',
          'C-SCAN continues to the left edge before wrap-around.'
        );
      }

      const jumpTarget = includeEdges ? maxCylinder : rightDescending[0].value;
      current = moveHead(
        context,
        current,
        jumpTarget,
        'RIGHT',
        `C-SCAN jumps to ${jumpTarget} and resumes from the largest pending request.`
      );

      for (const request of rightDescending) {
        current = moveHead(
          context,
          current,
          request.value,
          'LEFT',
          `C-SCAN continues LEFT after jump to serve ${request.value}.`,
          request.id
        );
      }
    }
  }

  return finalizeResult(context);
}
