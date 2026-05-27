import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getDiskAlgorithm,
  type DiskAlgorithmExecutor,
} from '@domain/algorithms/disk-scheduling';
import type {
  DiskComparisonMetrics,
  DiskDirection,
  DiskSchedulingAlgorithm,
  DiskSimulationResult,
} from '@domain/types/disk-scheduling';

const DEFAULT_PLAYBACK_SPEED = 1;

export interface DiskSchedulerInput {
  algorithm: DiskSchedulingAlgorithm;
  initialHead: number;
  queue: number[];
  maxCylinder: number;
  direction: DiskDirection;
  includeEdges?: boolean;
  scannerMode?: boolean;
}

export interface DiskSchedulerState {
  result: DiskSimulationResult | null;
  comparisonResults: DiskSimulationResult[];
  comparisonMetrics: DiskComparisonMetrics[];
  currentStep: number;
  animationProgress: number;
  isPlaying: boolean;
  playbackSpeed: number;
}

export interface DiskSchedulerActions {
  play: () => void;
  pause: () => void;
  reset: () => void;
  nextStep: () => void;
  previousStep: () => void;
  seekToStep: (step: number) => void;
  setPlaybackSpeed: (speed: number) => void;
}

export const DISK_SCHEDULER_DEFAULT_INPUT: DiskSchedulerInput = {
  algorithm: 'SCAN',
  initialHead: 2150,
  queue: [2069, 1212, 2296, 2800, 544, 1618, 356, 1523, 4965, 3681],
  maxCylinder: 4999,
  direction: 'RIGHT',
  includeEdges: true,
  scannerMode: true,
};

const ALL_DISK_ALGORITHMS: DiskSchedulingAlgorithm[] = [
  'FCFS',
  'SSTF',
  'SCAN',
  'C_SCAN',
  'LOOK',
  'C_LOOK',
];

function clampStep(step: number, result: DiskSimulationResult | null): number {
  if (!result) return 0;
  const maxIndex = Math.max(result.steps.length, 0);
  return Math.max(0, Math.min(step, maxIndex));
}

function calculateComparisonMetrics(result: DiskSimulationResult): DiskComparisonMetrics {
  const stepCount = result.steps.length;
  const averageSeekDistance = stepCount > 0 ? result.totalDistance / stepCount : 0;
  const maxJump = stepCount > 0 ? Math.max(...result.steps.map((step) => step.distance)) : 0;

  let directionReversals = 0;
  let edgeTraversals = 0;

  for (let i = 1; i < result.steps.length; i++) {
    if (result.steps[i].direction !== result.steps[i - 1].direction) {
      directionReversals += 1;
    }
  }

  for (const step of result.steps) {
    if (step.to === 0 || step.from === 0) {
      edgeTraversals += 1;
      continue;
    }

    if (step.to === result.seekSequence.reduce((max, value) => Math.max(max, value), 0)) {
      edgeTraversals += 1;
    }
  }

  return {
    algorithm: result.algorithm,
    totalSeekDistance: result.totalDistance,
    averageSeekDistance,
    maxJump,
    directionReversals,
    edgeTraversals,
  };
}

function executeAlgorithm(
  algorithm: DiskSchedulingAlgorithm,
  input: DiskSchedulerInput
): DiskSimulationResult {
  const executor: DiskAlgorithmExecutor = getDiskAlgorithm(algorithm);
  return executor({
    initialHead: input.initialHead,
    queue: input.queue,
    direction: input.direction,
    maxCylinder: input.maxCylinder,
    includeEdges: input.includeEdges,
  });
}

export function useDiskScheduler(
  input: DiskSchedulerInput = DISK_SCHEDULER_DEFAULT_INPUT
): DiskSchedulerState & DiskSchedulerActions {
  const [currentStep, setCurrentStep] = useState(0);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeedState] = useState(DEFAULT_PLAYBACK_SPEED);

  const frameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const progressStartTimeRef = useRef<number | null>(null);

  // Destructure input for stable dependencies
  const { algorithm, initialHead, queue, maxCylinder, direction, includeEdges, scannerMode } = input;

  const result = useMemo(() => {
    return executeAlgorithm(algorithm, { algorithm, initialHead, queue, maxCylinder, direction, includeEdges });
  }, [algorithm, initialHead, queue, maxCylinder, direction, includeEdges]);

  const comparisonResults = useMemo(() => {
    return ALL_DISK_ALGORITHMS.map((algo) =>
      executeAlgorithm(algo, { algorithm: algo, initialHead, queue, maxCylinder, direction, includeEdges })
    );
  }, [initialHead, queue, maxCylinder, direction, includeEdges]);

  const comparisonMetrics = useMemo(
    () => comparisonResults.map(calculateComparisonMetrics),
    [comparisonResults]
  );

  useEffect(() => {
    setCurrentStep(0);
    setAnimationProgress(0);
    setIsPlaying(false);
  }, [result]);

  const play = useCallback(() => {
    if (!result || result.steps.length === 0) return;
    setIsPlaying(true);
  }, [result]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setAnimationProgress(0);
    setIsPlaying(false);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      const next = clampStep(prev + 1, result);
      setAnimationProgress(0);
      return next;
    });
  }, [result]);

  const previousStep = useCallback(() => {
    setCurrentStep((prev) => {
      const next = clampStep(prev - 1, result);
      setAnimationProgress(0);
      return next;
    });
  }, [result]);

  const seekToStep = useCallback(
    (step: number) => {
      setCurrentStep(clampStep(step, result));
      setAnimationProgress(0);
    },
    [result]
  );

  const setPlaybackSpeed = useCallback((speed: number) => {
    if (!Number.isFinite(speed) || speed <= 0) return;
    setPlaybackSpeedState(speed);
  }, []);

  useEffect(() => {
    if (!isPlaying || !result || result.steps.length === 0) {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      lastTickRef.current = null;
      progressStartTimeRef.current = null;
      return;
    }

    const msPerStep = 1000 / playbackSpeed;

    const tick = (time: number) => {
      if (lastTickRef.current === null) {
        lastTickRef.current = time;
      }
      
      if (progressStartTimeRef.current === null) {
        progressStartTimeRef.current = time;
      }

      if (scannerMode) {
        const elapsed = time - progressStartTimeRef.current;
        const progress = Math.min(1, elapsed / msPerStep);
        setAnimationProgress(progress);

        if (elapsed >= msPerStep) {
          setCurrentStep((prev) => {
            const next = prev + 1;
            const max = Math.max(result.steps.length, 0);
            if (next > max) {
              setIsPlaying(false);
              setAnimationProgress(1);
              return max;
            }
            setAnimationProgress(0);
            progressStartTimeRef.current = time;
            return next;
          });
        }
      } else {
        if (time - lastTickRef.current >= msPerStep) {
          setCurrentStep((prev) => {
            const next = prev + 1;
            const max = Math.max(result.steps.length, 0);
            if (next > max) {
              setIsPlaying(false);
              return max;
            }
            return next;
          });
          lastTickRef.current = time;
        }
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      frameRef.current = null;
      lastTickRef.current = null;
      progressStartTimeRef.current = null;
    };
  }, [isPlaying, playbackSpeed, result, scannerMode]);

  return {
    result,
    comparisonResults,
    comparisonMetrics,
    currentStep,
    animationProgress,
    isPlaying,
    playbackSpeed,
    play,
    pause,
    reset,
    nextStep,
    previousStep,
    seekToStep,
    setPlaybackSpeed,
  };
}
