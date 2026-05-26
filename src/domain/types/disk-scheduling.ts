export type DiskSchedulingAlgorithm =
  | 'FCFS'
  | 'SSTF'
  | 'SCAN'
  | 'C_SCAN'
  | 'LOOK'
  | 'C_LOOK';

export type DiskDirection = 'LEFT' | 'RIGHT';

export interface DiskSchedulingInput {
  algorithm: DiskSchedulingAlgorithm;
  initialHead: number;
  queue: number[];
  maxCylinder: number;
  direction: DiskDirection;
  includeEdges?: boolean;
}

export type DiskStepCalculation = {
  formula: string;
  result: number;
};

export type DiskSimulationStep = {
  step: number;
  from: number;
  to: number;
  distance: number;
  cumulativeDistance: number;
  direction: DiskDirection;
  pendingRequests: number[];
  completedRequests: number[];
  explanation?: string;
  calculation?: DiskStepCalculation;
};

export type DiskSimulationResult = {
  algorithm: DiskSchedulingAlgorithm;
  initialHead: number;
  totalDistance: number;
  steps: DiskSimulationStep[];
  seekSequence: number[];
};

export interface DiskComparisonMetrics {
  algorithm: DiskSchedulingAlgorithm;
  totalSeekDistance: number;
  averageSeekDistance: number;
  maxJump: number;
  directionReversals: number;
  edgeTraversals: number;
}

export interface DiskValidationResult {
  valid: boolean;
  errors: string[];
}
