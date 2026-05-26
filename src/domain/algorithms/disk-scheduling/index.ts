import type {
  DiskSchedulingAlgorithm,
  DiskSimulationResult,
} from '@domain/types/disk-scheduling';
import { calculateDiskFCFS } from './fcfs';
import { calculateDiskSSTF } from './sstf';
import { calculateDiskSCAN } from './scan';
import { calculateDiskCSCAN } from './cscan';
import { calculateDiskLOOK } from './look';
import { calculateDiskCLOOK } from './clook';
import type { DiskDirection } from '@domain/types/disk-scheduling';

export type DiskAlgorithmExecutor = (args: {
  initialHead: number;
  queue: number[];
  direction: DiskDirection;
  maxCylinder: number;
  includeEdges?: boolean;
}) => DiskSimulationResult;

const algorithms: Record<DiskSchedulingAlgorithm, DiskAlgorithmExecutor> = {
  FCFS: ({ initialHead, queue }) => calculateDiskFCFS(initialHead, queue),
  SSTF: ({ initialHead, queue }) => calculateDiskSSTF(initialHead, queue),
  SCAN: ({ initialHead, queue, direction, maxCylinder, includeEdges }) =>
    calculateDiskSCAN(initialHead, queue, direction, maxCylinder, includeEdges),
  C_SCAN: ({ initialHead, queue, direction, maxCylinder, includeEdges }) =>
    calculateDiskCSCAN(initialHead, queue, direction, maxCylinder, includeEdges),
  LOOK: ({ initialHead, queue, direction }) =>
    calculateDiskLOOK(initialHead, queue, direction),
  C_LOOK: ({ initialHead, queue, direction }) =>
    calculateDiskCLOOK(initialHead, queue, direction),
};

export function getDiskAlgorithm(
  algorithm: DiskSchedulingAlgorithm
): DiskAlgorithmExecutor {
  return algorithms[algorithm];
}

export function getDiskAlgorithmName(algorithm: DiskSchedulingAlgorithm): string {
  const names: Record<DiskSchedulingAlgorithm, string> = {
    FCFS: 'First Come First Serve (FCFS)',
    SSTF: 'Shortest Seek Time First (SSTF)',
    SCAN: 'Elevator / SCAN',
    C_SCAN: 'Circular SCAN (C-SCAN)',
    LOOK: 'LOOK',
    C_LOOK: 'Circular LOOK (C-LOOK)',
  };

  return names[algorithm];
}

export function getDiskAlgorithmDescription(
  algorithm: DiskSchedulingAlgorithm
): string {
  const descriptions: Record<DiskSchedulingAlgorithm, string> = {
    FCFS: 'Serves requests in input order.',
    SSTF: 'Always serves the nearest pending request.',
    SCAN: 'Moves in one direction to edge then reverses.',
    C_SCAN: 'Moves in one direction and wraps around at edge.',
    LOOK: 'Like SCAN but reverses at last request, not at physical edge.',
    C_LOOK: 'Like C-SCAN but wraps between request extremes only.',
  };

  return descriptions[algorithm];
}
