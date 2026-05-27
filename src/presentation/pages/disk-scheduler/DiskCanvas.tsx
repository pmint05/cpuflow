import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from "react";
import Konva from "konva";
import {
	Stage,
	Layer,
	Line,
	Circle,
	Text,
	Rect,
	Group,
	Arrow,
} from "react-konva";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Badge } from "@presentation/components/ui/badge";
import type { DiskSimulationResult } from "@domain/types/disk-scheduling";
import { cylinderToX, stepToY } from "@infra/canvas/disk-coordinate-system";
import { getDiskAlgorithmColor } from "@infra/canvas/disk-color-palette";
import { getDiskRenderLayers } from "@infra/canvas/disk-layer-manager";
import { useDiskViewport } from "@presentation/hooks/useDiskViewport";
import { CanvasToolbar } from "./CanvasToolbar";

interface DiskCanvasProps {
	result: DiskSimulationResult | null;
	currentStep: number;
	animationProgress: number;
	scannerModeEnabled: boolean;
	ghostEnabled: boolean;
	showGrid: boolean;
	showHead: boolean;
	highlightCurrent: boolean;
	maxCylinder: number;
	markerLabelSize: number;
	tickLabelSize: number;
	verticalSpacing: number;
	showMarkerLabels: boolean;
	showTickLabels: boolean;
	showSequenceTicks: boolean;
	onExport: (options: {
		format: "PNG" | "JPEG";
		quality: number;
		scale: number;
		includeGhost: boolean;
		includeAcademic: boolean;
		includeGrid: boolean;
		includeHead: boolean;
		highlightCurrent: boolean;
	}) => void;
}

export interface DiskCanvasExportOptions {
	format: "PNG" | "JPEG";
	quality: number;
	scale: number;
}

export interface DiskCanvasHandle {
	exportImage: (options: DiskCanvasExportOptions) => void;
	fitToScreen: () => void;
}

type MarkerState = {
	label: string;
	cylinder: number;
	stepIndex: number;
	cumulativeDistance: number;
	x: number;
	y: number;
};

const STAGE_WIDTH = 920;
const AXIS_PADDING_Y = 56;
const BOTTOM_AXIS_HEIGHT = 48; // Space for labels at the bottom
const JUMP_DASH = [10, 16, 2, 16];
const HORIZONTAL_PADDING = 0; // Forced to 0 as requested

