import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import type { DiskSimulationResult } from '@domain/types/disk-scheduling';

interface DiskMetricsProps {
  result: DiskSimulationResult | null;
}

export function DiskMetrics({ result }: DiskMetricsProps) {
	if (!result) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Metrics</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						Run a simulation to see metrics.
					</p>
				</CardContent>
			</Card>
		);
	}

	const meaningfulSteps = result.countJumps 
		? result.steps 
		: result.steps.filter(s => s.type !== 'JUMP');

	const movementCount = meaningfulSteps.length;
	const average = movementCount > 0 ? result.totalDistance / movementCount : 0;
	const maxJumpStep = meaningfulSteps.reduce(
		(largest, step) =>
			!largest || step.distance > largest.distance ? step : largest,
		null as (typeof result.steps)[0] | null,
	);

	return (
		<Card className="shadow-none">
			<CardHeader>
				<CardTitle>Simulation Metrics</CardTitle>
			</CardHeader>
			<CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<div className="rounded-lg border bg-card p-4">
					<p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
						Total Seek Distance
					</p>
					<p className="mt-1 text-3xl font-bold tracking-tight">
						{result.totalDistance}
					</p>
					<p className="mt-1 text-[10px] text-muted-foreground">
						Total cylinders traversed
					</p>
				</div>

				<div className="rounded-lg border bg-card p-4">
					<div className="flex items-center justify-between">
						<p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
							Average Seek
						</p>
						<span className="text-[10px] font-mono text-muted-foreground">
							Σ / N
						</span>
					</div>
					<p className="mt-1 text-3xl font-bold tracking-tight">
						{average.toFixed(2)}
					</p>
					<p className="mt-1 text-[10px] text-muted-foreground">
						{result.totalDistance} / {movementCount || 1} {result.countJumps ? 'movements & jumps' : 'movements'}
					</p>
				</div>

				<div className="rounded-lg border bg-card p-4">
					<p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
						Max Jump
					</p>
					<p className="mt-1 text-3xl font-bold tracking-tight">
						{maxJumpStep?.distance ?? 0}
					</p>
					<p className="mt-1 text-[10px] font-medium text-muted-foreground">
						{maxJumpStep
							? `Cylinder ${maxJumpStep.from} → ${maxJumpStep.to}`
							: "No movement recorded"}
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
