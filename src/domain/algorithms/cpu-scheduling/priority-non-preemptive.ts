import type { Process, SchedulerResult, ProcessResult, GanttBlock } from '@domain/types/cpu-scheduling';
import {
  calculateAverages,
  calculateCPUUtilization,
  calculateThroughput,
  calculateContextSwitches,
  createIdleBlock,
} from './types';

/**
 * Priority Scheduling - Non-Preemptive
 * - Non-preemptive: once a process starts, it runs to completion
 * - At each decision point, select the available process with highest priority
 * - Lower priority number = higher priority (0 is highest)
 */
export function calculatePriorityNonPreemptive(processes: Process[]): SchedulerResult {
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

  // Ensure all processes have priority
  const processesWithPriority = processes.map((p) => ({
    ...p,
    priority: p.priority ?? 0,
  }));

  // Track which processes have been completed
  const completed = new Set<string>();
  const results: ProcessResult[] = [];
  const ganttBlocks: GanttBlock[] = [];
  let currentTime = 0;

  while (completed.size < processesWithPriority.length) {
    // Find all processes that have arrived and not yet completed
    const available = processesWithPriority.filter(
      (p) => p.arrivalTime <= currentTime && !completed.has(p.id)
    );

    if (available.length === 0) {
      // No process available, advance to next arrival
      const nextArrival = Math.min(
        ...processesWithPriority
          .filter((p) => !completed.has(p.id))
          .map((p) => p.arrivalTime)
      );
      ganttBlocks.push(createIdleBlock(currentTime, nextArrival));
      currentTime = nextArrival;
      continue;
    }

    // Select process with highest priority (lowest priority number)
    const selected = available.reduce((highest, p) =>
      p.priority! < highest.priority! ? p : highest
    );

    // Execute selected process
    const startTime = currentTime;
    const completionTime = currentTime + selected.burstTime;
    const turnaroundTime = completionTime - selected.arrivalTime;
    const waitingTime = turnaroundTime - selected.burstTime;
    const responseTime = startTime - selected.arrivalTime;

    // Add Gantt block
    ganttBlocks.push({
      processId: selected.id,
      processName: selected.name,
      startTime,
      endTime: completionTime,
      duration: selected.burstTime,
      color: selected.color,
    });

    // Add result
    results.push({
      processId: selected.id,
      processName: selected.name,
      arrivalTime: selected.arrivalTime,
      burstTime: selected.burstTime,
      priority: selected.priority,
      waitingTime,
      turnaroundTime,
      responseTime,
      completionTime,
    });

    completed.add(selected.id);
    currentTime = completionTime;
  }

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
