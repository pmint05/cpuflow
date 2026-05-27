import type {
  DiskDirection,
  DiskSchedulingAlgorithm,
  DiskSimulationResult,
  DiskSimulationStep,
  DiskStepType,
} from '@domain/types/disk-scheduling';

export type DiskRequest = {
  id: number;
  value: number;
};

export type BuildContext = {
  algorithm: DiskSchedulingAlgorithm;
  initialHead: number;
  pending: DiskRequest[];
  completed: DiskRequest[];
  seekSequence: number[];
  steps: DiskSimulationStep[];
  totalDistance: number;
  countJumps: boolean;
};

export function createContext(
  algorithm: DiskSchedulingAlgorithm,
  initialHead: number,
  queue: number[],
  countJumps: boolean = false
): BuildContext {
  return {
    algorithm,
    initialHead,
    pending: queue.map((value, id) => ({ id, value })),
    completed: [],
    seekSequence: [initialHead],
    steps: [],
    totalDistance: 0,
    countJumps,
  };
}

export function absDistance(from: number, to: number): number {
  return Math.abs(from - to);
}

export function cloneValues(requests: DiskRequest[]): number[] {
  return requests.map((request) => request.value);
}

export function compareAscending(a: DiskRequest, b: DiskRequest): number {
  if (a.value !== b.value) return a.value - b.value;
  return a.id - b.id;
}

export function compareDescending(a: DiskRequest, b: DiskRequest): number {
  if (a.value !== b.value) return b.value - a.value;
  return a.id - b.id;
}

export function pickSstfCandidate(current: number, pending: DiskRequest[]): DiskRequest {
  const sorted = [...pending].sort((a, b) => {
    const dA = absDistance(current, a.value);
    const dB = absDistance(current, b.value);
    if (dA !== dB) return dA - dB;
    if (a.value !== b.value) return a.value - b.value;
    return a.id - b.id;
  });

  return sorted[0];
}

export function moveHead(
  context: BuildContext,
  from: number,
  to: number,
  direction: DiskDirection,
  explanation: string,
  completeRequestId?: number,
  type?: DiskStepType
): number {
  const distance = absDistance(from, to);
  
  const resolvedType: DiskStepType = type 
    ? type 
    : (typeof completeRequestId === 'number' ? 'SERVICE' : 'MOVE');

  // Logic: only add distance if it's not a JUMP or if countJumps is enabled
  if (resolvedType !== 'JUMP' || context.countJumps) {
    context.totalDistance += distance;
  }

  if (typeof completeRequestId === 'number') {
    const index = context.pending.findIndex((request) => request.id === completeRequestId);
    if (index !== -1) {
      const [completed] = context.pending.splice(index, 1);
      context.completed.push(completed);
    }
  }

  context.seekSequence.push(to);
  context.steps.push({
    step: context.steps.length + 1,
    from,
    to,
    distance,
    cumulativeDistance: context.totalDistance,
    direction,
    type: resolvedType,
    pendingRequests: cloneValues(context.pending),
    completedRequests: cloneValues(context.completed),
    explanation,
    calculation: {
      formula: `|${to} - ${from}| = ${distance}`,
      result: distance,
    },
  });

  return to;
}

export function finalizeResult(context: BuildContext): DiskSimulationResult {
  return {
    algorithm: context.algorithm,
    initialHead: context.initialHead,
    totalDistance: context.totalDistance,
    steps: context.steps,
    seekSequence: context.seekSequence,
    countJumps: context.countJumps,
  };
}
