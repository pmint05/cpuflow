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
}

export interface DiskSchedulerState {
  input: DiskSchedulerInput;
  result: DiskSimulationResult | null;
  comparisonResults: DiskSimulationResult[];
  comparisonMetrics: DiskComparisonMetrics[];
  currentStep: number;
  animationProgress: number;
  isPlaying: boolean;
  playbackSpeed: number;
  ghostPreviewEnabled: boolean;
  academicModeEnabled: boolean;
  scannerModeEnabled: boolean;
}

export interface DiskSchedulerActions {
  setInput: (next: DiskSchedulerInput) => void;
  runSimulation: (nextInput?: DiskSchedulerInput) => void;
  runComparison: (nextInput?: DiskSchedulerInput) => void;
  play: () => void;
  pause: () => void;
  reset: () => void;
  nextStep: () => void;
  previousStep: () => void;
  seekToStep: (step: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  toggleGhostPreview: () => void;
  toggleAcademicMode: () => void;
  toggleScannerMode: () => void;
}

export const DISK_SCHEDULER_DEFAULT_INPUT: DiskSchedulerInput = {
  algorithm: 'SCAN',
  initialHead: 2150,
  queue: [2069, 1212, 2296, 2800, 544, 1618, 356, 1523, 4965, 3681],
  maxCylinder: 4999,
  direction: 'RIGHT',
  includeEdges: true,
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
  initialInput: DiskSchedulerInput = DISK_SCHEDULER_DEFAULT_INPUT
): DiskSchedulerState & DiskSchedulerActions {
  const [input, setInput] = useState<DiskSchedulerInput>(initialInput);
  const [result, setResult] = useState<DiskSimulationResult | null>(() =>
    executeAlgorithm(initialInput.algorithm, initialInput)
  );
  const [comparisonResults, setComparisonResults] = useState<DiskSimulationResult[]>(() =>
    ALL_DISK_ALGORITHMS.map((algorithm) =>
      executeAlgorithm(algorithm, {
        ...initialInput,
        algorithm,
      })
    )
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeedState] = useState(DEFAULT_PLAYBACK_SPEED);
  const [ghostPreviewEnabled, setGhostPreviewEnabled] = useState(true);
  const [academicModeEnabled, setAcademicModeEnabled] = useState(false);
  const [scannerModeEnabled, setScannerModeEnabled] = useState(true);

  const frameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const progressStartTimeRef = useRef<number | null>(null);

  const runSimulation = useCallback((nextInput?: DiskSchedulerInput) => {
    const source = nextInput ?? input;
    const nextResult = executeAlgorithm(source.algorithm, source);
    setResult(nextResult);
    setCurrentStep(0);
    setAnimationProgress(0);
    setIsPlaying(false);
  }, [input]);

  const runComparison = useCallback((nextInput?: DiskSchedulerInput) => {
    const source = nextInput ?? input;
    const results = ALL_DISK_ALGORITHMS.map((algorithm) =>
      executeAlgorithm(algorithm, {
        ...source,
        algorithm,
      })
    );
    setComparisonResults(results);
  }, [input]);

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

  const toggleGhostPreview = useCallback(() => {
    setGhostPreviewEnabled((prev) => !prev);
  }, []);

  const toggleAcademicMode = useCallback(() => {
    setAcademicModeEnabled((prev) => !prev);
  }, []);

  const toggleScannerMode = useCallback(() => {
    setScannerModeEnabled((prev) => !prev);
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

      if (scannerModeEnabled) {
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
  }, [isPlaying, playbackSpeed, result, scannerModeEnabled]);

  const comparisonMetrics = useMemo(
    () => comparisonResults.map(calculateComparisonMetrics),
    [comparisonResults]
  );

  return {
    input,
    result,
    comparisonResults,
    comparisonMetrics,
    currentStep,
    animationProgress,
    isPlaying,
    playbackSpeed,
    ghostPreviewEnabled,
    academicModeEnabled,
    scannerModeEnabled,
    setInput,
    runSimulation,
    runComparison,
    play,
    pause,
    reset,
    nextStep,
    previousStep,
    seekToStep,
    setPlaybackSpeed,
    toggleGhostPreview,
    toggleAcademicMode,
    toggleScannerMode,
  };
}