export const DiskCanvas = forwardRef<DiskCanvasHandle, DiskCanvasProps>(
	function DiskCanvas(
		{
			result,
			currentStep,
			animationProgress,
			scannerModeEnabled,
			ghostEnabled,
			showGrid,
			showHead,
			highlightCurrent,
			maxCylinder,
			markerLabelSize,
			tickLabelSize,
			verticalSpacing,
			showMarkerLabels,
			showTickLabels,
			showSequenceTicks,
			onExport,
		}: DiskCanvasProps,
		ref,
	) {
		const containerRef = useRef<HTMLDivElement | null>(null);
		const stageRef = useRef<Konva.Stage | null>(null);
		const [stageWidth, setStageWidth] = useState(STAGE_WIDTH);
		const [hoveredMarker, setHoveredMarker] = useState<MarkerState | null>(
			null,
		);
		const { viewport, zoom, pan, resetViewport, fitToScreen } =
			useDiskViewport();

		useEffect(() => {
			const container = containerRef.current;
			if (!container) return;

			const updateSize = () => {
				setStageWidth(Math.max(720, container.clientWidth));
			};

			updateSize();

			const observer = new ResizeObserver(updateSize);
			observer.observe(container);

			return () => {
				observer.disconnect();
			};
		}, []);

		const data = useMemo(() => result?.seekSequence ?? [], [result]);
		const stepCount = result?.steps.length ?? 0;
		const stageHeight = useMemo(
			() =>
				Math.max(
					420,
					AXIS_PADDING_Y * 2 +
						Math.max(stepCount, 1) * verticalSpacing +
						BOTTOM_AXIS_HEIGHT,
				),
			[stepCount, verticalSpacing],
		);

		const currentPointIndex = Math.min(
			currentStep,
			Math.max(data.length - 1, 0),
		);
		
		const currentHead = useMemo(() => {
			if (!result) return 0;
			const current = data[currentPointIndex] ?? result.initialHead;
			if (!scannerModeEnabled || currentStep >= data.length - 1) return current;
			
			const next = data[currentStep + 1] ?? current;
			return current + (next - current) * animationProgress;
		}, [data, currentPointIndex, scannerModeEnabled, animationProgress, currentStep, result]);

		const pathColor = result
			? getDiskAlgorithmColor(result.algorithm)
			: "#3b82f6";
		const strokeWidth = 4;
		const markerRadius = Math.max(18, markerLabelSize * 1.6);

		const markers = useMemo<MarkerState[]>(() => {
			if (!result) return [];

			return data.map((cylinder, index) => {
				const x = cylinderToX({
					cylinder,
					maxCylinder,
					width: stageWidth,
					paddingX: HORIZONTAL_PADDING,
				});
				const y = stepToY({
					stepIndex: index,
					stepHeight: verticalSpacing,
					paddingY: AXIS_PADDING_Y,
				});

				return {
					label: String(cylinder),
					cylinder,
					stepIndex: index,
					cumulativeDistance:
						index === 0
							? 0
							: (result.steps[index - 1]?.cumulativeDistance ?? 0),
					x,
					y,
				};
			});
		}, [data, maxCylinder, result, stageWidth, verticalSpacing]);

		const pointsBounds = useMemo(() => {
			if (markers.length === 0) {
				return {
					minX: HORIZONTAL_PADDING,
					minY: AXIS_PADDING_Y,
					maxX: stageWidth - HORIZONTAL_PADDING,
					maxY: stageHeight - AXIS_PADDING_Y,
				};
			}

			const allX = markers.map((marker) => marker.x);
			const allY = markers.map((marker) => marker.y);
			const labelPadding = markerRadius + 20;

			return {
				minX: Math.max(0, Math.min(...allX) - labelPadding),
				minY: Math.max(0, Math.min(...allY) - labelPadding),
				maxX: Math.min(stageWidth, Math.max(...allX) + labelPadding),
				maxY: Math.min(stageHeight, Math.max(...allY) + labelPadding),
			};
		}, [markers, stageHeight, stageWidth, markerRadius]);

		const segments = useMemo(() => {
			if (!result) return [];

			return result.seekSequence.slice(0, -1).map((from, index) => {
				const to = result.seekSequence[index + 1];
				const step = result.steps[index];
				const fromX = cylinderToX({
					cylinder: from,
					maxCylinder,
					width: stageWidth,
					paddingX: HORIZONTAL_PADDING,
				});
				const toX = cylinderToX({
					cylinder: to,
					maxCylinder,
					width: stageWidth,
					paddingX: HORIZONTAL_PADDING,
				});
				const y1 = stepToY({
					stepIndex: index,
					stepHeight: verticalSpacing,
					paddingY: AXIS_PADDING_Y,
				});
				const y2 = stepToY({
					stepIndex: index + 1,
					stepHeight: verticalSpacing,
					paddingY: AXIS_PADDING_Y,
				});

				// Calculate arrow points to stop at circle boundaries
				const dx = toX - fromX;
				const dy = y2 - y1;
				const angle = Math.atan2(dy, dx);

				const startX = fromX + Math.cos(angle) * markerRadius;
				const startY = y1 + Math.sin(angle) * markerRadius;
				const endX = toX - Math.cos(angle) * (markerRadius + 2);
				const endY = y2 - Math.sin(angle) * (markerRadius + 2);

				return {
					from,
					to,
					points: [startX, startY, endX, endY],
					index,
					type: step.type,
				};
			});
		}, [result, maxCylinder, stageWidth, markerRadius, verticalSpacing]);

		const completedSegments = segments.slice(0, Math.max(0, currentStep));
		const activeSegmentIndex =
			currentStep < segments.length
				? currentStep
				: null;
		const activeSegment =
			activeSegmentIndex === null
				? null
				: (segments[activeSegmentIndex] ?? null);
		const futureSegments = segments.slice(currentStep + 1);

		const interpolatedActivePoints = useMemo(() => {
			if (!activeSegment || !scannerModeEnabled) return activeSegment?.points ?? [];
			
			const [x1, y1, x2, y2] = activeSegment.points;
			const currentX = x1 + (x2 - x1) * animationProgress;
			const currentY = y1 + (y2 - y1) * animationProgress;
			
			return [x1, y1, currentX, currentY];
		}, [activeSegment, scannerModeEnabled, animationProgress]);

		const scannerHeadX = useMemo(() => {
			return cylinderToX({
				cylinder: currentHead,
				maxCylinder,
				width: stageWidth,
				paddingX: HORIZONTAL_PADDING,
			});
		}, [currentHead, maxCylinder, stageWidth]);

		const gridLines = useMemo(() => {
			// Base ticks
			const ticksCount = 6;
			const baseTicks = Array.from({ length: ticksCount + 1 }, (_, index) => {
				const cylinder = Math.round((maxCylinder / ticksCount) * index);
				const x = cylinderToX({
					cylinder,
					maxCylinder,
					width: stageWidth,
					paddingX: HORIZONTAL_PADDING,
				});
				return { cylinder, x, isSequence: false };
			});

			if (!showSequenceTicks || !result) return baseTicks;

			// Sequence ticks
			const uniqueCylinders = Array.from(new Set(result.seekSequence));
			const sequenceTicks = uniqueCylinders.map((cylinder) => {
				const x = cylinderToX({
					cylinder,
					maxCylinder,
					width: stageWidth,
					paddingX: HORIZONTAL_PADDING,
				});
				return { cylinder, x, isSequence: true };
			});

			// Merge and remove duplicates (prefer sequence ticks for labels if they overlap perfectly)
			const merged = [...baseTicks];
			sequenceTicks.forEach((st) => {
				if (!merged.some((bt) => bt.cylinder === st.cylinder)) {
					merged.push(st);
				} else {
					// Mark existing base tick as sequence if it's in the sequence
					const existing = merged.find((bt) => bt.cylinder === st.cylinder);
					if (existing) existing.isSequence = true;
				}
			});

			return merged.sort((a, b) => a.cylinder - b.cylinder);
		}, [maxCylinder, stageWidth, showSequenceTicks, result]);

		const layers = getDiskRenderLayers();

		const handleWheel = (event: Konva.KonvaEventObject<WheelEvent>) => {
			event.evt.preventDefault();
			const stage = stageRef.current;
			const pointer = stage?.getPointerPosition();
			if (!pointer) return;
			const delta = event.evt.deltaY > 0 ? -0.1 : 0.1;
			zoom(delta, pointer.x, pointer.y);
		};

		const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
			pan(e.target.x() - viewport.offsetX, e.target.y() - viewport.offsetY);
		};

		const exportImage = (options: DiskCanvasExportOptions) => {
			const stage = stageRef.current;
			if (!stage) return;

			const mimeType = options.format === "JPEG" ? "image/jpeg" : "image/png";
			const fileName = `disk-scheduler-${Date.now()}.${options.format.toLowerCase()}`;
			const dataUrl = stage.toDataURL({
				mimeType,
				quality: options.format === "JPEG" ? options.quality : undefined,
				pixelRatio: options.scale,
			});

			const anchor = document.createElement("a");
			anchor.download = fileName;
			anchor.href = dataUrl;
			anchor.click();
		};

		useImperativeHandle(
			ref,
			() => ({
				exportImage,
				fitToScreen: () => {
					fitToScreen(pointsBounds, stageWidth, stageHeight);
				},
			}),
			[fitToScreen, pointsBounds, stageHeight, stageWidth],
		);

		useEffect(() => {
			fitToScreen(pointsBounds, stageWidth, stageHeight);
		}, [fitToScreen, markers, stageHeight, stageWidth, maxCylinder]);

		return (
			<Card className="shadow-none">
				<CardHeader className="pb-4 border-b mb-4">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<CardTitle className="text-xl font-bold">
							Disk Visualization Canvas
						</CardTitle>
						<CanvasToolbar
							onResetView={resetViewport}
							onFitToScreen={() =>
								fitToScreen(pointsBounds, stageWidth, stageHeight)
							}
							onExport={onExport}
						/>
					</div>
				</CardHeader>
				<CardContent>
					<div
						ref={containerRef}
						className="relative overflow-hidden rounded-xl border bg-slate-50/50 dark:bg-slate-950/50">
						<Stage
							ref={stageRef}
							width={stageWidth}
							height={stageHeight}
							scaleX={viewport.scale}
							scaleY={viewport.scale}
							x={viewport.offsetX}
							y={viewport.offsetY}
							draggable
							onWheel={handleWheel}
							onDragEnd={handleDragEnd}
							onMouseLeave={() => setHoveredMarker(null)}>
							{layers.includes("background-grid") && showGrid && (
								<Layer listening={false}>
									<Rect
										width={stageWidth}
										height={stageHeight}
										fill="transparent"
									/>
									{Array.from(
										{ length: Math.max(stepCount + 1, 1) },
										(_, index) => (
											<Line
												key={`row-${index}`}
												points={[
													HORIZONTAL_PADDING,
													AXIS_PADDING_Y + index * verticalSpacing,
													stageWidth - HORIZONTAL_PADDING,
													AXIS_PADDING_Y + index * verticalSpacing,
												]}
												stroke="rgba(100, 116, 139, 0.25)"
												strokeWidth={1.5}
												dash={[6, 6]}
											/>
										),
									)}
									{gridLines.map((tick) => (
										<Group key={`tick-${tick.cylinder}-${tick.isSequence}`}>
											<Line
												points={[
													tick.x,
													AXIS_PADDING_Y / 2,
													tick.x,
													stageHeight - BOTTOM_AXIS_HEIGHT - 10,
												]}
												stroke={tick.isSequence ? "rgba(59, 130, 246, 0.4)" : "rgba(100, 116, 139, 0.2)"}
												strokeWidth={tick.isSequence ? 2 : 1.2}
												dash={tick.isSequence ? [] : [4, 8]}
											/>
											{showTickLabels && (
												<Text
													x={tick.x - 25}
													y={stageHeight - BOTTOM_AXIS_HEIGHT + 4}
													width={50}
													align="center"
													text={String(tick.cylinder)}
													fontSize={tickLabelSize}
													fontStyle="bold"
													fill={tick.isSequence ? "rgba(59, 130, 246, 1)" : "rgba(71, 85, 105, 0.9)"}
												/>
											)}
										</Group>
									))}
								</Layer>
							)}

							{layers.includes("ghost-preview") && ghostEnabled && (
								<Layer listening={false}>
									{futureSegments.map((segment) =>
										segment.type === "JUMP" ? (
											<Line
												key={`ghost-jump-${segment.index}`}
												points={segment.points}
												stroke={pathColor}
												strokeWidth={strokeWidth - 1}
												lineCap="round"
												lineJoin="round"
												opacity={0.15}
												dash={JUMP_DASH}
											/>
										) : (
											<Arrow
												key={`ghost-${segment.index}`}
												points={segment.points}
												stroke={pathColor}
												fill={pathColor}
												opacity={0.15}
												dash={[10, 10]}
												strokeWidth={strokeWidth - 1}
												pointerLength={8}
												pointerWidth={8}
											/>
										),
									)}
								</Layer>
							)}

							{layers.includes("completed-path") && (
								<Layer listening={false}>
									{completedSegments.map((segment) =>
										segment.type === "JUMP" ? (
											<Line
												key={`jump-${segment.index}`}
												points={segment.points}
												stroke={pathColor}
												strokeWidth={strokeWidth}
												lineCap="round"
												lineJoin="round"
												opacity={0.8}
												dash={JUMP_DASH}
											/>
										) : (
											<Arrow
												key={`done-${segment.index}`}
												points={segment.points}
												stroke={pathColor}
												fill={pathColor}
												strokeWidth={strokeWidth}
												lineCap="round"
												lineJoin="round"
												opacity={0.8}
												pointerLength={10}
												pointerWidth={10}
											/>
										),
									)}
								</Layer>
							)}

							{layers.includes("active-segment") && activeSegment && (
								<Layer listening={false}>
									{activeSegment.type === "JUMP" ? (
										<Line
											points={interpolatedActivePoints}
											stroke={pathColor}
											strokeWidth={strokeWidth}
											lineCap="round"
											lineJoin="round"
											opacity={0.8}
											dash={JUMP_DASH}
										/>
									) : (
										<Arrow
											points={interpolatedActivePoints}
											stroke={pathColor}
											fill={pathColor}
											strokeWidth={strokeWidth}
											lineCap="round"
											lineJoin="round"
											opacity={0.8}
											pointerLength={10}
											pointerWidth={10}
										/>
									)}
								</Layer>
							)}

							{layers.includes("background-grid") && scannerModeEnabled && (
								<Layer listening={false}>
									<Line
										points={[
											scannerHeadX,
											AXIS_PADDING_Y / 2,
											scannerHeadX,
											stageHeight - BOTTOM_AXIS_HEIGHT - 10,
										]}
										stroke={pathColor}
										strokeWidth={2}
										dash={[4, 4]}
										opacity={0.6}
									/>
									<Circle
										x={scannerHeadX}
										y={AXIS_PADDING_Y / 2}
										radius={4}
										fill={pathColor}
									/>
									<Circle
										x={scannerHeadX}
										y={stageHeight - BOTTOM_AXIS_HEIGHT - 10}
										radius={4}
										fill={pathColor}
									/>
								</Layer>
							)}

							{layers.includes("marker") && (
								<Layer>
									{markers.map((marker, index) => {
										const isPassed = index <= currentStep;
										const isCurrentlyScanning = scannerModeEnabled && index === currentStep + 1;
										const opacity = isPassed ? 1 : 0.3;

										return (
											<Group key={`marker-${index}`} opacity={opacity}>
												<Circle
													x={marker.x}
													y={marker.y}
													radius={showMarkerLabels ? markerRadius : markerRadius / 3}
													fill={
														(index === currentPointIndex && highlightCurrent) || !showMarkerLabels
															? pathColor
															: "#ffffff"
													}
													stroke={pathColor}
													strokeWidth={2}
													onMouseEnter={() => setHoveredMarker(marker)}
													onMouseMove={() => setHoveredMarker(marker)}
													onMouseLeave={() => setHoveredMarker(null)}
												/>
												{showMarkerLabels && (
													<Text
														x={marker.x - markerRadius}
														y={marker.y - markerLabelSize / 2 + 1}
														width={markerRadius * 2}
														align="center"
														text={marker.label}
														fontSize={markerLabelSize}
														fontStyle="bold"
														fill={
															index === currentPointIndex && highlightCurrent
																? "#ffffff"
																: pathColor
														}
														listening={false}
													/>
												)}
											</Group>
										);
									})}
								</Layer>
							)}

							{layers.includes("active-head") && result && showHead && (
								<Layer listening={false}>
									<Group
										x={scannerHeadX + markerRadius + 10}
										y={
											AXIS_PADDING_Y + 
											Math.min(currentStep + (currentStep < data.length - 1 ? animationProgress : 0), Math.max(0, data.length - 1)) * verticalSpacing - 12
										}>
										<Rect
											width={46}
											height={24}
											fill={pathColor}
											cornerRadius={4}
											shadowColor="rgba(0,0,0,0.1)"
											shadowBlur={4}
											shadowOffset={{ x: 2, y: 2 }}
										/>
										<Text
											width={46}
											height={24}
											align="center"
											verticalAlign="middle"
											text="HEAD"
											fontSize={10}
											fontStyle="bold"
											fill="white"
										/>
									</Group>
								</Layer>
							)}
						</Stage>

						{hoveredMarker && (
							<div
								className="pointer-events-none absolute rounded-lg border bg-background/95 p-3 text-xs shadow-xl backdrop-blur-md z-50 whitespace-nowrap border-primary/10"
								style={{
									left: hoveredMarker.x * viewport.scale + viewport.offsetX,
									top:
										hoveredMarker.y * viewport.scale +
										viewport.offsetY -
										markerRadius * viewport.scale -
										12,
									transform: "translateX(-50%) translateY(-100%)",
								}}>
								<div className="flex items-center justify-between gap-4 mb-1.5">
									<p className="font-bold text-primary">
										Cylinder {hoveredMarker.cylinder}
									</p>
									<Badge
										variant="outline"
										className="text-xs px-1.5 h-4 font-mono border-primary/20 text-primary/70">
										Step {hoveredMarker.stepIndex}
									</Badge>
								</div>
								<div className="space-y-1 text-muted-foreground border-t border-primary/5 pt-1.5">
									<div className="flex justify-between gap-3">
										<span>Cumulative Distance:</span>
										<span className="font-mono font-bold text-foreground">
											{hoveredMarker.cumulativeDistance}
										</span>
									</div>
								</div>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		);
	},
);
