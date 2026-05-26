import { describe, expect, it } from 'vitest';
import { calculateDiskFCFS } from './fcfs';
import { calculateDiskSSTF } from './sstf';
import { calculateDiskSCAN } from './scan';
import { calculateDiskCSCAN } from './cscan';
import { calculateDiskLOOK } from './look';
import { calculateDiskCLOOK } from './clook';

describe('disk scheduling algorithms', () => {
  it('calculates FCFS in input order', () => {
    const result = calculateDiskFCFS(50, [82, 170, 43, 140, 24, 16, 190]);

    expect(result.seekSequence).toEqual([50, 82, 170, 43, 140, 24, 16, 190]);
    expect(result.totalDistance).toBe(642);
    expect(result.steps).toHaveLength(7);
  });

  it('calculates SSTF with deterministic tie-breaking', () => {
    const result = calculateDiskSSTF(50, [40, 60, 20, 80]);

    expect(result.seekSequence).toEqual([50, 40, 20, 60, 80]);
    expect(result.totalDistance).toBe(90);
    expect(result.steps[0]?.to).toBe(40);
    expect(result.steps[1]?.to).toBe(20);
  });

  it('SCAN moves to the boundary before reversing when requested', () => {
    const result = calculateDiskSCAN(50, [40, 60, 20, 80], 'RIGHT', 199, true);

    expect(result.seekSequence).toEqual([50, 60, 80, 199, 40, 20]);
    expect(result.totalDistance).toBe(328);
    expect(result.steps[2]?.to).toBe(199);
    expect(result.steps[3]?.direction).toBe('LEFT');
  });

  it('C-SCAN wraps at the boundary in a deterministic order', () => {
    const result = calculateDiskCSCAN(50, [40, 60, 20, 80], 'RIGHT', 199, true);

    expect(result.seekSequence).toEqual([50, 60, 80, 199, 0, 20, 40]);
    expect(result.totalDistance).toBe(388);
    expect(result.steps[2]?.to).toBe(199);
    expect(result.steps[3]?.to).toBe(0);
  });

  it('LOOK reverses without touching the physical boundary', () => {
    const result = calculateDiskLOOK(50, [40, 60, 20, 80], 'RIGHT');

    expect(result.seekSequence).toEqual([50, 60, 80, 40, 20]);
    expect(result.totalDistance).toBe(90);
    expect(result.seekSequence).not.toContain(199);
    expect(result.seekSequence).not.toContain(0);
  });

  it('C-LOOK wraps between request extremes without physical edges', () => {
    const result = calculateDiskCLOOK(50, [40, 60, 20, 80], 'RIGHT');

    expect(result.seekSequence).toEqual([50, 60, 80, 20, 40]);
    expect(result.totalDistance).toBe(110);
    expect(result.seekSequence).not.toContain(199);
    expect(result.seekSequence).not.toContain(0);
  });

  it('handles leftward C-LOOK deterministically', () => {
    const result = calculateDiskCLOOK(50, [40, 60, 20, 80], 'LEFT');

    expect(result.seekSequence).toEqual([50, 40, 20, 80, 60]);
    expect(result.totalDistance).toBe(110);
  });
});
