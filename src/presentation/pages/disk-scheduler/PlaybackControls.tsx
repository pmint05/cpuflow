import { Button } from '@components/ui/button';
import { Slider } from '@components/ui/slider';

interface PlaybackControlsProps {
  isPlaying: boolean;
  step: number;
  maxStep: number;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (step: number) => void;
  onSpeedChange: (speed: number) => void;
}

const SPEEDS = [0.25, 0.5, 1, 2, 4] as const;

export function PlaybackControls({
  isPlaying,
  step,
  maxStep,
  speed,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onSeek,
  onSpeedChange,
}: PlaybackControlsProps) {
  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button size="sm" onClick={isPlaying ? onPause : onPlay}>
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        <Button size="sm" variant="outline" onClick={onNext}>
          Next
        </Button>
        <span className="text-sm text-muted-foreground">
          Step {step} / {maxStep}
        </span>
      </div>

      <Slider
        value={[step]}
        min={0}
        max={Math.max(maxStep, 0)}
        step={1}
        onValueChange={(value) => onSeek(value[0] ?? 0)}
      />

      <div className="flex flex-wrap gap-2">
        {SPEEDS.map((candidate) => (
          <Button
            key={candidate}
            size="sm"
            variant={candidate === speed ? 'default' : 'outline'}
            onClick={() => onSpeedChange(candidate)}
          >
            {candidate}x
          </Button>
        ))}
      </div>
    </div>
  );
}
