import type { Process, SchedulerResult, ProcessResult, GanttBlock } from '@/types/scheduler';
import {
  calculateAverages,
  calculateCPUUtilization,
  calculateThroughput,
  calculateContextSwitches,
  createIdleBlock,
} from './types';

/**
 * Priority Scheduling - Preemptive
 * - Preemptive: can interrupt running process if higher priority process arrives
 * - At each time unit, select the process with highest priority
 * - Lower priority number = higher priority (0 is highest)
 */
export function calculatePriorityPreemptive(processes: Process[]): SchedulerResult {
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

  // Ensure all processes have priority and create working copy
  const workingProcesses = processes.map((p) => ({
    ...p,
    priority: p.priority ?? 0,
    remainingTime: p.burstTime,
    startTime: -1, // Track first execution for response time
    completionTime: -1,
  }));

  const ganttBlocks: GanttBlock[] = [];
  let currentTime = 0;
  let lastProcessId: string | null = null;
  let blockStartTime = 0;
  let completed = 0;

  // Find the last completion time to know when to stop
  const maxArrival = Math.max(...processes.map((p) => p.arrivalTime));
  const totalBurst = processes.reduce((sum, p) => sum + p.burstTime, 0);
  const endTime = maxArrival + totalBurst;

  while (completed < processes.length && currentTime <= endTime) {
    // Find all available processes
    const available = workingProcesses.filter(
      (p) => p.arrivalTime <= currentTime && p.remainingTime > 0
    );

    if (available.length === 0) {
      // Add block if there was a running process
      if (lastProcessId !== null && lastProcessId !== 'idle') {
        const process = workingProcesses.find((p) => p.id === lastProcessId)!;
        ganttBlocks.push({
          processId: process.id,
          processName: process.name,
          startTime: blockStartTime,
          endTime: currentTime,
          duration: currentTime - blockStartTime,
          color: process.color,
        });
      }

      // Advance to next arrival
      const nextArrival = Math.min(
        ...workingProcesses
          .filter((p) => p.arrivalTime > currentTime)
          .map((p) => p.arrivalTime)
      );

      if (nextArrival === Infinity) break;

      ganttBlocks.push(createIdleBlock(currentTime, nextArrival));
      currentTime = nextArrival;
      lastProcessId = 'idle';
      blockStartTime = currentTime;
      continue;
    }

    // Select process with highest priority (lowest priority number)
    const selected = available.reduce((highest, p) =>
      p.priority! < highest.priority! ? p : highest
    );

    // Track first execution for response time
    if (selected.startTime === -1) {
      selected.startTime = currentTime;
    }

    // Start a fresh block when CPU was idle or previous process just completed.
    if (lastProcessId === null) {
      blockStartTime = currentTime;
    }

    // If switching to a different process, save previous block
    if (lastProcessId !== null && lastProcessId !== selected.id) {
      if (lastProcessId !== 'idle') {
        const prevProcess = workingProcesses.find((p) => p.id === lastProcessId)!;
        ganttBlocks.push({
          processId: prevProcess.id,
          processName: prevProcess.name,
          startTime: blockStartTime,
          endTime: currentTime,
          duration: currentTime - blockStartTime,
          color: prevProcess.color,
        });
      }
      blockStartTime = currentTime;
    }

    // Execute for 1 time unit
    selected.remainingTime--;
    currentTime++;
    lastProcessId = selected.id;

    // Check if process completed
    if (selected.remainingTime === 0) {
      selected.completionTime = currentTime;
      completed++;

      // Add final block for this process
      ganttBlocks.push({
        processId: selected.id,
        processName: selected.name,
        startTime: blockStartTime,
        endTime: currentTime,
        duration: currentTime - blockStartTime,
        color: selected.color,
      });
      lastProcessId = null;
    }
  }

  // Merge consecutive blocks of same process
  const mergedBlocks = mergeConsecutiveBlocks(ganttBlocks);

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
  const cpuUtilization = calculateCPUUtilization(mergedBlocks, currentTime);
  const throughput = calculateThroughput(results.length, currentTime);
  const contextSwitches = calculateContextSwitches(mergedBlocks);

  return {
    processes: results,
    ganttChart: mergedBlocks,
    ...averages,
    cpuUtilization,
    throughput,
    contextSwitches,
  };
}

/**
 * Merge consecutive blocks of the same process for cleaner Gantt chart
 */
function mergeConsecutiveBlocks(blocks: GanttBlock[]): GanttBlock[] {
  if (blocks.length === 0) return [];

  const merged: GanttBlock[] = [];
  let current = { ...blocks[0] };

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];

    if (block.processId === current.processId && block.startTime === current.endTime) {
      // Merge with current block
      current.endTime = block.endTime;
      current.duration = current.endTime - current.startTime;
    } else {
      // Save current and start new
      merged.push(current);
      current = { ...block };
    }
  }

  merged.push(current);
  return merged;
}
