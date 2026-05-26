export interface DiskAnimationState {
  startedAt: number;
  durationMs: number;
}

export function getAnimationProgress(
  state: DiskAnimationState,
  now: number
): number {
  if (state.durationMs <= 0) return 1;
  const elapsed = Math.max(0, now - state.startedAt);
  return Math.min(1, elapsed / state.durationMs);
}
