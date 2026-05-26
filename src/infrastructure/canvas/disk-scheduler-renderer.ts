import type { DiskSimulationResult } from '@domain/types/disk-scheduling';

export interface DiskRendererSnapshot {
  result: DiskSimulationResult | null;
  currentStep: number;
  ghostEnabled: boolean;
}

export class DiskSchedulerRenderer {
  private snapshot: DiskRendererSnapshot = {
    result: null,
    currentStep: 0,
    ghostEnabled: true,
  };

  update(snapshot: DiskRendererSnapshot): void {
    this.snapshot = snapshot;
  }

  getSnapshot(): DiskRendererSnapshot {
    return this.snapshot;
  }
}
