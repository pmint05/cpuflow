import type { Process, SchedulerResult, ProcessResult, GanttBlock, AlgorithmConfig } from '@domain/types/cpu-scheduling';
import {
  calculateAverages,
  calculateCPUUtilization,
  calculateThroughput,
  calculateContextSwitches,
  createIdleBlock,
} from './types';

/**
 * Round Robin (RR) Scheduling Algorithm
 * - Preemptive based on time quantum
 * - Each process gets a fixed time slice (quantum)
 * - Processes are executed in circular queue order
 */
export function calculateRoundRobin(
  processes: Process[],
  config?: AlgorithmConfig
): SchedulerResult {
  const quantum = config?.quantum || 2; // Default quantum = 2

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

  // Create working copy with remaining time
  const workingProcesses = processes.map((p) => ({
    ...p,
    remainingTime: p.burstTime,
    startTime: -1, // Track first execution for response time
    completionTime: -1,
  }));

  // Sort by arrival time for initial queue
  workingProcesses.sort((a, b) => a.arrivalTime - b.arrivalTime);

  const ganttBlocks: GanttBlock[] = [];
  const readyQueue: typeof workingProcesses = [];
  let currentTime = 0;
  let completed = 0;
  let processIndex = 0;

  while (completed < processes.length) {
    // Add newly arrived processes to ready queue
    while (
      processIndex < workingProcesses.length &&
      workingProcesses[processIndex].arrivalTime <= currentTime
    ) {
      readyQueue.push(workingProcesses[processIndex]);
      processIndex++;
    }

    if (readyQueue.length === 0) {
      // No process in queue, advance to next arrival
      if (processIndex < workingProcesses.length) {
        const nextArrival = workingProcesses[processIndex].arrivalTime;
        ganttBlocks.push(createIdleBlock(currentTime, nextArrival));
        currentTime = nextArrival;
      }
      continue;
    }

    // Get next process from queue
    const current = readyQueue.shift()!;

    // Track first execution for response time
    if (current.startTime === -1) {
      current.startTime = currentTime;
    }

    // Execute for quantum or remaining time, whichever is smaller
    const executionTime = Math.min(quantum, current.remainingTime);
    const startTime = currentTime;
    const endTime = currentTime + executionTime;

    // Add Gantt block
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
      processIndex < workingProcesses.length &&
      workingProcesses[processIndex].arrivalTime <= currentTime
    ) {
      readyQueue.push(workingProcesses[processIndex]);
      processIndex++;
    }

    // Check if process completed
    if (current.remainingTime === 0) {
      current.completionTime = currentTime;
      completed++;
    } else {
      // Re-add to end of queue
      readyQueue.push(current);
    }
  }

  // Calculate results
  const results: ProcessResult[] = workingProcesses.map((p) => {
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
