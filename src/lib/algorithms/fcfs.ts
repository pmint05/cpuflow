import type { Process, SchedulerResult, ProcessResult, GanttBlock } from '@/types/scheduler';
import {
  calculateAverages,
  calculateCPUUtilization,
  calculateThroughput,
  calculateContextSwitches,
  createIdleBlock,
} from './types';

/**
 * First Come First Serve (FCFS) Scheduling Algorithm
 * - Non-preemptive
 * - Processes execute in order of arrival time
 * - Simple queue-based scheduling
 */
export function calculateFCFS(processes: Process[]): SchedulerResult {
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

  // 1. Sort by arrival time
  const sorted = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);

  // 2. Initialize tracking variables
  let currentTime = 0;
  const results: ProcessResult[] = [];
  const ganttBlocks: GanttBlock[] = [];

  // 3. Execute each process in order
  for (const process of sorted) {
    // Handle idle time if CPU is waiting
    if (currentTime < process.arrivalTime) {
      ganttBlocks.push(createIdleBlock(currentTime, process.arrivalTime));
      currentTime = process.arrivalTime;
    }

    // Process execution
    const startTime = currentTime;
    const completionTime = currentTime + process.burstTime;
    const turnaroundTime = completionTime - process.arrivalTime;
    const waitingTime = turnaroundTime - process.burstTime;
    const responseTime = startTime - process.arrivalTime;

    // Add Gantt block
    ganttBlocks.push({
      processId: process.id,
      processName: process.name,
      startTime,
      endTime: completionTime,
      duration: process.burstTime,
      color: process.color,
    });

    // Add process result
    results.push({
      processId: process.id,
      processName: process.name,
      arrivalTime: process.arrivalTime,
      burstTime: process.burstTime,
      priority: process.priority,
      waitingTime,
      turnaroundTime,
      responseTime,
      completionTime,
    });

    currentTime = completionTime;
  }

  // 4. Calculate metrics
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
