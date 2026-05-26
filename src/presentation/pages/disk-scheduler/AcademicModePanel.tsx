import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import type { DiskSimulationResult } from '@domain/types/disk-scheduling';

interface AcademicModePanelProps {
  enabled: boolean;
  result: DiskSimulationResult | null;
  currentStep: number;
}

export function AcademicModePanel({ enabled, result, currentStep }: AcademicModePanelProps) {
  if (!enabled) return null;

  // Step 0 in UI is the initial state. result.steps[0] is Step 1 in UI.
  const stepIndex = currentStep - 1;
  const step = result?.steps[stepIndex];

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">Academic Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {currentStep === 0 ? (
          <p className="text-muted-foreground italic">System initialized at cylinder {result?.initialHead}. No movements yet.</p>
        ) : !step ? (
          <p className="text-muted-foreground">End of simulation reached.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="font-bold text-xs uppercase text-muted-foreground">Formula (Distance)</p>
              <p className="rounded-md border bg-primary/5 p-3 font-mono text-primary">
                {step.calculation?.formula ?? 'n/a'}
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-bold text-xs uppercase text-muted-foreground">Total Cumulative</p>
              <p className="rounded-md border bg-muted/30 p-3 font-mono">
                {step.cumulativeDistance} cylinders
              </p>
            </div>
            <div className="md:col-span-2 space-y-2">
              <p className="font-bold text-xs uppercase text-muted-foreground">Algorithm Explanation</p>
              <p className="text-foreground leading-relaxed">
                {step.explanation ?? 'No explanation available.'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
