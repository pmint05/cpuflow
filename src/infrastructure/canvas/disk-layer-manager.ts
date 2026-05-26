export type DiskRenderLayer =
  | 'background-grid'
  | 'axis'
  | 'ghost-preview'
  | 'completed-path'
  | 'active-segment'
  | 'marker'
  | 'active-head'
  | 'tooltip-overlay';

const ORDERED_LAYERS: DiskRenderLayer[] = [
  'background-grid',
  'axis',
  'ghost-preview',
  'completed-path',
  'active-segment',
  'marker',
  'active-head',
  'tooltip-overlay',
];

export function getDiskRenderLayers(): DiskRenderLayer[] {
  return [...ORDERED_LAYERS];
}
