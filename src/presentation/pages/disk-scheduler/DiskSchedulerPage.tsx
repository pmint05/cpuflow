import { useMemo, useRef, useState } from "react";
import { PageBreadcrumb } from "@presentation/components/shared/PageBreadcrumb";
import { useDiskScheduler } from "@app/disk-scheduler/useDiskScheduler";
import { useDiskUrlState } from "@presentation/hooks/useDiskUrlState";
import { DiskInputForm } from "./DiskInputForm";
import { PlaybackControls } from "./PlaybackControls";
import { DiskTimeline } from "./DiskTimeline";
import { DiskMetrics } from "./DiskMetrics";
import { DiskAlgorithmComparison } from "./DiskAlgorithmComparison";
import { AcademicModePanel } from "./AcademicModePanel";
import { DiskCanvas, type DiskCanvasHandle } from "./DiskCanvas";
import { Button } from "@components/ui/button";
import { DiskSettingsCard } from "./DiskSettingsCard";
import { Card, CardContent } from "@presentation/components/ui/card";
import { Badge } from "@presentation/components/ui/badge";
import { ArrowRightIcon } from "lucide-react";

export function DiskSchedulerPage() {
	const [urlConfig, setUrlConfig] = useDiskUrlState();
	const diskCanvasRef = useRef<DiskCanvasHandle | null>(null);
	const [markerLabelSize, setMarkerLabelSize] = useState(12);
	const [tickLabelSize, setTickLabelSize] = useState(11);
	const [showGrid, setShowGrid] = useState(true);
	const [showHead, setShowHead] = useState(true);
	const [highlightCurrent, setHighlightCurrent] = useState(true);
	const [verticalSpacing, setVerticalSpacing] = useState(86);
	const [showMarkerLabels, setShowMarkerLabels] = useState(true);
	const [showTickLabels, setShowTickLabels] = useState(true);
	const [showSequenceTicks, setShowSequenceTicks] = useState(false);

	const {
		input,
		result,
		comparisonMetrics,
		currentStep,
		isPlaying,
		playbackSpeed,
		ghostPreviewEnabled,
		academicModeEnabled,
		setInput,
		runSimulation,
		runComparison,
		play,
		pause,
		reset,
		nextStep,
		previousStep,
		seekToStep,
		setPlaybackSpeed,
		toggleGhostPreview,
		toggleAcademicMode,
	} = useDiskScheduler({
		algorithm: urlConfig.algo,
		initialHead: urlConfig.head,
		queue: urlConfig.queue,
		maxCylinder: urlConfig.max,
		direction: urlConfig.direction,
		includeEdges: urlConfig.includeEdges,
	});

	const queueInput = useMemo(() => input.queue.join(", "), [input.queue]);

	return (
		<div className="p-4 lg:p-8">
			<div className="container mx-auto max-w-7xl space-y-6">
				<div className="space-y-3">
					<PageBreadcrumb
						items={[{ label: "Home", href: "/" }, { label: "Disk Scheduler" }]}
					/>
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h1 className="text-2xl font-bold tracking-tight">
								Disk Scheduler Visualization
							</h1>
							<p className="text-sm text-muted-foreground">
								FCFS, SSTF, SCAN, C-SCAN, LOOK, and C-LOOK interactive
								simulator.
							</p>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px_minmax(0,1fr)]">
					{/* Left Column: Input & Configuration */}
					<div className="space-y-6">
						<DiskInputForm
							key={`${input.algorithm}-${input.initialHead}-${input.queue.length}`}
							algorithm={input.algorithm}
							initialHead={input.initialHead}
							direction={input.direction}
							maxCylinder={input.maxCylinder}
							queueInput={queueInput}
							includeEdges={input.includeEdges ?? true}
							onSubmit={(payload) => {
								setInput(payload);
								runSimulation(payload);
								runComparison(payload);
								setUrlConfig({
									...urlConfig,
									algo: payload.algorithm,
									head: payload.initialHead,
									direction: payload.direction,
									max: payload.maxCylinder,
									queue: payload.queue,
									includeEdges: payload.includeEdges,
								});
							}}
						/>

						<DiskSettingsCard
							algorithm={input.algorithm}
							ghostEnabled={ghostPreviewEnabled}
							academicEnabled={academicModeEnabled}
							includeEdges={input.includeEdges ?? true}
							showGrid={showGrid}
							showHead={showHead}
							highlightCurrent={highlightCurrent}
							markerLabelSize={markerLabelSize}
							tickLabelSize={tickLabelSize}
							verticalSpacing={verticalSpacing}
							showMarkerLabels={showMarkerLabels}
							showTickLabels={showTickLabels}
							showSequenceTicks={showSequenceTicks}
							onGhostChange={toggleGhostPreview}
							onAcademicChange={toggleAcademicMode}
							onIncludeEdgesChange={(value) => {
								const nextInput = { ...input, includeEdges: value };
								setInput(nextInput);
								runSimulation(nextInput);
								runComparison(nextInput);
								setUrlConfig({ ...urlConfig, includeEdges: value });
							}}
							onShowGridChange={setShowGrid}
							onShowHeadChange={setShowHead}
							onHighlightCurrentChange={setHighlightCurrent}
							onMarkerLabelSizeChange={setMarkerLabelSize}
							onTickLabelSizeChange={setTickLabelSize}
							onVerticalSpacingChange={setVerticalSpacing}
							onShowMarkerLabelsChange={setShowMarkerLabels}
							onShowTickLabelsChange={setShowTickLabels}
							onShowSequenceTicksChange={setShowSequenceTicks}
						/>

						<Button
							variant="outline"
							onClick={reset}
							className="w-full shadow-none">
							Reset Simulation
						</Button>
					</div>

					{/* Right Column: Visualization & Analysis */}
					<div className="space-y-8">
						<div className="space-y-6">
							<div className="space-y-4">
								<DiskCanvas
									ref={diskCanvasRef}
									result={result}
									currentStep={currentStep}
									ghostEnabled={ghostPreviewEnabled}
									showGrid={showGrid}
									showHead={showHead}
									highlightCurrent={highlightCurrent}
									maxCylinder={input.maxCylinder}
									markerLabelSize={markerLabelSize}
									tickLabelSize={tickLabelSize}
									verticalSpacing={verticalSpacing}
									showMarkerLabels={showMarkerLabels}
									showTickLabels={showTickLabels}
									showSequenceTicks={showSequenceTicks}
									onExport={(options) => {
										diskCanvasRef.current?.exportImage({
											format: options.format,
											quality: options.quality,
											scale: options.scale,
										});
									}}
								/>
								
								{result && (
									<Card className="border-primary/10 shadow-none">
										<CardContent className="px-4">
											<div className="flex flex-col gap-3">
												<span className="text-[10px] font-bold uppercase tracking-wider text-primary/60">
													Full Traversal Path
												</span>
												<div className="flex flex-wrap items-center gap-2">
													{result.seekSequence.map((cylinder, index) => (
														<div key={`${cylinder}-${index}`} className="flex items-center gap-2">
															<Badge 
																variant={index === currentStep ? "default" : "secondary"}
																className="font-mono shadow-none transition-colors"
															>
																{cylinder}
															</Badge>
															{index < result.seekSequence.length - 1 && (
																<ArrowRightIcon className="size-3 text-muted-foreground/50" />
															)}
														</div>
													))}
												</div>
											</div>
										</CardContent>
									</Card>
								)}
							</div>

							<Card className="mx-auto w-full shadow-none">
								<CardContent className="pt-6">
									<PlaybackControls
										isPlaying={isPlaying}
										step={currentStep}
										maxStep={Math.max(result?.steps.length ?? 0, 0)}
										speed={playbackSpeed}
										onPlay={play}
										onPause={pause}
										onNext={nextStep}
										onPrevious={previousStep}
										onSeek={seekToStep}
										onSpeedChange={(speed) => {
											setPlaybackSpeed(speed);
											setUrlConfig({ ...urlConfig, speed });
										}}
									/>
								</CardContent>
							</Card>
						</div>

						{academicModeEnabled && (
							<AcademicModePanel
								enabled={academicModeEnabled}
								result={result}
								currentStep={currentStep}
							/>
						)}

						<DiskTimeline result={result} currentStep={currentStep} onSeek={seekToStep} />
						
						<DiskMetrics result={result} />
						
						<DiskAlgorithmComparison
							metrics={comparisonMetrics}
							onAlgorithmSelect={(algorithm) => {
								const nextInput = { ...input, algorithm };
								setInput(nextInput);
								runSimulation(nextInput);
								runComparison(nextInput);
								setUrlConfig({ ...urlConfig, algo: algorithm });
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
