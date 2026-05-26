import type { DiskDirection, DiskSimulationResult } from '@domain/types/disk-scheduling';
import {
  compareAscending,
  compareDescending,
  createContext,
  finalizeResult,
  moveHead,
} from './types';

export function calculateDiskSCAN(
  initialHead: number,
  queue: number[],
  direction: DiskDirection,
  maxCylinder: number,
  includeEdges = true
): DiskSimulationResult {
  const context = createContext('SCAN', initialHead, queue);
  let current = initialHead;
  let currentDirection = direction;

  const left = context.pending
    .filter((request) => request.value < initialHead)
    .sort(compareDescending);
  const right = context.pending
    .filter((request) => request.value >= initialHead)
    .sort(compareAscending);

  const serveSide = (requests: typeof left, moveDirection: DiskDirection) => {
    for (const request of requests) {
      current = moveHead(
        context,
        current,
        request.value,
        moveDirection,
        `SCAN continues ${moveDirection} to serve request ${request.value}.`,
        request.id
      );
    }
  };

  if (currentDirection === 'LEFT') {
    serveSide(left, 'LEFT');

    if (includeEdges && current !== 0 && right.length > 0) {
      current = moveHead(
        context,
        current,
        0,
        'LEFT',
        'SCAN reaches the left disk boundary before reversing direction.'
      );
    }

    currentDirection = 'RIGHT';
    serveSide(right, currentDirection);
  } else {
    serveSide(right, 'RIGHT');

    if (includeEdges && current !== maxCylinder && left.length > 0) {
      current = moveHead(
        context,
        current,
        maxCylinder,
        'RIGHT',
        'SCAN reaches the right disk boundary before reversing direction.'
      );
    }

    currentDirection = 'LEFT';
    serveSide(left, currentDirection);
  }

  return finalizeResult(context);
}
