import { useState, useCallback } from 'react';
import type { ProcessInput } from '@/types/scheduler';
import { parseNumberArray } from '@/lib/parsers/input-parser';

/**
 * Hook for managing process input state
 * Handles parsing of comma/space-separated inputs
 */
export function useProcessInput() {
  const [arrivalTimesInput, setArrivalTimesInput] = useState<string>('0, 1, 2');
  const [burstTimesInput, setBurstTimesInput] = useState<string>('4, 3, 2');
  const [prioritiesInput, setPrioritiesInput] = useState<string>('2, 1, 3');
  const [queueLevelsInput, setQueueLevelsInput] = useState<string>('0, 1, 2');

  /**
   * Parse inputs and create ProcessInput array
   * Optionally accepts custom input strings (for multi-queue mode)
   */
  const parseInputs = useCallback(
    (
      includePriorities: boolean = false,
      includeQueueLevels: boolean = false,
      customArrivalTimesInput?: string,
      customBurstTimesInput?: string,
      customPrioritiesInput?: string,
      customQueueLevelsInput?: string
    ): ProcessInput[] | null => {
      const arrivalTimes = parseNumberArray(
        customArrivalTimesInput ?? arrivalTimesInput
      );
      const burstTimes = parseNumberArray(
        customBurstTimesInput ?? burstTimesInput
      );

      // Validate that arrival and burst times have same length
      if (arrivalTimes.length === 0 || burstTimes.length === 0) {
        return null;
      }

      if (arrivalTimes.length !== burstTimes.length) {
        return null;
      }

      const priorities = includePriorities
        ? parseNumberArray(customPrioritiesInput ?? prioritiesInput)
        : [];
      const queueLevels = includeQueueLevels
        ? parseNumberArray(customQueueLevelsInput ?? queueLevelsInput)
        : [];

      // Validate priorities length if needed
      if (includePriorities && priorities.length !== arrivalTimes.length) {
        return null;
      }

      // Validate queue levels length if needed
      if (includeQueueLevels && queueLevels.length !== arrivalTimes.length) {
        return null;
      }

      // Create ProcessInput array
      return arrivalTimes.map((arrivalTime, i) => ({
        arrivalTime,
        burstTime: burstTimes[i],
        priority: includePriorities ? priorities[i] : undefined,
        queueLevel: includeQueueLevels ? queueLevels[i] : undefined,
      }));
    },
    [arrivalTimesInput, burstTimesInput, prioritiesInput, queueLevelsInput]
  );

  /**
   * Validate inputs
   * Optionally accepts custom input strings (for multi-queue mode)
   */
  const validateInputs = useCallback(
    (
      includePriorities: boolean = false,
      includeQueueLevels: boolean = false,
      customArrivalTimesInput?: string,
      customBurstTimesInput?: string,
      customPrioritiesInput?: string,
      customQueueLevelsInput?: string
    ): {
      valid: boolean;
      error?: string;
    } => {
      const arrivalTimes = parseNumberArray(
        customArrivalTimesInput ?? arrivalTimesInput
      );
      const burstTimes = parseNumberArray(
        customBurstTimesInput ?? burstTimesInput
      );

      if (arrivalTimes.length === 0) {
        return { valid: false, error: 'Arrival times cannot be empty' };
      }

      if (burstTimes.length === 0) {
        return { valid: false, error: 'Burst times cannot be empty' };
      }

      if (arrivalTimes.length !== burstTimes.length) {
        return {
          valid: false,
          error: 'Arrival times and burst times must have the same count',
        };
      }

      if (includePriorities) {
        const priorities = parseNumberArray(
          customPrioritiesInput ?? prioritiesInput
        );
        if (priorities.length !== arrivalTimes.length) {
          return {
            valid: false,
            error: 'Priorities must match the number of processes',
          };
        }
      }

      if (includeQueueLevels) {
        const queueLevels = parseNumberArray(
          customQueueLevelsInput ?? queueLevelsInput
        );
        if (queueLevels.length !== arrivalTimes.length) {
          return {
            valid: false,
            error: 'Queue levels must match the number of processes',
          };
        }
      }

      return { valid: true };
    },
    [arrivalTimesInput, burstTimesInput, prioritiesInput, queueLevelsInput]
  );

  return {
    arrivalTimesInput,
    setArrivalTimesInput,
    burstTimesInput,
    setBurstTimesInput,
    prioritiesInput,
    setPrioritiesInput,
    queueLevelsInput,
    setQueueLevelsInput,
    parseInputs,
    validateInputs,
  };
}
