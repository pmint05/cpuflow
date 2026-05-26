import type {
  DiskDirection,
  DiskSchedulingAlgorithm,
} from '@domain/types/disk-scheduling';

export interface DiskSchedulerConfig {
  algo: DiskSchedulingAlgorithm;
  head: number;
  direction: DiskDirection;
  max: number;
  queue: number[];
  speed: number;
  ghost: boolean;
  academic: boolean;
  explain: boolean;
  includeEdges: boolean;
}

export const DISK_SCHEDULER_DEFAULTS: DiskSchedulerConfig = {
  algo: 'SCAN',
  head: 2150,
  direction: 'RIGHT',
  max: 4999,
  queue: [2069, 1212, 2296],
  speed: 1,
  ghost: true,
  academic: false,
  explain: true,
  includeEdges: true,
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

function parseQueue(value: string | null, maxCylinder: number): number[] {
  if (!value) return DISK_SCHEDULER_DEFAULTS.queue;

  const parsed = value
    .split(',')
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
    algo: asAlgorithm(params.get('algo')),
    head,
    direction: asDirection(params.get('direction')),
    max,
    queue: parseQueue(params.get('queue'), max),
    speed,
    ghost: asBoolean(params.get('ghost'), DISK_SCHEDULER_DEFAULTS.ghost),
    academic: asBoolean(params.get('academic'), DISK_SCHEDULER_DEFAULTS.academic),
    explain: asBoolean(params.get('explain'), DISK_SCHEDULER_DEFAULTS.explain),
    includeEdges: asBoolean(params.get('includeEdges'), DISK_SCHEDULER_DEFAULTS.includeEdges),
  };
}

export function encodeDiskSchedulerConfig(config: DiskSchedulerConfig): string {
  const params = new URLSearchParams();

  params.set('algo', config.algo);
  params.set('head', String(config.head));
  params.set('direction', config.direction);
  params.set('max', String(config.max));
  params.set('queue', config.queue.join(','));
  params.set('speed', String(config.speed));
  params.set('ghost', String(config.ghost));
  params.set('academic', String(config.academic));
  params.set('explain', String(config.explain));
  params.set('includeEdges', String(config.includeEdges));

  return params.toString();
}
