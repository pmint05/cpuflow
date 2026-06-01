import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@presentation/components/ui/collapsible";
import { Button } from "@components/ui/button";
import { ChevronDown, ListOrdered } from "lucide-react";
import type { DiskSimulationResult } from "@domain/types/disk-scheduling";
import { cn } from "@/lib/utils";

interface DiskTimelineProps {
	result: DiskSimulationResult | null;
	currentStep: number;
	onSeek: (step: number) => void;
}

export function DiskTimeline({
	result,
	currentStep,
	onSeek,
}: DiskTimelineProps) {
	const [isOpen, setIsOpen] = useState(false);

	const displaySteps = result
		? [
				{
					step: 0,
					from: result.initialHead,
					to: result.initialHead,
					distance: 0,
					cumulativeDistance: 0,
					direction: "RIGHT" as const,
					pendingRequests: result.seekSequence.slice(1),
					completedRequests: [],
					explanation: "Initial head position before any request is served.",
					calculation: {
						formula: "Initial state",
						result: 0,
					},
				},
				...result.steps,
			]
		: [];

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
			<Card className="shadow-none overflow-hidden transition-all duration-300">
				<CollapsibleTrigger asChild>
					<CardHeader className="">
						<div className="flex items-center justify-between gap-4">
							<CardTitle className="text-lg font-bold">
								Simulation Timeline
							</CardTitle>
							<Button variant="ghost" size="icon-sm">
								<ChevronDown
									className={cn(
										"size-4 transition-transform duration-300 -rotate-90",
										isOpen && "rotate-0",
									)}
								/>
							</Button>
						</div>
					</CardHeader>
				</CollapsibleTrigger>
				<CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
					<CardContent className="p-4 bg-muted/20">
						{!result || displaySteps.length === 0 ? (
							<p className="text-sm text-muted-foreground italic py-4 text-center">
								No simulation steps available. Run the simulation to view the
								timeline.
							</p>
						) : (
							<div className="max-h-[320px] space-y-2 overflow-y-auto pr-2 custom-scrollbar">
								{displaySteps.map((step, index) => (
									<button
										key={`${step.step}-${step.from}-${step.to}`}
										type="button"
										onClick={() => onSeek(index)}
										className={cn(
											"w-full text-left rounded-lg border p-3 text-sm transition-all relative overflow-hidden group",
											index === currentStep
												? "border-primary bg-primary/10 ring-1 ring-primary shadow-sm"
												: "bg-card hover:border-primary/40 hover:bg-accent",
										)}>
										{index === currentStep && (
											<div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
										)}
										<div className="flex items-center justify-between mb-1.5">
											<span
												className={cn(
													"font-bold",
													index === currentStep
														? "text-primary"
														: "text-muted-foreground",
												)}>
												Step {step.step}
											</span>
											<span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded">
												{index === 0 ? "Start" : "Move"}
											</span>
										</div>
										<div className="flex items-center justify-between gap-4">
											<p className="font-mono text-base font-bold text-foreground">
												{step.from}
												<span className="mx-2 text-muted-foreground/40">→</span>
												{step.to}
											</p>
											<div className="text-right">
												<p className="text-[10px] font-bold text-muted-foreground/60 uppercase">
													Distance
												</p>
												<p className="text-xs font-mono font-bold">
													{step.distance}
													<span className="mx-1 text-muted-foreground/30">
														|
													</span>
													<span className="text-primary">
														Σ {step.cumulativeDistance}
													</span>
												</p>
											</div>
										</div>
									</button>
								))}
							</div>
						)}
					</CardContent>
				</CollapsibleContent>
			</Card>
		</Collapsible>
	);
}
