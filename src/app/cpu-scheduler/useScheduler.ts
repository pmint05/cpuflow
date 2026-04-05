import { useState, useCallback } from 'react';
import type {
  AlgorithmType,
  ProcessNameTemplate,
  ProcessInput,
  Process,
  SchedulerResult,
  AlgorithmConfig,
  QueueInput,
  MultiQueueResult,
  QueueResult,
} from '@domain/types/cpu-scheduling';
import { getAlgorithm } from '@domain/algorithms/cpu-scheduling';
import { generateProcessName } from '@infra/parsers/process-name-generator';
import { generateColor } from '@infra/canvas/color-generator';

/**
 * Main scheduler hook
 * Manages algorithm selection, process inputs, and calculation for both single and multi-queue modes
 */
export function useScheduler() {
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('FCFS');
  const [processes, setProcesses] = useState<ProcessInput[]>([]);
  const [quantum, setQuantum] = useState<number>(2);
  const [nameTemplate, setNameTemplate] =
    useState<ProcessNameTemplate>('P_i');
  const [result, setResult] = useState<SchedulerResult | null>(null);
  const [multiQueueResult, setMultiQueueResult] = useState<MultiQueueResult | null>(null);

  /**
   * Calculate scheduling result with given processes
   * Allows passing processes directly to avoid state synchronization issues
   */
  const calculateWithProcesses = useCallback(
    (inputProcesses: ProcessInput[]) => {
      if (inputProcesses.length === 0) {
        return;
      }

      // Convert ProcessInput[] to Process[] with names and colors
      const fullProcesses: Process[] = inputProcesses.map((p, i) => ({
        ...p,
        id: `process-${i}`,
        name: generateProcessName(i, nameTemplate),
        remainingTime: p.burstTime,
        color: generateColor(i),
      }));

      // Get algorithm function
      const algorithmFn = getAlgorithm(algorithm);

      // Prepare config
      const config: AlgorithmConfig = {
        algorithm,
        quantum: algorithm === 'ROUND_ROBIN' || algorithm === 'MULTI_LEVEL_QUEUE' ? quantum : undefined,
      };

      // Calculate result
      const calculatedResult = algorithmFn(fullProcesses, config);
      setMultiQueueResult(null);
      setResult(calculatedResult);
    },
    [algorithm, quantum, nameTemplate]
  );

  /**
   * Calculate scheduling result using current processes state
   */
  const calculate = useCallback(() => {
    calculateWithProcesses(processes);
  }, [processes, calculateWithProcesses]);

  /**
   * Calculate multi-queue scheduling result
   * Each queue runs its algorithm independently, then results are merged with global process naming
   */
  const calculateMultiQueue = useCallback(
    (queues: QueueInput[], nameTemplate: ProcessNameTemplate) => {
      if (queues.length === 0 || queues.every((q) => q.processes.length === 0)) {
        return;
      }

      // Process all queues and collect global process index
      let globalProcessIndex = 0;
      let queueStartOffset = 0;
      const queueResults: QueueResult[] = [];
      const allGanttBlocks: MultiQueueResult['ganttChart'] = [];

      for (const queue of queues) {
        if (queue.processes.length === 0) continue;

        const gateTime = queueStartOffset;

        // Convert ProcessInput[] to Process[] with names/colors and queue start offset.
        // Each queue is scheduled on a local timeline gated by previous queues.
        // This avoids leading idle segments from t=0 for later queues.
        const fullProcesses: Process[] = queue.processes.map((p, localIndex) => ({
          ...p,
          arrivalTime: Math.max(0, p.arrivalTime - gateTime),
          id: `${queue.id}-process-${localIndex}`,
          name: generateProcessName(globalProcessIndex + localIndex, nameTemplate),
          remainingTime: p.burstTime,
          color: generateColor(globalProcessIndex + localIndex),
        }));

        // Get algorithm function
        const algorithmFn = getAlgorithm(queue.algorithm);

        // Prepare config
        const config: AlgorithmConfig = {
          algorithm: queue.algorithm,
          quantum: queue.quantum,
        };

        // Calculate result for this queue
        const queueResult = algorithmFn(fullProcesses, config);

        const queueProcessesWithGlobalTime = queueResult.processes.map((process) => ({
          ...process,
          arrivalTime: process.arrivalTime + gateTime,
          completionTime: process.completionTime + gateTime,
        }));

        // Add queue tracking to gantt blocks
        const queueGanttBlocks = queueResult.ganttChart.map((block) => ({
          ...block,
          startTime: block.startTime + gateTime,
          endTime: block.endTime + gateTime,
          queueId: queue.id,
        }));

        // Collect results
        queueResults.push({
          queueId: queue.id,
          algorithm: queue.algorithm,
          processes: queueProcessesWithGlobalTime,
          ganttChart: queueGanttBlocks,
          averageWaitingTime: queueResult.averageWaitingTime,
          averageTurnaroundTime: queueResult.averageTurnaroundTime,
          averageResponseTime: queueResult.averageResponseTime,
        });

        allGanttBlocks.push(...queueGanttBlocks);

        if (queueGanttBlocks.length > 0) {
          const queueEndTime = Math.max(
            ...queueGanttBlocks.map((block) => block.endTime)
          );
          queueStartOffset = Math.max(queueStartOffset, queueEndTime);
        }

        globalProcessIndex += queue.processes.length;
      }

      // Calculate total averages
      const totalAverageWaitingTime =
        queueResults.length > 0
          ? queueResults.reduce((sum, q) => sum + q.averageWaitingTime, 0) /
            queueResults.length
          : 0;

      const totalAverageResponseTime =
        queueResults.length > 0
          ? queueResults.reduce((sum, q) => sum + q.averageResponseTime, 0) /
            queueResults.length
          : 0;

      const multiResult: MultiQueueResult = {
        queues: queueResults,
        ganttChart: allGanttBlocks,
        totalAverageWaitingTime,
        totalAverageResponceTime: totalAverageResponseTime,
      };

      setResult(null);
      setMultiQueueResult(multiResult);
    },
    []
  );

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setProcesses([]);
    setResult(null);
    setMultiQueueResult(null);
  }, []);

  return {
    // Single queue
    algorithm,
    setAlgorithm,
    processes,
    setProcesses,
    quantum,
    setQuantum,
    nameTemplate,
    setNameTemplate,
    result,
    calculate,
    calculateWithProcesses,
    // Multi queue
    multiQueueResult,
    calculateMultiQueue,
    // Reset
    reset,
  };
}
