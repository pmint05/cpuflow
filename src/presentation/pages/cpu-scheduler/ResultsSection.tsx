import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Separator } from "@components/ui/separator";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@components/ui/dialog";
import { ResultsTable } from "./ResultsTable";
import { GanttChart, type GanttChartRef } from "./GanttChart";
import type {
	SchedulerResult,
	AlgorithmType,
	ProcessAnnotationMode,
	TimeLabelRenderMode,
	GanttBlock,
	ProcessResult,
} from "@domain/types/cpu-scheduling";
import { requiresPriority } from "@domain/algorithms/cpu-scheduling";
import { DownloadIcon, Maximize2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResultsSectionProps {
	result?: SchedulerResult | { ganttChart: GanttBlock[]; processes?: ProcessResult[] };
	algorithm?: AlgorithmType;
	colorful?: boolean;
	darkMode?: boolean;
	processAnnotationMode?: ProcessAnnotationMode;
	timeLabelRenderMode?: TimeLabelRenderMode;
	allowProcessNameInBlock?: boolean;
	showQueueAnnotation?: boolean;
}

export function ResultsSection({
	result,
	algorithm = "FCFS",
	colorful = true,
	darkMode = false,
	processAnnotationMode = "POINTER_LEVELING",
	timeLabelRenderMode = "LINE_LEVELING",
	allowProcessNameInBlock = true,
	showQueueAnnotation = false,
}: ResultsSectionProps) {
	if (!result) return null;

	const showPriority = algorithm ? requiresPriority(algorithm) : false;
	const ganttChartRef = useRef<GanttChartRef>(null);
	const [isPreviewOpen, setIsPreviewOpen] = useState(false);

	const handleExport = () => {
		ganttChartRef.current?.exportToPNG();
	};

	// For multi-queue results, show aggregate metrics
	const isMultiQueue = 'queues' in result;
	const ganttBlocks = result.ganttChart || [];
	const processes = (result as SchedulerResult).processes || [];

	return (
		<Card>
			<CardHeader>
				<CardTitle>Results</CardTitle>
				{isMultiQueue && (
					<p className="text-sm text-muted-foreground mt-2">
						Multi-Queue Scheduling Results (Merged Timeline)
					</p>
				)}
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Process Table - Only for single queue */}
				{!isMultiQueue && processes.length > 0 && (
					<>
						<div>
							<h3 className="text-lg font-semibold mb-4">Process Metrics</h3>
							<ResultsTable
								result={result as SchedulerResult}
								showPriority={showPriority}
							/>
						</div>

						<Separator />
					</>
				)}

				{/* Multi-Queue Summary - Only for multi-queue */}
				{isMultiQueue && 'totalAverageWaitingTime' in result && (
					<>
						<div>
							<h3 className="text-lg font-semibold mb-4">Queue Summary</h3>
							<div className="grid grid-cols-2 gap-4">
								<div className="p-3 bg-secondary/30 rounded-lg">
									<p className="text-xm text-muted-foreground">Avg Waiting Time</p>
									<p className="text-2xl font-bold">
										{(result as any).totalAverageWaitingTime?.toFixed(2) || "N/A"}
									</p>
								</div>
								<div className="p-3 bg-secondary/30 rounded-lg">
									<p className="text-xm text-muted-foreground">Avg Response Time</p>
									<p className="text-2xl font-bold">
										{(result as any).totalAverageResponceTime?.toFixed(2) || "N/A"}
									</p>
								</div>
							</div>
						</div>

						<Separator />
					</>
				)}

				{/* Gantt Chart */}
				<div>
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold">Gantt Chart</h3>
						<div className="flex items-center gap-2">
							<Button
								onClick={() => setIsPreviewOpen(true)}
								variant="outline"
								size="icon"
								disabled={ganttBlocks.length === 0}
								aria-label="Open fullscreen chart preview">
								<Maximize2Icon className="size-4" />
							</Button>
							<Button
								onClick={handleExport}
								variant="outline"
								size="sm"
								disabled={ganttBlocks.length === 0}>
								<DownloadIcon className="size-4 mr-2" />
								Export PNG
							</Button>
						</div>
					</div>
					<div
						className={cn("rounded-xl", darkMode ? "bg-neutral-800" : "bg-white")}>
						<GanttChart
							ref={ganttChartRef}
							blocks={ganttBlocks}
							colorful={colorful}
							darkMode={darkMode}
							processAnnotationMode={processAnnotationMode}
							timeLabelRenderMode={timeLabelRenderMode}
							allowProcessNameInBlock={allowProcessNameInBlock}
							showQueueAnnotation={showQueueAnnotation}
						/>
					</div>

					<Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
						<DialogContent className="sm:max-w-[95vw] w-[95vw] p-4">
							<DialogHeader>
								<DialogTitle>Gantt Chart Fullscreen Preview</DialogTitle>
							</DialogHeader>
							<div className={cn("h-full rounded-xl p-2", darkMode ? "bg-neutral-900" : "bg-white")}>
								<GanttChart
									blocks={ganttBlocks}
									colorful={colorful}
									darkMode={darkMode}
									processAnnotationMode={processAnnotationMode}
									timeLabelRenderMode={timeLabelRenderMode}
									allowProcessNameInBlock={allowProcessNameInBlock}
									showQueueAnnotation={showQueueAnnotation}
								/>
							</div>
						</DialogContent>
					</Dialog>
				</div>
			</CardContent>
		</Card>
	);
}
