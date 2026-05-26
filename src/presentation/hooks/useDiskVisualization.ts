import { useMemo } from 'react';
import { DiskSchedulerRenderer } from '@infra/canvas/disk-scheduler-renderer';

export function useDiskVisualization() {
  const renderer = useMemo(() => new DiskSchedulerRenderer(), []);

  return {
    renderer,
  };
}
