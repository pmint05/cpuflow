export interface DiskCoordinateInput {
  cylinder: number;
  maxCylinder: number;
  width: number;
  paddingX: number;
}

export interface TimelineCoordinateInput {
  stepIndex: number;
  stepHeight: number;
  paddingY: number;
}

export function cylinderToX({
  cylinder,
  maxCylinder,
  width,
  paddingX,
}: DiskCoordinateInput): number {
  const safeMax = Math.max(1, maxCylinder);
  const clamped = Math.max(0, Math.min(cylinder, safeMax));
  const drawableWidth = Math.max(1, width - paddingX * 2);
  return paddingX + (clamped / safeMax) * drawableWidth;
}

export function stepToY({
  stepIndex,
  stepHeight,
  paddingY,
}: TimelineCoordinateInput): number {
  return paddingY + Math.max(0, stepIndex) * Math.max(1, stepHeight);
}
