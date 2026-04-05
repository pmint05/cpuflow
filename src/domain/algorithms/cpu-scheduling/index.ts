import type { AlgorithmType, Process, SchedulerResult, AlgorithmConfig } from '@domain/types/cpu-scheduling';
import { calculateFCFS } from './fcfs';
import { calculateSJFNonPreemptive } from './sjf-non-preemptive';
import { calculateSJFPreemptive } from './sjf-preemptive';
import { calculateRoundRobin } from './round-robin';
import { calculatePriorityNonPreemptive } from './priority-non-preemptive';
import { calculatePriorityPreemptive } from './priority-preemptive';
import { calculateMultiLevelQueue } from './multi-level-queue';

/**
 * Algorithm registry mapping algorithm types to their implementations
 */
export const algorithms = {
  FCFS: calculateFCFS,
  SJF_NON_PREEMPTIVE: calculateSJFNonPreemptive,
  SJF_PREEMPTIVE: calculateSJFPreemptive,
  ROUND_ROBIN: calculateRoundRobin,
  PRIORITY_NON_PREEMPTIVE: calculatePriorityNonPreemptive,
  PRIORITY_PREEMPTIVE: calculatePriorityPreemptive,
  MULTI_LEVEL_QUEUE: calculateMultiLevelQueue,
} as const;

/**
 * Get algorithm implementation by type
 */
export function getAlgorithm(
  type: AlgorithmType
): (processes: Process[], config?: AlgorithmConfig) => SchedulerResult {
  return algorithms[type];
}

/**
 * Get human-readable algorithm name
 */
export function getAlgorithmName(type: AlgorithmType): string {
  const names: Record<AlgorithmType, string> = {
    FCFS: 'First Come First Serve (FCFS)',
    SJF_NON_PREEMPTIVE: 'Shortest Job First (Non-Preemptive)',
    SJF_PREEMPTIVE: 'Shortest Job First (Preemptive / SRTF)',
    ROUND_ROBIN: 'Round Robin (RR)',
    PRIORITY_NON_PREEMPTIVE: 'Priority (Non-Preemptive)',
    PRIORITY_PREEMPTIVE: 'Priority (Preemptive)',
    MULTI_LEVEL_QUEUE: 'Multi-Level Queue',
  };
  return names[type];
}

/**
 * Get algorithm description
 */
export function getAlgorithmDescription(type: AlgorithmType): string {
  const descriptions: Record<AlgorithmType, string> = {
    FCFS: 'Non-preemptive algorithm that executes processes in order of arrival time.',
    SJF_NON_PREEMPTIVE: 'Non-preemptive algorithm that selects the process with the shortest burst time.',
    SJF_PREEMPTIVE: 'Preemptive algorithm that switches to the process with the shortest remaining time.',
    ROUND_ROBIN: 'Preemptive algorithm that allocates a fixed time quantum to each process in circular order.',
    PRIORITY_NON_PREEMPTIVE: 'Non-preemptive algorithm that executes processes based on priority (lower number = higher priority).',
    PRIORITY_PREEMPTIVE: 'Preemptive algorithm that can interrupt a process when a higher priority process arrives.',
    MULTI_LEVEL_QUEUE: 'Multiple queues with different priorities and algorithms, executing higher priority queues first.',
  };
  return descriptions[type];
}

/**
 * Check if algorithm requires quantum input
 */
export function requiresQuantum(type: AlgorithmType): boolean {
  return type === 'ROUND_ROBIN' || type === 'MULTI_LEVEL_QUEUE';
}

/**
 * Check if algorithm requires priority input
 */
export function requiresPriority(type: AlgorithmType): boolean {
  return type === 'PRIORITY_NON_PREEMPTIVE' || type === 'PRIORITY_PREEMPTIVE';
}

/**
 * Check if algorithm requires queue level input
 */
export function requiresQueueLevel(type: AlgorithmType): boolean {
  return type === 'MULTI_LEVEL_QUEUE';
}

// Re-export all algorithms
export {
  calculateFCFS,
  calculateSJFNonPreemptive,
  calculateSJFPreemptive,
  calculateRoundRobin,
  calculatePriorityNonPreemptive,
  calculatePriorityPreemptive,
  calculateMultiLevelQueue,
};
