import type {
  DiskDirection,
  DiskSchedulingAlgorithm,
} from '@domain/types/disk-scheduling';

export interface DiskSchedulerConfig {
  // Algorithm
  algo: DiskSchedulingAlgorithm;
  head: number;
  direction: DiskDirection;
  max: number;
  queue: number[];
  includeEdges: boolean;
  // Playback
  speed: number;
  // Modes
  ghost: boolean;
  academic: boolean;
  scanner: boolean;
  // Canvas View
  grid: boolean;
  headLabel: boolean;
  highlight: boolean;
  markerLabels: boolean;
  tickLabels: boolean;
  sequenceTicks: boolean;
  // Canvas Metrics
  markerSize: number;
  tickSize: number;
  spacing: number;
}

export const DISK_SCHEDULER_DEFAULTS: DiskSchedulerConfig = {
  // Algorithm
  algo: 'SCAN',
  head: 2150,
  direction: 'RIGHT',
  max: 4999,
  queue: [2069, 1212, 2296, 2800, 544, 1618, 356, 1523, 4965, 3681],
  includeEdges: true,
  // Playback
  speed: 1,
  // Modes
  ghost: true,
  academic: false,
  scanner: true,
  // Canvas View
  grid: true,
  headLabel: true,
  highlight: true,
  markerLabels: true,
  tickLabels: true,
  sequenceTicks: false,
  // Canvas Metrics
  markerSize: 12,
  tickSize: 11,
  spacing: 86,
};

const ALGORITHMS: DiskSchedulingAlgorithm[] = [
  'FCFS',
  'SSTF',
  'SCAN',
  'C_SCAN',
  'LOOK',
  'C_LOOK',
];

const DIRECTIONS: DiskDirection[] = ['LEFT', 'RIGHT'];

function asNumber(value: string | null, fallback: number): number {
  if (value === null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asBoolean(value: string | null, fallback: boolean): boolean {
  if (value === null) return fallback;
  if (value.toLowerCase() === 'true' || value === '1') return true;
  if (value.toLowerCase() === 'false' || value === '0') return false;
  return fallback;
}

function asAlgorithm(value: string | null): DiskSchedulingAlgorithm {
  if (!value) return DISK_SCHEDULER_DEFAULTS.algo;
  const normalized = value.toUpperCase();
  if (ALGORITHMS.includes(normalized as DiskSchedulingAlgorithm)) {
    return normalized as DiskSchedulingAlgorithm;
  }
  return DISK_SCHEDULER_DEFAULTS.algo;
}

function asDirection(value: string | null): DiskDirection {
  if (!value) return DISK_SCHEDULER_DEFAULTS.direction;
  const normalized = value.toUpperCase();
  if (DIRECTIONS.includes(normalized as DiskDirection)) {
    return normalized as DiskDirection;
  }
  return DISK_SCHEDULER_DEFAULTS.direction;
}

export function parseQueue(value: string | null, maxCylinder: number): number[] {
  if (!value) return DISK_SCHEDULER_DEFAULTS.queue;

  const parsed = value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => Number(item))
    .filter((num) => Number.isFinite(num) && num >= 0 && num <= maxCylinder)
    .map((num) => Math.trunc(num));

  return parsed.length > 0 ? parsed : DISK_SCHEDULER_DEFAULTS.queue;
}

export function decodeDiskSchedulerConfig(search: string): DiskSchedulerConfig {
  const params = new URLSearchParams(search);

  const max = Math.max(1, Math.trunc(asNumber(params.get('max'), DISK_SCHEDULER_DEFAULTS.max)));
  const head = Math.min(max, Math.max(0, Math.trunc(asNumber(params.get('head'), DISK_SCHEDULER_DEFAULTS.head))));
  const speed = Math.max(0.25, asNumber(params.get('speed'), DISK_SCHEDULER_DEFAULTS.speed));

  return {
    // Algorithm
    algo: asAlgorithm(params.get('algo')),
    head,
    direction: asDirection(params.get('direction')),
    max,
    queue: parseQueue(params.get('queue'), max),
    includeEdges: asBoolean(params.get('edges'), DISK_SCHEDULER_DEFAULTS.includeEdges),
    // Playback
    speed,
    // Modes
    ghost: asBoolean(params.get('ghost'), DISK_SCHEDULER_DEFAULTS.ghost),
    academic: asBoolean(params.get('academic'), DISK_SCHEDULER_DEFAULTS.academic),
    scanner: asBoolean(params.get('scanner'), DISK_SCHEDULER_DEFAULTS.scanner),
    // Canvas View
    grid: asBoolean(params.get('grid'), DISK_SCHEDULER_DEFAULTS.grid),
    headLabel: asBoolean(params.get('headLabel'), DISK_SCHEDULER_DEFAULTS.headLabel),
    highlight: asBoolean(params.get('highlight'), DISK_SCHEDULER_DEFAULTS.highlight),
    markerLabels: asBoolean(params.get('markerLabels'), DISK_SCHEDULER_DEFAULTS.markerLabels),
    tickLabels: asBoolean(params.get('tickLabels'), DISK_SCHEDULER_DEFAULTS.tickLabels),
    sequenceTicks: asBoolean(params.get('sequenceTicks'), DISK_SCHEDULER_DEFAULTS.sequenceTicks),
    // Canvas Metrics
    markerSize: asNumber(params.get('markerSize'), DISK_SCHEDULER_DEFAULTS.markerSize),
    tickSize: asNumber(params.get('tickSize'), DISK_SCHEDULER_DEFAULTS.tickSize),
    spacing: asNumber(params.get('spacing'), DISK_SCHEDULER_DEFAULTS.spacing),
  };
}

export function encodeDiskSchedulerConfig(config: DiskSchedulerConfig): string {
  const params = new URLSearchParams();

  // Algorithm
  params.set('algo', config.algo);
  params.set('head', String(config.head));
  params.set('direction', config.direction);
  params.set('max', String(config.max));
  params.set('queue', config.queue.join(','));
  params.set('edges', String(config.includeEdges));
  // Playback
  params.set('speed', String(config.speed));
  // Modes
  params.set('ghost', String(config.ghost));
  params.set('academic', String(config.academic));
  params.set('scanner', String(config.scanner));
  // Canvas View
  params.set('grid', String(config.grid));
  params.set('headLabel', String(config.headLabel));
  params.set('highlight', String(config.highlight));
  params.set('markerLabels', String(config.markerLabels));
  params.set('tickLabels', String(config.tickLabels));
  params.set('sequenceTicks', String(config.sequenceTicks));
  // Canvas Metrics
  params.set('markerSize', String(config.markerSize));
  params.set('tickSize', String(config.tickSize));
  params.set('spacing', String(config.spacing));

  return params.toString();
}
