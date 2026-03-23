import type {
  Process,
  SchedulerResult,
  AlgorithmConfig,
  ProcessResult,
  GanttBlock,
} from '@/types/scheduler';

/**
 * Base interface for all scheduling algorithms
 */
export interface SchedulingAlgorithm {
  name: string;
  calculate: (
    processes: Process[],
    config?: AlgorithmConfig
  ) => SchedulerResult;
}

/**
 * Calculate average metrics from process results
 */
export function calculateAverages(results: ProcessResult[]) {
  if (results.length === 0) {
    return {
      averageWaitingTime: 0,
      averageTurnaroundTime: 0,
      averageResponseTime: 0,
    };
  }

  const avgWaiting =
    results.reduce((sum, p) => sum + p.waitingTime, 0) / results.length;
  const avgTurnaround =
    results.reduce((sum, p) => sum + p.turnaroundTime, 0) / results.length;
  const avgResponse =
    results.reduce((sum, p) => sum + p.responseTime, 0) / results.length;

  return {
    averageWaitingTime: Number(avgWaiting.toFixed(2)),
    averageTurnaroundTime: Number(avgTurnaround.toFixed(2)),
    averageResponseTime: Number(avgResponse.toFixed(2)),
  };
}

/**
 * Calculate CPU utilization
 */
export function calculateCPUUtilization(
  ganttBlocks: GanttBlock[],
  totalTime: number
): number {
  if (totalTime === 0) return 0;

  const busyTime = ganttBlocks.reduce((sum, block) => {
    if (block.processId !== 'idle') {
      return sum + block.duration;
    }
    return sum;
  }, 0);

  return Number(((busyTime / totalTime) * 100).toFixed(2));
}

/**
 * Calculate throughput (processes per time unit)
 */
export function calculateThroughput(
  processCount: number,
  totalTime: number
): number {
  if (totalTime === 0) return 0;
  return Number((processCount / totalTime).toFixed(2));
}

/**
 * Create an idle time block for Gantt chart
 */
export function createIdleBlock(
  startTime: number,
  endTime: number
): GanttBlock {
  return {
    processId: 'idle',
    processName: 'Idle',
    startTime,
    endTime,
    duration: endTime - startTime,
    color: '#e5e7eb', // gray-200
  };
}

/**
 * Calculate number of context switches
 * A context switch occurs when CPU transitions from one process to another
 * Idle blocks are not counted as context switches
 */
export function calculateContextSwitches(ganttBlocks: GanttBlock[]): number {
  if (ganttBlocks.length <= 1) return 0;

  let switches = 0;
  let previousProcessId: string | null = null;

  for (const block of ganttBlocks) {
    // Skip idle blocks - they don't count as context switches
    if (block.processId === 'idle') {
      continue;
    }

    // Count switch when process changes (and previous was not idle)
    if (previousProcessId !== null && previousProcessId !== block.processId) {
      switches++;
    }

    previousProcessId = block.processId;
  }

  return switches;
}
