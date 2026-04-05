// ============================================================
// Resource Allocation Types — shared by Banker's & Deadlock
// ============================================================

/**
 * Step trace entry for step-by-step visualization (shared by both algorithms).
 */
export interface StepTrace {
  stepNumber: number;
  /** Human-readable description of what happened this step */
  action: string;
  /** Process being evaluated (0-indexed) */
  processId: number;
  /** Current Work vector at this step */
  work: number[];
  /** Resources still needed by the process (Need[i]) */
  need: number[];
  /** Resources held by the process (Allocation[i]) */
  allocation: number[];
  /** Whether this process can finish given current Work */
  canFinish: boolean;
  /** Whether this process was completed/finished this step */
  finished: boolean;
  /** Finish flags for all processes at this step */
  finishFlags: boolean[];
}

// ============================================================
// Banker's Algorithm Types (TICKET-005)
// ============================================================

/** Raw inputs for the Banker's Algorithm */
export interface ResourceAllocationInput {
  /** Allocation[i][j] = resources of type j held by process i */
  allocation: number[][];
  /** Max[i][j] = max resources of type j that process i may claim */
  max: number[][];
  /** Available[j] = free resources of type j */
  available: number[];
  processCount: number;
  resourceCount: number;
}

/** A request to grant additional resources to a process */
export interface ResourceRequest {
  /** 0-indexed process ID */
  processId: number;
  /** Request[j] = amount of resource type j being requested */
  request: number[];
}

/** Result of running the Banker's safe-sequence algorithm */
export interface SafeSequenceResult {
  /** True if the system is in a safe state */
  safe: boolean;
  /** Process execution order that guarantees completion (0-indexed IDs) */
  sequence: number[];
  /** Step-by-step trace for visualization */
  steps: StepTrace[];
}

/** Result of simulating a resource request */
export interface RequestResult {
  /** True if the request can be granted safely */
  granted: boolean;
  /** Reason if denied */
  reason?: string;
  /** State after granting (only when granted=true) */
  newState?: {
    allocation: number[][];
    available: number[];
    safeSequenceResult: SafeSequenceResult;
  };
}

// ============================================================
// Deadlock Detection Types (TICKET-007)
// ============================================================

/** Raw inputs for the Deadlock Detection algorithm */
export interface DeadlockInput {
  /** Allocation[i][j] = resources of type j currently held by process i */
  allocation: number[][];
  /** Request[i][j] = resources of type j that process i is waiting for */
  request: number[][];
  /** Available[j] = free resources of type j */
  available: number[];
  processCount: number;
  resourceCount: number;
}

/** Result of running deadlock detection */
export interface DeadlockResult {
  /** True if at least one process is deadlocked */
  deadlocked: boolean;
  /** 0-indexed IDs of deadlocked processes */
  deadlockedProcesses: number[];
  /** Final Work array after algorithm completes */
  work: number[];
  /** Final Finish flags (false = process is deadlocked) */
  finish: boolean[];
  /** Step-by-step trace for visualization */
  steps: StepTrace[];
}

// ============================================================
// Validation Types (shared, TICKET-005 & TICKET-007)
// ============================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
