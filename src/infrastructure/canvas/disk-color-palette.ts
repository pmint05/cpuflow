import { getAllColors } from './color-generator';
import type { DiskSchedulingAlgorithm } from '@domain/types/disk-scheduling';

const ALGORITHM_BASE_COLORS: Record<DiskSchedulingAlgorithm, string> = {
  FCFS: '#2563eb',
  SSTF: '#16a34a',
  SCAN: '#d97706',
  C_SCAN: '#dc2626',
  LOOK: '#9333ea',
  C_LOOK: '#0d9488',
};

export function getDiskAlgorithmColor(algorithm: DiskSchedulingAlgorithm): string {
  return ALGORITHM_BASE_COLORS[algorithm];
}

export function getDiskPalette(darkMode = false): string[] {
  return getAllColors(darkMode);
}
