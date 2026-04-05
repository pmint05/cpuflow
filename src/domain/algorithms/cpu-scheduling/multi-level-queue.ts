import type { Process, SchedulerResult, ProcessResult, GanttBlock, AlgorithmConfig } from '@domain/types/cpu-scheduling';
import {
  calculateAverages,
  calculateCPUUtilization,
  calculateThroughput,
  calculateContextSwitches,
  createIdleBlock,
} from './types';

/**
 * Multi-Level Queue Scheduling Algorithm
 * - Multiple queues with different priorities
 * - Each queue can use a different scheduling algorithm
 * - Higher priority queues are executed first
 * - Default: 3 queues (System: RR, Interactive: RR, Batch: FCFS)
 */
export function calculateMultiLevelQueue(
  processes: Process[],
  config?: AlgorithmConfig
): SchedulerResult {
  if (processes.length === 0) {
    return {
      processes: [],
      ganttChart: [],
      averageWaitingTime: 0,
      averageTurnaroundTime: 0,
      averageResponseTime: 0,
      cpuUtilization: 0,
      throughput: 0,
      contextSwitches: 0,
    };
  }

  // Default queue configuration
  const queueConfigs = config?.queueLevels || [
    { level: 0, algorithm: 'RR' as const, quantum: 2, priority: 3 }, // System (highest priority)
    { level: 1, algorithm: 'RR' as const, quantum: 4, priority: 2 }, // Interactive
    { level: 2, algorithm: 'FCFS' as const, priority: 1 }, // Batch (lowest priority)
  ];

  // Ensure all processes have queue level
  const processesWithQueue = processes.map((p) => ({
    ...p,
    queueLevel: p.queueLevel ?? 2, // Default to lowest priority queue
    remainingTime: p.burstTime,
    startTime: -1,
    completionTime: -1,
  }));

  // Organize processes by queue level
  const queues = new Map<number, typeof processesWithQueue>();
  for (const queueConfig of queueConfigs) {
    queues.set(queueConfig.level, []);
  }

  // Add processes to their queues based on arrival time as they arrive
  const ganttBlocks: GanttBlock[] = [];
  const readyQueues = new Map<number, typeof processesWithQueue>();
  for (const queueConfig of queueConfigs) {
    readyQueues.set(queueConfig.level, []);
  }

  let currentTime = 0;
  let completed = 0;
  let processIndex = 0;

  // Sort processes by arrival time
  processesWithQueue.sort((a, b) => a.arrivalTime - b.arrivalTime);

  while (completed < processes.length) {
    // Add newly arrived processes to their respective queues
    while (
      processIndex < processesWithQueue.length &&
      processesWithQueue[processIndex].arrivalTime <= currentTime
    ) {
      const process = processesWithQueue[processIndex];
      const queue = readyQueues.get(process.queueLevel);
      if (queue) {
        queue.push(process);
      }
      processIndex++;
    }

    // Find highest priority non-empty queue
    let selectedQueue: typeof processesWithQueue | undefined;
    let selectedQueueConfig: typeof queueConfigs[0] | undefined;

    for (const queueConfig of queueConfigs.sort((a, b) => b.priority - a.priority)) {
      const queue = readyQueues.get(queueConfig.level);
      if (queue && queue.length > 0) {
        selectedQueue = queue;
        selectedQueueConfig = queueConfig;
        break;
      }
    }

    if (!selectedQueue || !selectedQueueConfig) {
      // No process in any queue, advance to next arrival
      if (processIndex < processesWithQueue.length) {
        const nextArrival = processesWithQueue[processIndex].arrivalTime;
        ganttBlocks.push(createIdleBlock(currentTime, nextArrival));
        currentTime = nextArrival;
      }
      continue;
    }

    // Execute process based on queue's algorithm
    const current = selectedQueue.shift()!;

    // Track first execution for response time
    if (current.startTime === -1) {
      current.startTime = currentTime;
    }

    if (selectedQueueConfig.algorithm === 'FCFS') {
      // FCFS: execute entire burst
      const executionTime = current.remainingTime;
      const startTime = currentTime;
      const endTime = currentTime + executionTime;

      ganttBlocks.push({
        processId: current.id,
        processName: current.name,
        startTime,
        endTime,
        duration: executionTime,
        color: current.color,
      });

      current.remainingTime = 0;
      current.completionTime = endTime;
      currentTime = endTime;
      completed++;
    } else if (selectedQueueConfig.algorithm === 'RR') {
      // Round Robin: execute for quantum or remaining time
      const quantum = selectedQueueConfig.quantum || 2;
      const executionTime = Math.min(quantum, current.remainingTime);
      const startTime = currentTime;
      const endTime = currentTime + executionTime;

      ganttBlocks.push({
        processId: current.id,
        processName: current.name,
        startTime,
        endTime,
        duration: executionTime,
        color: current.color,
      });

      current.remainingTime -= executionTime;
      currentTime = endTime;

      // Add newly arrived processes before re-adding current (if not complete)
      while (
        processIndex < processesWithQueue.length &&
        processesWithQueue[processIndex].arrivalTime <= currentTime
      ) {
        const process = processesWithQueue[processIndex];
        const queue = readyQueues.get(process.queueLevel);
        if (queue) {
          queue.push(process);
        }
        processIndex++;
      }

      if (current.remainingTime === 0) {
        current.completionTime = currentTime;
        completed++;
      } else {
        // Re-add to end of same queue
        selectedQueue.push(current);
      }
    } else if (selectedQueueConfig.algorithm === 'SJF') {
      // SJF: execute entire burst (non-preemptive)
      const executionTime = current.remainingTime;
      const startTime = currentTime;
      const endTime = currentTime + executionTime;

      ganttBlocks.push({
        processId: current.id,
        processName: current.name,
        startTime,
        endTime,
        duration: executionTime,
        color: current.color,
      });

      current.remainingTime = 0;
      current.completionTime = endTime;
      currentTime = endTime;
      completed++;
    }
  }

  // Calculate results
  const results: ProcessResult[] = processesWithQueue.map((p) => {
    const turnaroundTime = p.completionTime - p.arrivalTime;
    const waitingTime = turnaroundTime - p.burstTime;
    const responseTime = p.startTime - p.arrivalTime;

    return {
      processId: p.id,
      processName: p.name,
      arrivalTime: p.arrivalTime,
      burstTime: p.burstTime,
      priority: p.priority,
      waitingTime,
      turnaroundTime,
      responseTime,
      completionTime: p.completionTime,
    };
  });

  // Calculate metrics
  const averages = calculateAverages(results);
  const cpuUtilization = calculateCPUUtilization(ganttBlocks, currentTime);
  const throughput = calculateThroughput(results.length, currentTime);
  const contextSwitches = calculateContextSwitches(ganttBlocks);

  return {
    processes: results,
    ganttChart: ganttBlocks,
    ...averages,
    cpuUtilization,
    throughput,
    contextSwitches,
  };
}
