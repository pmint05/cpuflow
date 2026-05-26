export interface DiskViewport {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export const DEFAULT_DISK_VIEWPORT: DiskViewport = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
};

export function clampViewportScale(scale: number): number {
  return Math.min(5, Math.max(0.25, scale));
}

export function zoomViewportAroundPoint(
  viewport: DiskViewport,
  delta: number,
  pointerX: number,
  pointerY: number
): DiskViewport {
  const nextScale = clampViewportScale(viewport.scale + delta);
  const contentX = (pointerX - viewport.offsetX) / viewport.scale;
  const contentY = (pointerY - viewport.offsetY) / viewport.scale;

  return {
    scale: nextScale,
    offsetX: pointerX - contentX * nextScale,
    offsetY: pointerY - contentY * nextScale,
  };
}

export function panViewport(
  viewport: DiskViewport,
  deltaX: number,
  deltaY: number
): DiskViewport {
  return {
    ...viewport,
    offsetX: viewport.offsetX + deltaX,
    offsetY: viewport.offsetY + deltaY,
  };
}

export function fitViewportToBounds(
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  },
  viewportWidth: number,
  viewportHeight: number,
  padding = 48
): DiskViewport {
  const contentWidth = Math.max(1, bounds.maxX - bounds.minX);
  const contentHeight = Math.max(1, bounds.maxY - bounds.minY);
  const scaleX = (viewportWidth - padding * 2) / contentWidth;
  const scaleY = (viewportHeight - padding * 2) / contentHeight;
  const scale = clampViewportScale(Math.min(scaleX, scaleY));

  const fittedWidth = contentWidth * scale;
  const fittedHeight = contentHeight * scale;
  const offsetX = padding + ((viewportWidth - padding * 2) - fittedWidth) / 2 - bounds.minX * scale;
  const offsetY = padding + ((viewportHeight - padding * 2) - fittedHeight) / 2 - bounds.minY * scale;

  return {
    scale,
    offsetX,
    offsetY,
  };
}
