import { useCallback, useState } from 'react';
import {
  DEFAULT_DISK_VIEWPORT,
  fitViewportToBounds,
  panViewport,
  zoomViewportAroundPoint,
  type DiskViewport,
} from '@infra/canvas/disk-viewport';

export function useDiskViewport(initial: DiskViewport = DEFAULT_DISK_VIEWPORT) {
  const [viewport, setViewport] = useState<DiskViewport>(initial);

  const zoom = useCallback((delta: number, pointerX: number, pointerY: number) => {
    setViewport((prev) => zoomViewportAroundPoint(prev, delta, pointerX, pointerY));
  }, []);

  const pan = useCallback((deltaX: number, deltaY: number) => {
    setViewport((prev) => panViewport(prev, deltaX, deltaY));
  }, []);

  const resetViewport = useCallback(() => {
    setViewport(DEFAULT_DISK_VIEWPORT);
  }, []);

  const fitToScreen = useCallback(
    (
      bounds: { minX: number; minY: number; maxX: number; maxY: number },
      viewportWidth: number,
      viewportHeight: number
    ) => {
      setViewport(fitViewportToBounds(bounds, viewportWidth, viewportHeight));
    },
    []
  );

  return {
    viewport,
    zoom,
    pan,
    resetViewport,
    fitToScreen,
  };
}
