import {
	useEffect,
	useRef,
	useState,
	forwardRef,
	useImperativeHandle,
} from "react";
import { useGanttChart } from "@presentation/hooks/useGanttChart";
import { Button } from "@components/ui/button";
import { RotateCcw } from "lucide-react";
import type {
	GanttBlock,
	ProcessAnnotationMode,
	TimeLabelRenderMode,
} from "@domain/types/cpu-scheduling";
import { cn } from "@/lib/utils";

interface GanttChartProps {
	blocks: GanttBlock[];
	colorful?: boolean;
	darkMode?: boolean;
	processAnnotationMode?: ProcessAnnotationMode;
	timeLabelRenderMode?: TimeLabelRenderMode;
	allowProcessNameInBlock?: boolean;
	showQueueAnnotation?: boolean;
}

export interface GanttChartRef {
	exportToPNG: (filename?: string) => void;
}

export const GanttChart = forwardRef<GanttChartRef, GanttChartProps>(
	(
		{
			blocks,
			colorful = true,
			darkMode = false,
			processAnnotationMode = "POINTER_LEVELING",
			timeLabelRenderMode = "LINE_LEVELING",
			allowProcessNameInBlock = true,
			showQueueAnnotation = false,
		},
		ref,
	) => {
		const { canvasRef, render, exportToPNG } = useGanttChart();
		const viewportRef = useRef<HTMLDivElement>(null);
		const dragStartRef = useRef<{
			x: number;
			y: number;
			panX: number;
			panY: number;
		} | null>(null);
		const [zoom, setZoom] = useState(1);
		const [pan, setPan] = useState({ x: 0, y: 0 });
		const [isDragging, setIsDragging] = useState(false);

		const clampZoom = (value: number) => Math.min(4, Math.max(0.35, value));

		const handleResetView = () => {
			setZoom(1);
			setPan({ x: 0, y: 0 });
		};

		// Expose export function to parent
		useImperativeHandle(ref, () => ({
			exportToPNG,
		}));

		// Render whenever blocks, colorful, or darkMode changes
		useEffect(() => {
			if (blocks.length > 0) {
				render(
					blocks,
					colorful,
					darkMode,
					processAnnotationMode,
					timeLabelRenderMode,
					allowProcessNameInBlock,
					showQueueAnnotation,
				);
			} else {
				render(
					[],
					colorful,
					darkMode,
					processAnnotationMode,
					timeLabelRenderMode,
					allowProcessNameInBlock,
					showQueueAnnotation,
				);
			}
		}, [
			blocks,
			colorful,
			darkMode,
			processAnnotationMode,
			timeLabelRenderMode,
			allowProcessNameInBlock,
			showQueueAnnotation,
			render,
		]);

		useEffect(() => {
			setZoom(1);
			setPan({ x: 0, y: 0 });
			setIsDragging(false);
			dragStartRef.current = null;
		}, [blocks]);

		useEffect(() => {
			const viewport = viewportRef.current;
			if (!viewport) return;

			const handleWheel = (event: WheelEvent) => {
				event.preventDefault();
				event.stopPropagation();

				const rect = viewport.getBoundingClientRect();
				const pointerX = event.clientX - rect.left;
				const pointerY = event.clientY - rect.top;

				const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
				const nextZoom = clampZoom(zoom * zoomFactor);
				if (nextZoom === zoom) return;

				const contentX = (pointerX - pan.x) / zoom;
				const contentY = (pointerY - pan.y) / zoom;

				setZoom(nextZoom);
				setPan({
					x: pointerX - contentX * nextZoom,
					y: pointerY - contentY * nextZoom,
				});
			};

			viewport.addEventListener("wheel", handleWheel, { passive: false });
			return () => {
				viewport.removeEventListener("wheel", handleWheel);
			};
		}, [zoom, pan, clampZoom]);

		const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (
			event,
		) => {
			if (event.button !== 0) return;
			event.currentTarget.setPointerCapture(event.pointerId);
			dragStartRef.current = {
				x: event.clientX,
				y: event.clientY,
				panX: pan.x,
				panY: pan.y,
			};
			setIsDragging(true);
		};

		const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (
			event,
		) => {
			if (!dragStartRef.current) return;

			const deltaX = event.clientX - dragStartRef.current.x;
			const deltaY = event.clientY - dragStartRef.current.y;

			setPan({
				x: dragStartRef.current.panX + deltaX,
				y: dragStartRef.current.panY + deltaY,
			});
		};

		const handlePointerUp: React.PointerEventHandler<HTMLDivElement> = (
			event,
		) => {
			if (event.currentTarget.hasPointerCapture(event.pointerId)) {
				event.currentTarget.releasePointerCapture(event.pointerId);
			}
			dragStartRef.current = null;
			setIsDragging(false);
		};

		return (
			<div className="relative group">
				<div className="absolute top-2 right-2 z-10  opacity-0 group-hover:opacity-100 transition-opacity">
					<Button
						onClick={handleResetView}
						variant="outline"
						size="icon"
						className={cn("rounded-full",
							{
								"text-white hover:bg-gray-600 hover:text-white!": darkMode,
								"text-gray-800 hover:text-black": !darkMode
							}
						)}
						title="Reset zoom and pan (double-click also resets)">
						<RotateCcw className="size-4" />
					</Button>
				</div>
				<div
					ref={viewportRef}
					className="w-full overflow-hidden rounded-lg touch-none relative"
					onPointerDown={handlePointerDown}
					onPointerMove={handlePointerMove}
					onPointerUp={handlePointerUp}
					onPointerCancel={handlePointerUp}
					onDoubleClick={() => {
						handleResetView();
					}}
					style={{ cursor: isDragging ? "grabbing" : "grab" }}>
					<canvas
						ref={canvasRef}
						className="block rounded-lg w-full h-auto select-none"
						style={{
							backgroundColor: "transparent",
							transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
							transformOrigin: "0 0",
						}}
					/>
				</div>
			</div>
		);
	},
);

GanttChart.displayName = "GanttChart";
