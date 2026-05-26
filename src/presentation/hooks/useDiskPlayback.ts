import { useCallback } from 'react';

interface DiskPlaybackController {
  play: () => void;
  pause: () => void;
  nextStep: () => void;
  previousStep: () => void;
  seekToStep: (step: number) => void;
  setPlaybackSpeed: (speed: number) => void;
}

export function useDiskPlayback(controller: DiskPlaybackController) {
  const play = useCallback(() => controller.play(), [controller]);
  const pause = useCallback(() => controller.pause(), [controller]);
  const nextStep = useCallback(() => controller.nextStep(), [controller]);
  const previousStep = useCallback(() => controller.previousStep(), [controller]);
  const seekToStep = useCallback((step: number) => controller.seekToStep(step), [controller]);
  const setPlaybackSpeed = useCallback(
    (speed: number) => controller.setPlaybackSpeed(speed),
    [controller]
  );

  return {
    play,
    pause,
    nextStep,
    previousStep,
    seekToStep,
    setPlaybackSpeed,
  };
}
