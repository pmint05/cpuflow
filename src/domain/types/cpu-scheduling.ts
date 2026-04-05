// Algorithm types
export type AlgorithmType =
  | 'FCFS'
  | 'SJF_PREEMPTIVE'
  | 'SJF_NON_PREEMPTIVE'
  | 'ROUND_ROBIN'
  | 'PRIORITY_PREEMPTIVE'
  | 'PRIORITY_NON_PREEMPTIVE'
  | 'MULTI_LEVEL_QUEUE';

// Process name template options
export type ProcessNameTemplate = 'P_i' | 'ABC' | '123';

// Process annotation render mode
export type ProcessAnnotationMode = 'POINTER_LEVELING' | 'POINTER_FIRST_ONLY' | 'LEGEND' | 'HIDDEN';

// Time label render mode
export type TimeLabelRenderMode = 'MAJOR_ONLY' | 'LINE_LEVELING' | 'FORCE_SHRINK';

// Input data for a single process
export interface ProcessInput {
  arrivalTime: number;
  burstTime: number;
  priority?: number; // Only for priority algorithms
  queueLevel?: number; // Only for multi-level queue
}

// Process with additional runtime data
export interface Process extends ProcessInput {
  id: string; // Unique identifier
  name: string; // Display name (P1, A, 1, etc.)
  remainingTime: number; // For preemptive algorithms
  color: string; // Color for visualization
}

// Gantt chart block representing a process execution
export interface GanttBlock {
  processId: string;
  processName: string;
  startTime: number;
  endTime: number;
  duration: number;
  color: string;
  isContextSwitch?: boolean; // For context switching visualization
  isContinuation?: boolean; // For line-broken blocks (no left border)
  queueId?: string; // For multi-queue: identifies which queue this process belongs to
}

// Results for a single process
export interface ProcessResult {
  processId: string;
  processName: string;
  arrivalTime: number;
  burstTime: number;
  priority?: number;
  waitingTime: number;
  turnaroundTime: number;
  responseTime: number;
  completionTime: number;
}

// Complete scheduler result
export interface SchedulerResult {
  processes: ProcessResult[];
  ganttChart: GanttBlock[];
  averageWaitingTime: number;
  averageTurnaroundTime: number;
  averageResponseTime: number;
  cpuUtilization: number;
  throughput: number;
  contextSwitches: number;
}

// Configuration for algorithm execution
export interface AlgorithmConfig {
  algorithm: AlgorithmType;
  quantum?: number; // For Round Robin
  contextSwitchTime?: number; // Optional context switch time
  queueLevels?: QueueConfig[]; // For multi-level queue
}

// Configuration for a queue in multi-level queue
export interface QueueConfig {
  level: number;
  algorithm: 'FCFS' | 'RR' | 'SJF';
  quantum?: number; // If queue uses RR
  priority: number; // Higher number = higher priority
}

// Input for a single queue in multi-queue mode
export interface QueueInput {
  id: string; // Unique queue identifier (e.g., "queue-0", "queue-1")
  algorithm: AlgorithmType;
  processes: ProcessInput[];
  quantum?: number; // For ROUND_ROBIN algorithm
}

// Result for a single queue in multi-queue mode
export interface QueueResult {
  queueId: string;
  algorithm: AlgorithmType;
  processes: ProcessResult[];
  ganttChart: GanttBlock[];
  averageWaitingTime: number;
  averageTurnaroundTime: number;
  averageResponseTime: number;
}

// Configuration for multi-queue scheduling
export interface MultiQueueConfig {
  queues: QueueInput[];
  nameTemplate: ProcessNameTemplate;
  // Rendering options (shared across all queues)
  colorful?: boolean;
  darkMode?: boolean;
  processAnnotationMode?: ProcessAnnotationMode;
  timeLabelRenderMode?: TimeLabelRenderMode;
  allowProcessNameInBlock?: boolean;
  showQueueAnnotation?: boolean;
}

// Result for multi-queue scheduling
export interface MultiQueueResult {
  queues: QueueResult[];
  ganttChart: GanttBlock[]; // Merged Gantt chart from all queues
  totalAverageWaitingTime: number;
  totalAverageResponceTime: number;
}

// Canvas-specific types
export interface GanttLine {
  blocks: GanttBlock[];
  startTime: number;
  endTime: number;
  width: number;
}

export interface GanttCanvasConfig {
  width: number; // Canvas width
  blockHeight: number; // Height of each process block
  lineSpacing: number; // Spacing between lines
  fontSize: number;
  fontFamily: string;
  showTimeLabels: boolean;
  showProcessNames: boolean;
  allowProcessNameInBlock?: boolean; // Try to render process name inside each block when possible
  borderWidth: number;
  borderColor: string;
  colorful: boolean; // If false, use monochrome (black text, white blocks)
  darkMode?: boolean; // If true, use dark background colors
}
