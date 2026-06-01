import { useMemo, useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { PageBreadcrumb } from "@presentation/components/shared/PageBreadcrumb";
import { useDiskScheduler, type DiskSchedulerInput, DISK_SCHEDULER_DEFAULT_INPUT } from "@app/disk-scheduler/useDiskScheduler";
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
import { ArrowRightIcon, Copy } from "lucide-react";
import {
	parseQueue,
} from "@infra/serializers/disk-scheduler-config-serializer";
import type { DiskInputFormValues } from "@domain/validators/disk-input-validator";

export function DiskSchedulerPage() {
	const [urlConfig, setUrlConfig] = useDiskUrlState();
	const diskCanvasRef = useRef<DiskCanvasHandle | null>(null);

	// Separate state for actual simulation execution
	const [activeSimulationInput, setActiveSimulationInput] = useState<DiskSchedulerInput>(() => ({
		algorithm: urlConfig.algo,
		initialHead: urlConfig.head,
		queue: urlConfig.queue,
		maxCylinder: urlConfig.max,
		direction: urlConfig.direction,
		includeEdges: urlConfig.includeEdges,
		countJumps: urlConfig.countJumps,
		scannerMode: urlConfig.scanner,
	}));

	const {
		result,
		comparisonMetrics,
		currentStep,
		animationProgress,
		isPlaying,
		playbackSpeed,
		play,
		pause,
		reset,
		nextStep,
		previousStep,
		seekToStep,
		setPlaybackSpeed,
	} = useDiskScheduler(activeSimulationInput);

	const handleUrlConfigChange = <K extends keyof typeof urlConfig>(
		key: K,
		value: (typeof urlConfig)[K],
	) => {
		const nextConfig = { ...urlConfig, [key]: value };
		setUrlConfig(nextConfig);

		// Visualization and logic-influencing toggles update simulation reactively
		if (key === "scanner") {
			setActiveSimulationInput(prev => ({ ...prev, scannerMode: value as boolean }));
		} else if (key === "countJumps") {
			setActiveSimulationInput(prev => ({ ...prev, countJumps: value as boolean }));
		} else if (key === "includeEdges") {
			setActiveSimulationInput(prev => ({ ...prev, includeEdges: value as boolean }));
		}
	};

	// Real-time URL synchronization (debounce is handled in hook)
	const handleFormValuesChange = (formValues: DiskInputFormValues) => {
		setUrlConfig({
			...urlConfig,
			algo: formValues.algorithm,
			head: formValues.initialHead,
			max: formValues.maxCylinder,
			direction: formValues.direction,
			includeEdges: formValues.includeEdges,
			queue: parseQueue(formValues.queueInput, formValues.maxCylinder),
		});
	};

	// Explicit execution trigger
	const handleRunSimulation = (formValues: DiskInputFormValues) => {
		setActiveSimulationInput({
			algorithm: formValues.algorithm,
			initialHead: formValues.initialHead,
			maxCylinder: formValues.maxCylinder,
			direction: formValues.direction,
			includeEdges: formValues.includeEdges,
			queue: parseQueue(formValues.queueInput, formValues.maxCylinder),
			countJumps: urlConfig.countJumps,
			scannerMode: urlConfig.scanner,
		});
	};

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
							algorithm={urlConfig.algo}
							initialHead={urlConfig.head}
							direction={urlConfig.direction}
							maxCylinder={urlConfig.max}
							queueInput={urlConfig.queue.join(", ")}
							includeEdges={urlConfig.includeEdges}
							onValuesChange={handleFormValuesChange}
							onSubmit={handleRunSimulation}
						/>
						<DiskSettingsCard
							algorithm={urlConfig.algo}
							ghostEnabled={urlConfig.ghost}
							academicEnabled={urlConfig.academic}
							scannerEnabled={urlConfig.scanner}
							includeEdges={urlConfig.includeEdges}
							countJumps={urlConfig.countJumps}
							showGrid={urlConfig.grid}
							showHead={urlConfig.headLabel}
							highlightCurrent={urlConfig.highlight}
							markerLabelSize={urlConfig.markerSize}
							tickLabelSize={urlConfig.tickSize}
							verticalSpacing={urlConfig.spacing}
							showMarkerLabels={urlConfig.markerLabels}
							showTickLabels={urlConfig.tickLabels}
							showSequenceTicks={urlConfig.sequenceTicks}
							onGhostChange={(value) => handleUrlConfigChange("ghost", value)}
							onAcademicChange={(value) =>
								handleUrlConfigChange("academic", value)
							}
							onScannerChange={(value) => handleUrlConfigChange("scanner", value)}
							onIncludeEdgesChange={(value) => handleUrlConfigChange("includeEdges", value)}
							onCountJumpsChange={(value) => handleUrlConfigChange("countJumps", value)}
							onShowGridChange={(value) => handleUrlConfigChange("grid", value)}
							onShowHeadChange={(value) =>
								handleUrlConfigChange("headLabel", value)
							}
							onHighlightCurrentChange={(value) =>
								handleUrlConfigChange("highlight", value)
							}
							onMarkerLabelSizeChange={(value) =>
								handleUrlConfigChange("markerSize", value)
							}
							onTickLabelSizeChange={(value) =>
								handleUrlConfigChange("tickSize", value)
							}
							onVerticalSpacingChange={(value) =>
								handleUrlConfigChange("spacing", value)
							}
							onShowMarkerLabelsChange={(value) =>
								handleUrlConfigChange("markerLabels", value)
							}
							onShowTickLabelsChange={(value) =>
								handleUrlConfigChange("tickLabels", value)
							}
							onShowSequenceTicksChange={(value) =>
								handleUrlConfigChange("sequenceTicks", value)
							}
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
									animationProgress={animationProgress}
									scannerModeEnabled={urlConfig.scanner}
									ghostEnabled={urlConfig.ghost}
									showGrid={urlConfig.grid}
									showHead={urlConfig.headLabel}
									highlightCurrent={urlConfig.highlight}
									maxCylinder={activeSimulationInput.maxCylinder}
									markerLabelSize={urlConfig.markerSize}
									tickLabelSize={urlConfig.tickSize}
									verticalSpacing={urlConfig.spacing}
									showMarkerLabels={urlConfig.markerLabels}
									showTickLabels={urlConfig.tickLabels}
									showSequenceTicks={urlConfig.sequenceTicks}
									onExport={(options) => {
										diskCanvasRef.current?.exportImage({
											format: options.format,
											quality: options.quality,
											scale: options.scale,
										});
									}}
								/>
								
								{result && (
									<Card className="border-primary/10 shadow-none py-0">
										<CardContent className="px-4 py-3">
											<div className="flex flex-col gap-3">
												<div className="flex items-center justify-between">
													<span className="text-[10px] font-bold uppercase tracking-wider text-primary/60">
														Full Traversal Path
													</span>
													<Button
														variant="ghost"
														size="icon"
														className="h-6 w-6 text-muted-foreground hover:bg-accent hover:text-foreground"
														onClick={() => {
															const path = result.seekSequence.slice(1).join(", ");
															navigator.clipboard.writeText(path);
															toast.success("Path copied to clipboard!");
														}}
														title="Copy path (excluding initial head)"
													>
														<Copy className="size-3" />
													</Button>
												</div>
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

						{urlConfig.academic && (
							<AcademicModePanel
								enabled={urlConfig.academic}
								result={result}
								currentStep={currentStep}
							/>
						)}

						<DiskTimeline result={result} currentStep={currentStep} onSeek={seekToStep} />
						
						<DiskMetrics result={result} />
						
						<DiskAlgorithmComparison
							metrics={comparisonMetrics}
							onAlgorithmSelect={(algorithm) => {
								const nextConfig = { ...urlConfig, algo: algorithm };
								setUrlConfig(nextConfig);
								// Algorithm comparison click should also trigger simulation update
								setActiveSimulationInput(prev => ({
									...prev,
									algorithm,
									// Ensure current toggles are preserved
									includeEdges: urlConfig.includeEdges,
									countJumps: urlConfig.countJumps,
								}));
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
