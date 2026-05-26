import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import type { DiskSimulationResult } from '@domain/types/disk-scheduling';

interface DiskTimelineProps {
  result: DiskSimulationResult | null;
  currentStep: number;
  onSeek: (step: number) => void;
}

export function DiskTimeline({ result, currentStep, onSeek }: DiskTimelineProps) {
  const displaySteps = result
    ? [
        {
          step: 0,
          from: result.initialHead,
          to: result.initialHead,
          distance: 0,
          cumulativeDistance: 0,
          direction: 'RIGHT' as const,
          pendingRequests: result.seekSequence.slice(1),
          completedRequests: [],
          explanation: 'Initial head position before any request is served.',
          calculation: {
            formula: 'Initial state',
            result: 0,
          },
        },
        ...result.steps,
      ]
    : [];

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Simulation Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {!result || displaySteps.length === 0 ? (
          <p className="text-sm text-muted-foreground">No simulation steps available.</p>
        ) : (
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {displaySteps.map((step, index) => (
              <button
                key={`${step.step}-${step.from}-${step.to}`}
                type="button"
                onClick={() => onSeek(index)}
                className={`w-full text-left rounded-md border p-3 text-sm transition-all hover:border-primary/50 ${
                  index === currentStep 
                    ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                    : 'bg-card'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-primary">Step {step.step}</span>
                  <span className="text-[10px] font-medium uppercase text-muted-foreground">
                    {index === 0 ? 'Start' : 'Move'}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <p className="font-medium text-foreground">
                    {step.from} → {step.to}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Dist: {step.distance} | Total: {step.cumulativeDistance}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
