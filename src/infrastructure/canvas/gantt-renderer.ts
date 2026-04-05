import type {
	GanttBlock,
	GanttCanvasConfig,
	ProcessAnnotationMode,
	TimeLabelRenderMode,
} from "@domain/types/cpu-scheduling";
import { darkenColor } from "./color-generator";

type GanttRenderOptions = {
	colorful: boolean;
	darkMode: boolean;
	processAnnotationMode: ProcessAnnotationMode;
	timeLabelRenderMode: TimeLabelRenderMode;
	showQueueAnnotation: boolean;
};

/**
 * Gantt Chart Canvas Renderer
 * Features:
 * - Transparent background (no background painting)
 * - Colorful or monochrome mode
 * - Dark/light mode support for canvas colors
 * - Context switching time display under dividers
 * - Fit width with canvas
 * - Dynamic height export support (1920px width)
 */
export class GanttChartRenderer {
	private static readonly TIME_LABEL_MIN_SPACING = 40;
	private static readonly TIME_LABEL_LEVEL_SPACING = 18;
	private static readonly POINTER_LEVEL_SPACING = 20;
	private static readonly LEGEND_ITEM_WIDTH = 60;
	private static readonly LEGEND_ROW_HEIGHT = 14;

	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private config: GanttCanvasConfig;
	private lastBlocks: GanttBlock[] = [];
	private lastRenderOptions: GanttRenderOptions = {
		colorful: true,
		darkMode: false,
		processAnnotationMode: "POINTER_LEVELING",
		timeLabelRenderMode: "LINE_LEVELING",
		showQueueAnnotation: false,
	};

	private getBlockKey(block: GanttBlock): string {
		return `${block.processId}+${block.startTime}`;
	}

	private getBlockSpan(block: GanttBlock): number {
		const span = block.endTime - block.startTime;

		if (Number.isFinite(span) && span > 0) {
			return span;
		}

		return Math.max(0, block.duration);
	}

	private getTimelineBounds(blocks: GanttBlock[]): {
		minStartTime: number;
		maxEndTime: number;
	} {
		if (blocks.length === 0) {
			return { minStartTime: 0, maxEndTime: 0 };
		}

		let minStartTime = Number.POSITIVE_INFINITY;
		let maxEndTime = Number.NEGATIVE_INFINITY;

		for (const block of blocks) {
			minStartTime = Math.min(minStartTime, block.startTime);
			maxEndTime = Math.max(maxEndTime, block.endTime);
		}

		if (!Number.isFinite(minStartTime) || !Number.isFinite(maxEndTime)) {
			return { minStartTime: 0, maxEndTime: 0 };
		}

		return { minStartTime, maxEndTime };
	}

	private prepareRenderableBlocks(blocks: GanttBlock[]): GanttBlock[] {
		if (blocks.length === 0) return [];

		return blocks.map((block) => {
			const durationFromField = block.duration;
			const durationFromTimes = block.endTime - block.startTime;

			const hasFieldDuration =
				Number.isFinite(durationFromField) && durationFromField > 0;
			const hasTimesDuration =
				Number.isFinite(durationFromTimes) && durationFromTimes > 0;
			const resolvedDuration = hasFieldDuration
				? durationFromField
				: hasTimesDuration
					? durationFromTimes
					: 0;

			const resolvedStart = Number.isFinite(block.startTime)
				? block.startTime
				: 0;
			const fallbackEnd = resolvedStart + resolvedDuration;
			const resolvedEnd =
				Number.isFinite(block.endTime) && block.endTime >= resolvedStart
					? block.endTime
					: fallbackEnd;

			return {
				...block,
				startTime: resolvedStart,
				endTime: resolvedEnd,
				duration: Math.max(0, resolvedEnd - resolvedStart),
			};
		});
	}

	private estimateProcessTextWidth(name: string, fontSize: number): number {
		return name.length * fontSize * 0.62 + 10;
	}

	private canRenderProcessNameInside(
		width: number,
		name: string,
		fontSize: number,
	): boolean {
		if (!this.config.allowProcessNameInBlock) return false;
		return this.estimateProcessTextWidth(name, fontSize) <= width;
	}

	private buildTimeLabelPositions(
		blocks: GanttBlock[],
		startX: number,
		timeScale: number,
		timelineStartTime?: number,
	): number[] {
		const positions: number[] = [startX];
		const { minStartTime } = this.getTimelineBounds(blocks);
		const baseStartTime = timelineStartTime ?? minStartTime;

		for (const block of blocks) {
			const endOffset = Math.max(0, block.endTime - baseStartTime);
			positions.push(startX + endOffset * timeScale);
		}

		return positions;
	}

	private buildTimeLabelLayout(
		positions: number[],
		mode: TimeLabelRenderMode,
	): {
		levels: number[];
		visible: boolean[];
		maxLevel: number;
		fontScales: number[];
	} {
		if (mode === "MAJOR_ONLY") {
			const levels = positions.map(() => 0);
			const visible = positions.map(() => false);
			const fontScales = positions.map(() => 1);
			let lastVisibleX = -Infinity;

			for (let i = 0; i < positions.length; i++) {
				if (
					i === 0 ||
					Math.abs(positions[i] - lastVisibleX) >=
						GanttChartRenderer.TIME_LABEL_MIN_SPACING
				) {
					visible[i] = true;
					lastVisibleX = positions[i];
				}
			}

			// Always ensure the last label is shown
			if (positions.length > 1) {
				visible[positions.length - 1] = true;
			}

			return { levels, visible, maxLevel: 0, fontScales };
		}

		if (mode === "FORCE_SHRINK") {
			const levels = positions.map(() => 0);
			const visible = positions.map(() => true);
			const fontScales = positions.map((position, index) => {
				let nearestDistance = Infinity;

				if (index > 0) {
					nearestDistance = Math.min(
						nearestDistance,
						Math.abs(position - positions[index - 1]),
					);
				}

				if (index < positions.length - 1) {
					nearestDistance = Math.min(
						nearestDistance,
						Math.abs(positions[index + 1] - position),
					);
				}

				if (!Number.isFinite(nearestDistance)) {
					return 1;
				}

				const rawScale =
					nearestDistance / GanttChartRenderer.TIME_LABEL_MIN_SPACING;
				return Math.max(0.55, Math.min(1, rawScale));
			});

			return { levels, visible, maxLevel: 0, fontScales };
		}

		const levels: number[] = [];
		const visible = positions.map(() => true);
		let maxLevel = 0;

		for (let i = 0; i < positions.length; i++) {
			const currentX = positions[i];
			let level = 0;

			while (true) {
				const collides = levels.some((assignedLevel, j) => {
					if (assignedLevel !== level) return false;
					return (
						Math.abs(currentX - positions[j]) <
						GanttChartRenderer.TIME_LABEL_MIN_SPACING
					);
				});

				if (!collides) break;
				level += 1;
			}

			levels.push(level);
			maxLevel = Math.max(maxLevel, level);
		}

		const fontScales = positions.map(() => 1);
		return { levels, visible, maxLevel, fontScales };
	}

	private tightenTimeLabelFontScalesForExport(
		positions: number[],
		labels: Array<string>,
		layout: { levels: number[]; visible: boolean[]; maxLevel: number; fontScales: number[] },
		fontSize: number,
	): number[] {
		const nextScales = [...layout.fontScales];

		for (let i = 0; i < positions.length; i++) {
			if (!layout.visible[i]) continue;

			let nearestDistance = Number.POSITIVE_INFINITY;
			for (let j = 0; j < positions.length; j++) {
				if (i === j || !layout.visible[j]) continue;
				nearestDistance = Math.min(nearestDistance, Math.abs(positions[i] - positions[j]));
			}

			if (!Number.isFinite(nearestDistance)) {
				nextScales[i] = Math.min(nextScales[i] ?? 1, 1);
				continue;
			}

			const estimatedBaseWidth = labels[i].length * fontSize * 0.52 + 8;
			const shrinkByDistance = nearestDistance / Math.max(estimatedBaseWidth, 1);
			const clamped = Math.max(0.5, Math.min(1, shrinkByDistance));
			nextScales[i] = Math.min(nextScales[i] ?? 1, clamped);
		}

		return nextScales;
	}
	private getEffectiveProcessAnnotationMode(): ProcessAnnotationMode {
		if (
			!this.config.colorful &&
			this.lastRenderOptions.processAnnotationMode === "LEGEND"
		) {
			return "POINTER_LEVELING";
		}

		return this.lastRenderOptions.processAnnotationMode;
	}

	private getQueueAnnotationSpace(isMultiQueue: boolean): number {
		if (!isMultiQueue || !this.lastRenderOptions.showQueueAnnotation) {
			return 0;
		}

		const mode = this.getEffectiveProcessAnnotationMode();
		if (mode === "LEGEND" || mode === "HIDDEN") {
			return 46;
		}

		return 58;
	}

	private buildAnnotationBlocks(
		blocks: GanttBlock[],
		timeScale: number,
		fontSize: number,
	): Set<string> {
		const annotationBlocks = new Set<string>();

		for (const block of blocks) {
			const width = this.getBlockSpan(block) * timeScale;
			const canFitInside = this.canRenderProcessNameInside(
				width,
				block.processName,
				fontSize,
			);
			if (!canFitInside) {
				annotationBlocks.add(this.getBlockKey(block));
			}
		}

		return annotationBlocks;
	}

	private buildPointerLevels(
		blocks: GanttBlock[],
		annotationBlockKeys: Set<string>,
		startX: number,
		timeScale: number,
		timelineStartTime?: number,
	): { levels: Map<string, number>; maxLevel: number } {
		const levels = new Map<string, number>();
		const info: Array<{
			key: string;
			centerX: number;
			labelWidth: number;
			processId: string;
		}> = [];
		const { minStartTime } = this.getTimelineBounds(blocks);
		const baseStartTime = timelineStartTime ?? minStartTime;

		for (const block of blocks) {
			const width = this.getBlockSpan(block) * timeScale;
			const x =
				startX + Math.max(0, block.startTime - baseStartTime) * timeScale;
			const key = this.getBlockKey(block);
			if (annotationBlockKeys.has(key)) {
				info.push({
					key,
					centerX: x + width / 2,
					labelWidth: Math.min(
						Math.max(
							this.estimateProcessTextWidth(
								block.processName,
								this.config.fontSize * 0.5,
							),
							16,
						),
						120,
					),
					processId: block.processId,
				});
			}
		}

		let maxLevel = 0;
		const seenProcess = new Set<string>();

		for (let i = 0; i < info.length; i++) {
			const current = info[i];

			if (
				this.lastRenderOptions.processAnnotationMode === "POINTER_FIRST_ONLY"
			) {
				if (seenProcess.has(current.processId)) {
					levels.set(current.key, -1);
					continue;
				}
				seenProcess.add(current.processId);
			}

			let level = 0;
			for (let j = i - 1; j >= 0; j--) {
				const prev = info[j];
				const prevLevel = levels.get(prev.key);
				if (prevLevel === undefined || prevLevel < 0) continue;

				const minHorizontalDistance =
					(current.labelWidth + prev.labelWidth) / 2 + 12;
				if (Math.abs(current.centerX - prev.centerX) < minHorizontalDistance) {
					level = Math.max(level, prevLevel + 1);
				}
			}

			levels.set(current.key, level);
			maxLevel = Math.max(maxLevel, level);
		}

		return { levels, maxLevel };
	}

	private renderLegend(
		ctx: CanvasRenderingContext2D,
		blocks: GanttBlock[],
		annotationBlockKeys: Set<string>,
		startX: number,
		topY: number,
		availableWidth: number,
		fontSize: number,
		legendBoxSize: number = 10,
		itemWidth: number = GanttChartRenderer.LEGEND_ITEM_WIDTH,
	) {
		const seen = new Set<string>();
		const items: Array<{ name: string; color: string }> = [];
		const includeAllProcesses = this.getEffectiveProcessAnnotationMode() === "LEGEND";

		for (const block of blocks) {
			const key = this.getBlockKey(block);
			if (!includeAllProcesses && !annotationBlockKeys.has(key)) continue;
			if (seen.has(block.processId)) continue;
			seen.add(block.processId);
			items.push({ name: block.processName, color: block.color });
		}

		if (items.length === 0) return;

		const rowHeight = GanttChartRenderer.LEGEND_ROW_HEIGHT;
		const columns = Math.max(1, Math.floor(availableWidth / itemWidth));

		ctx.save();
		ctx.font = `500 ${Math.round(fontSize * 0.5)}px ${this.config.fontFamily}`;
		ctx.textAlign = "left";
		ctx.textBaseline = "middle";
		const labelOffsetX = legendBoxSize + 4;
		const labelCenterY = Math.round(legendBoxSize / 2);

		for (let i = 0; i < items.length; i++) {
			const row = Math.floor(i / columns);
			const col = i % columns;
			const x = startX + col * itemWidth;
			const y = topY + row * rowHeight;

			ctx.fillStyle = this.config.colorful
				? this.config.darkMode
					? darkenColor(items[i].color, 0.35)
					: items[i].color
				: "transparent";
			ctx.strokeStyle = this.config.darkMode ? "#ffffff" : "#111111";
			ctx.lineWidth = 1;
			ctx.fillRect(x, y, legendBoxSize, legendBoxSize);
			ctx.strokeRect(x, y, legendBoxSize, legendBoxSize);

			ctx.fillStyle = this.config.darkMode ? "#ffffff" : "#111111";
			ctx.fillText(items[i].name, x + labelOffsetX, y + labelCenterY);
		}

		ctx.restore();
	}

	constructor(
		canvas: HTMLCanvasElement,
		config: Partial<GanttCanvasConfig> = {},
	) {
		this.canvas = canvas;
		const context = canvas.getContext("2d");
		if (!context) {
			throw new Error("Failed to get 2D context from canvas");
		}
		this.ctx = context;

		// Default configuration
		this.config = {
			width: config.width ?? 800,
			blockHeight: config.blockHeight ?? 50,
			lineSpacing: config.lineSpacing ?? 40,
			fontSize: config.fontSize ?? 14,
			fontFamily: config.fontFamily ?? "Inter, system-ui, sans-serif",
			showTimeLabels: config.showTimeLabels ?? true,
			showProcessNames: config.showProcessNames ?? true,
			allowProcessNameInBlock: config.allowProcessNameInBlock ?? true,
			borderWidth: config.borderWidth ?? 2,
			borderColor: config.borderColor ?? "#000000",
			colorful: config.colorful ?? true,
			darkMode: config.darkMode ?? false,
		};
	}

	/**
	 * Calculate dynamic time scale to fit all blocks within canvas width
	 */
	private calculateTimeScale(
		blocks: GanttBlock[],
		availableWidth: number,
		minScale: number = 0,
	): number {
		if (blocks.length === 0) return 10;

		const { minStartTime, maxEndTime } = this.getTimelineBounds(blocks);
		const totalDuration = Math.max(0, maxEndTime - minStartTime);
		if (totalDuration === 0) return 10;

		// Calculate time scale to fit within available width
		const timeScale = availableWidth / totalDuration;

		// Clamp only when explicitly requested by caller.
		return Math.max(minScale, timeScale);
	}

	/**
	 * Check if blocks are in multi-queue mode (have queueId)
	 */
	private isMultiQueueMode(blocks: GanttBlock[]): boolean {
		return (
			blocks.length > 0 && blocks.some((block) => block.queueId !== undefined)
		);
	}

	/**
	 * Group blocks by queue and return queue boundaries
	 */
	private groupBlocksByQueue(
		blocks: GanttBlock[],
	): Array<{
		queueId: string;
		startIndex: number;
		endIndex: number;
		blockCount: number;
	}> {
		const queues: Array<{
			queueId: string;
			startIndex: number;
			endIndex: number;
			blockCount: number;
		}> = [];
		let currentQueueId: string | undefined = undefined;
		let startIndex = 0;

		for (let i = 0; i < blocks.length; i++) {
			const block = blocks[i];
			const blockQueueId = block.queueId || "default";

			if (blockQueueId !== currentQueueId) {
				// Save previous queue if it exists
				if (currentQueueId !== undefined && startIndex < i) {
					queues.push({
						queueId: currentQueueId,
						startIndex,
						endIndex: i - 1,
						blockCount: i - startIndex,
					});
				}
				currentQueueId = blockQueueId;
				startIndex = i;
			}
		}

		// Save last queue
		if (currentQueueId !== undefined && startIndex < blocks.length) {
			queues.push({
				queueId: currentQueueId,
				startIndex,
				endIndex: blocks.length - 1,
				blockCount: blocks.length - startIndex,
			});
		}

		return queues;
	}

	// private groupBlocksForSeparatedMode(
	// 	blocks: GanttBlock[],
	// ): Array<{ queueId: string; blocks: GanttBlock[] }> {
	// 	const groups = new Map<string, GanttBlock[]>();
	// 	const order: string[] = [];

	// 	for (const block of blocks) {
	// 		const queueId = block.queueId || "default";
	// 		if (!groups.has(queueId)) {
	// 			groups.set(queueId, []);
	// 			order.push(queueId);
	// 		}
	// 		groups.get(queueId)?.push(block);
	// 	}

	// 	return order.map((queueId) => ({
	// 		queueId,
	// 		blocks: [...(groups.get(queueId) || [])].sort((a, b) => {
	// 			if (a.startTime !== b.startTime) return a.startTime - b.startTime;
	// 			return a.endTime - b.endTime;
	// 		}),
	// 	}));
	// }

	// private renderQueueBraceForRow(
	// 	ctx: CanvasRenderingContext2D,
	// 	queueIndex: number,
	// 	queueBlocks: GanttBlock[],
	// 	startX: number,
	// 	chartY: number,
	// 	timeScale: number,
	// 	timelineStartTime: number,
	// ) {
	// 	if (queueBlocks.length === 0) return;

	// 	let queueStartTime = Number.POSITIVE_INFINITY;
	// 	let queueEndTime = Number.NEGATIVE_INFINITY;

	// 	for (const block of queueBlocks) {
	// 		queueStartTime = Math.min(queueStartTime, block.startTime);
	// 		queueEndTime = Math.max(queueEndTime, block.endTime);
	// 	}

	// 	if (!Number.isFinite(queueStartTime) || !Number.isFinite(queueEndTime))
	// 		return;

	// 	const queueStartX =
	// 		startX + Math.max(0, queueStartTime - timelineStartTime) * timeScale;
	// 	const queueEndX =
	// 		startX + Math.max(0, queueEndTime - timelineStartTime) * timeScale;
	// 	const labelX = (queueStartX + queueEndX) / 2;

	// 	const braceBaseY = chartY - 16;
	// 	const braceUpperY = braceBaseY - 10;
	// 	const braceNotchY = braceUpperY - 7;
	// 	const notchHalfWidth = Math.max(5, (queueEndX - queueStartX) * 0.06);
	// 	const labelY = braceNotchY - 10;

	// 	ctx.save();
	// 	ctx.font = `600 ${Math.round(this.config.fontSize * 0.52)}px ${this.config.fontFamily}`;
	// 	ctx.textAlign = "center";
	// 	ctx.textBaseline = "middle";
	// 	ctx.fillStyle = this.config.darkMode ? "#ffffff" : "#555555";
	// 	ctx.strokeStyle = this.config.darkMode ? "#a3a3a3" : "#7a7a7a";
	// 	ctx.lineWidth = 1.5;

	// 	ctx.beginPath();
	// 	ctx.moveTo(queueStartX, braceBaseY);
	// 	ctx.lineTo(queueStartX, braceUpperY);
	// 	ctx.lineTo(labelX - notchHalfWidth, braceUpperY);
	// 	ctx.lineTo(labelX - notchHalfWidth, braceNotchY);
	// 	ctx.lineTo(labelX + notchHalfWidth, braceNotchY);
	// 	ctx.lineTo(labelX + notchHalfWidth, braceUpperY);
	// 	ctx.lineTo(queueEndX, braceUpperY);
	// 	ctx.lineTo(queueEndX, braceBaseY);
	// 	ctx.stroke();

	// 	ctx.fillText(`Q${queueIndex + 1}`, labelX, labelY);
	// 	ctx.restore();
	// }

	// private renderMergedMultiQueueRows(preparedBlocks: GanttBlock[]) {
	// 	const queueRows = this.groupBlocksForSeparatedMode(preparedBlocks);
	// 	if (queueRows.length === 0) {
	// 		this.renderEmpty();
	// 		return;
	// 	}

	// 	const paddingLeft = 74;
	// 	const paddingRight = 30;
	// 	const availableWidth = this.config.width - paddingLeft - paddingRight;
	// 	const globalBounds = this.getTimelineBounds(preparedBlocks);
	// 	const globalTimeScale = this.calculateTimeScale(
	// 		preparedBlocks,
	// 		availableWidth,
	// 		0,
	// 	);

	// 	type RowPlan = {
	// 		queueIndex: number;
	// 		queueLabel: string;
	// 		blocks: GanttBlock[];
	// 		annotationBlockKeys: Set<string>;
	// 		pointerLevels: Map<string, number>;
	// 		timeLabelLayout: {
	// 			levels: number[];
	// 			visible: boolean[];
	// 			maxLevel: number;
	// 			fontScales: number[];
	// 		};
	// 		annotationTopSpace: number;
	// 		legendRows: number;
	// 		rowHeight: number;
	// 	};

	// 	const rowPlans: RowPlan[] = queueRows.map((row, queueIndex) => {
	// 		const annotationBlockKeys = this.buildAnnotationBlocks(
	// 			row.blocks,
	// 			globalTimeScale,
	// 			this.config.fontSize,
	// 		);
	// 		const timeLabelPositions = this.buildTimeLabelPositions(
	// 			row.blocks,
	// 			paddingLeft,
	// 			globalTimeScale,
	// 			globalBounds.minStartTime,
	// 		);
	// 		const timeLabelLayout = this.buildTimeLabelLayout(
	// 			timeLabelPositions,
	// 			this.lastRenderOptions.timeLabelRenderMode,
	// 		);

	// 		const pointerLayout =
	// 			this.getEffectiveProcessAnnotationMode() === "POINTER_LEVELING" ||
	// 			this.getEffectiveProcessAnnotationMode() === "POINTER_FIRST_ONLY"
	// 				? this.buildPointerLevels(
	// 						row.blocks,
	// 						annotationBlockKeys,
	// 						paddingLeft,
	// 						globalTimeScale,
	// 						globalBounds.minStartTime,
	// 					)
	// 				: { levels: new Map<string, number>(), maxLevel: 0 };

	// 		const legendRows =
	// 			this.getEffectiveProcessAnnotationMode() === "LEGEND"
	// 				? Math.ceil(
	// 						new Set(
	// 							row.blocks
	// 								.filter((block) =>
	// 									annotationBlockKeys.has(this.getBlockKey(block)),
	// 								)
	// 								.map((block) => block.processId),
	// 						).size /
	// 							Math.max(
	// 								1,
	// 								Math.floor(
	// 									availableWidth / GanttChartRenderer.LEGEND_ITEM_WIDTH,
	// 								),
	// 							),
	// 					)
	// 				: 0;

	// 		const annotationTopSpace =
	// 			this.getEffectiveProcessAnnotationMode() === "LEGEND"
	// 				? legendRows > 0
	// 					? legendRows * GanttChartRenderer.LEGEND_ROW_HEIGHT + 10
	// 					: 0
	// 				: pointerLayout.maxLevel >= 0 &&
	// 					  annotationBlockKeys.size > 0 &&
	// 					  this.getEffectiveProcessAnnotationMode() !== "HIDDEN"
	// 					? 30 +
	// 						pointerLayout.maxLevel * GanttChartRenderer.POINTER_LEVEL_SPACING
	// 					: 0;

	// 		const braceSpace = 34;
	// 		const rowGap = 16;
	// 		const rowHeight =
	// 			annotationTopSpace +
	// 			braceSpace +
	// 			24 +
	// 			this.config.blockHeight +
	// 			this.config.lineSpacing +
	// 			60 +
	// 			timeLabelLayout.maxLevel * GanttChartRenderer.TIME_LABEL_LEVEL_SPACING +
	// 			rowGap;

	// 		return {
	// 			queueIndex,
	// 			queueLabel: `Q${queueIndex + 1}`,
	// 			blocks: row.blocks,
	// 			annotationBlockKeys,
	// 			pointerLevels: pointerLayout.levels,
	// 			timeLabelLayout,
	// 			annotationTopSpace,
	// 			legendRows,
	// 			rowHeight,
	// 		};
	// 	});

	// 	const totalHeight = rowPlans.reduce((sum, row) => sum + row.rowHeight, 14);

	// 	this.canvas.width = this.config.width;
	// 	this.canvas.height = totalHeight;
	// 	this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

	// 	let rowOffsetY = 8;
	// 	for (const row of rowPlans) {
	// 		const chartY = rowOffsetY + row.annotationTopSpace + 34 + 24;

	// 		if (
	// 			this.getEffectiveProcessAnnotationMode() === "LEGEND" &&
	// 			row.legendRows > 0
	// 		) {
	// 			this.renderLegend(
	// 				this.ctx,
	// 				row.blocks,
	// 				row.annotationBlockKeys,
	// 				paddingLeft,
	// 				rowOffsetY + 36,
	// 				availableWidth,
	// 				this.config.fontSize,
	// 			);
	// 		}

	// 		this.ctx.save();
	// 		this.ctx.fillStyle = this.config.darkMode ? "#ffffff" : "#555555";
	// 		this.ctx.font = `600 ${Math.round(this.config.fontSize * 0.55)}px ${this.config.fontFamily}`;
	// 		this.ctx.textAlign = "left";
	// 		this.ctx.textBaseline = "middle";
	// 		this.ctx.fillText(
	// 			row.queueLabel,
	// 			12,
	// 			chartY + this.config.blockHeight / 2,
	// 		);
	// 		this.ctx.restore();

	// 		this.renderQueueBraceForRow(
	// 			this.ctx,
	// 			row.queueIndex,
	// 			row.blocks,
	// 			paddingLeft,
	// 			chartY,
	// 			globalTimeScale,
	// 			globalBounds.minStartTime,
	// 		);

	// 		this.renderBlocks(
	// 			this.ctx,
	// 			row.blocks,
	// 			paddingLeft,
	// 			chartY,
	// 			globalTimeScale,
	// 			this.config.blockHeight,
	// 			this.config.fontSize,
	// 			row.annotationBlockKeys,
	// 			row.pointerLevels,
	// 			row.timeLabelLayout,
	// 			globalBounds.minStartTime,
	// 		);

	// 		rowOffsetY += row.rowHeight;
	// 	}
	// }

	/**
	 * Render queue separators and labels for multi-queue mode
	 */
	private renderQueueMarkers(
		ctx: CanvasRenderingContext2D,
		blocks: GanttBlock[],
		queueGroups: Array<{
			queueId: string;
			startIndex: number;
			endIndex: number;
		}>,
		startX: number,
		annotationBaseY: number,
		timeScale: number,
		fontSize: number,
	) {
		const { minStartTime } = this.getTimelineBounds(blocks);
		const queueLabelFontSize = Math.max(12, Math.round(fontSize || this.config.fontSize * 0.62));

		ctx.save();
		ctx.font = `700 ${queueLabelFontSize}px ${this.config.fontFamily}`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillStyle = this.config.darkMode ? "#ffffff" : "#555555";
		ctx.strokeStyle = this.config.darkMode ? "#a3a3a3" : "#7a7a7a";
		ctx.lineWidth = 1.5;

		// Draw rotated [ style upper brackets and centered queue labels across queue spans.
		for (let i = 0; i < queueGroups.length; i++) {
			const queue = queueGroups[i];
			const startBlock = blocks[queue.startIndex];
			const endBlock = blocks[queue.endIndex];
			const queueStartX =
				startX + Math.max(0, startBlock.startTime - minStartTime) * timeScale;
			const queueEndX =
				startX + Math.max(0, endBlock.endTime - minStartTime) * timeScale;
			const labelX = (queueStartX + queueEndX) / 2;
			const braceBottomY = annotationBaseY;
			const braceTopY = braceBottomY - 16;
			const labelLineGap = 24;
			const minVisibleLabelY = Math.ceil(queueLabelFontSize * 0.6) + 4;
			const labelY = Math.max(braceTopY - labelLineGap, minVisibleLabelY);

			ctx.beginPath();
			ctx.moveTo(queueStartX, braceBottomY);
			ctx.lineTo(queueStartX, braceTopY);
			ctx.lineTo(queueEndX, braceTopY);
			ctx.lineTo(queueEndX, braceBottomY);
			ctx.stroke();

			ctx.fillText(`Q${i + 1}`, labelX, labelY);
		}

		ctx.restore();
	}

	// private renderSeparatedMode(preparedBlocks: GanttBlock[]) {
	// 	const queueRows = this.groupBlocksForSeparatedMode(preparedBlocks);
	// 	if (queueRows.length === 0) {
	// 		this.renderEmpty();
	// 		return;
	// 	}

	// 	const paddingLeft = 74;
	// 	const paddingRight = 30;
	// 	const availableWidth = this.config.width - paddingLeft - paddingRight;
	// 	const globalBounds = this.getTimelineBounds(preparedBlocks);
	// 	const globalTimeScale = this.calculateTimeScale(
	// 		preparedBlocks,
	// 		availableWidth,
	// 		0,
	// 	);

	// 	type RowPlan = {
	// 		queueIndex: number;
	// 		queueLabel: string;
	// 		blocks: GanttBlock[];
	// 		timeScale: number;
	// 		timelineStartTime: number;
	// 		annotationBlockKeys: Set<string>;
	// 		pointerLevels: Map<string, number>;
	// 		timeLabelLayout: {
	// 			levels: number[];
	// 			visible: boolean[];
	// 			maxLevel: number;
	// 			fontScales: number[];
	// 		};
	// 		annotationTopSpace: number;
	// 		legendRows: number;
	// 		rowHeight: number;
	// 	};

	// 	const rowPlans: RowPlan[] = queueRows.map((row, queueIndex) => {
	// 		const rowBounds = this.getTimelineBounds(row.blocks);
	// 		const isKeepRatio = true;
	// 		const timelineStartTime = isKeepRatio
	// 			? globalBounds.minStartTime
	// 			: rowBounds.minStartTime;
	// 		const timeScale = isKeepRatio
	// 			? globalTimeScale
	// 			: this.calculateTimeScale(row.blocks, availableWidth, 0);

	// 		const annotationBlockKeys = this.buildAnnotationBlocks(
	// 			row.blocks,
	// 			timeScale,
	// 			this.config.fontSize,
	// 		);
	// 		const timeLabelPositions = this.buildTimeLabelPositions(
	// 			row.blocks,
	// 			paddingLeft,
	// 			timeScale,
	// 			timelineStartTime,
	// 		);
	// 		const timeLabelLayout = this.buildTimeLabelLayout(
	// 			timeLabelPositions,
	// 			this.lastRenderOptions.timeLabelRenderMode,
	// 		);
	// 		const pointerLayout =
	// 			this.getEffectiveProcessAnnotationMode() === "POINTER_LEVELING" ||
	// 			this.getEffectiveProcessAnnotationMode() === "POINTER_FIRST_ONLY"
	// 				? this.buildPointerLevels(
	// 						row.blocks,
	// 						annotationBlockKeys,
	// 						paddingLeft,
	// 						timeScale,
	// 						timelineStartTime,
	// 					)
	// 				: { levels: new Map<string, number>(), maxLevel: 0 };

	// 		const legendRows =
	// 			this.getEffectiveProcessAnnotationMode() === "LEGEND"
	// 				? Math.ceil(
	// 						new Set(
	// 							row.blocks
	// 								.filter((block) =>
	// 									annotationBlockKeys.has(this.getBlockKey(block)),
	// 								)
	// 								.map((block) => block.processId),
	// 						).size /
	// 							Math.max(
	// 								1,
	// 								Math.floor(
	// 									availableWidth / GanttChartRenderer.LEGEND_ITEM_WIDTH,
	// 								),
	// 							),
	// 					)
	// 				: 0;

	// 		const annotationTopSpace =
	// 			this.getEffectiveProcessAnnotationMode() === "LEGEND"
	// 				? legendRows > 0
	// 					? legendRows * GanttChartRenderer.LEGEND_ROW_HEIGHT + 10
	// 					: 0
	// 				: pointerLayout.maxLevel >= 0 &&
	// 					  annotationBlockKeys.size > 0 &&
	// 					  this.getEffectiveProcessAnnotationMode() !== "HIDDEN"
	// 					? 30 +
	// 						pointerLayout.maxLevel * GanttChartRenderer.POINTER_LEVEL_SPACING
	// 					: 0;

	// 		const rowHeight =
	// 			annotationTopSpace +
	// 			24 +
	// 			this.config.blockHeight +
	// 			this.config.lineSpacing +
	// 			60 +
	// 			timeLabelLayout.maxLevel * GanttChartRenderer.TIME_LABEL_LEVEL_SPACING;

	// 		return {
	// 			queueIndex,
	// 			queueLabel: `Q${queueIndex + 1}`,
	// 			blocks: row.blocks,
	// 			timeScale,
	// 			timelineStartTime,
	// 			annotationBlockKeys,
	// 			pointerLevels: pointerLayout.levels,
	// 			timeLabelLayout,
	// 			annotationTopSpace,
	// 			legendRows,
	// 			rowHeight,
	// 		};
	// 	});

	// 	const totalHeight = rowPlans.reduce((sum, row) => sum + row.rowHeight, 20);

	// 	this.canvas.width = this.config.width;
	// 	this.canvas.height = totalHeight;
	// 	this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

	// 	let rowOffsetY = 10;
	// 	for (const row of rowPlans) {
	// 		const chartY = rowOffsetY + row.annotationTopSpace + 24;

	// 		if (
	// 			this.getEffectiveProcessAnnotationMode() === "LEGEND" &&
	// 			row.legendRows > 0
	// 		) {
	// 			this.renderLegend(
	// 				this.ctx,
	// 				row.blocks,
	// 				row.annotationBlockKeys,
	// 				paddingLeft,
	// 				rowOffsetY + 4,
	// 				availableWidth,
	// 				this.config.fontSize,
	// 			);
	// 		}

	// 		this.ctx.save();
	// 		this.ctx.fillStyle = this.config.darkMode ? "#ffffff" : "#555555";
	// 		this.ctx.font = `600 ${Math.round(this.config.fontSize * 0.55)}px ${this.config.fontFamily}`;
	// 		this.ctx.textAlign = "left";
	// 		this.ctx.textBaseline = "middle";
	// 		this.ctx.fillText(
	// 			row.queueLabel,
	// 			12,
	// 			chartY + this.config.blockHeight / 2,
	// 		);
	// 		this.ctx.restore();

	// 		this.renderBlocks(
	// 			this.ctx,
	// 			row.blocks,
	// 			paddingLeft,
	// 			chartY,
	// 			row.timeScale,
	// 			this.config.blockHeight,
	// 			this.config.fontSize,
	// 			row.annotationBlockKeys,
	// 			row.pointerLevels,
	// 			row.timeLabelLayout,
	// 			row.timelineStartTime,
	// 		);

	// 		rowOffsetY += row.rowHeight;
	// 	}
	// }

	/**
	 * Render Gantt chart on canvas
	 */
	render(ganttBlocks: GanttBlock[], options: Partial<GanttRenderOptions> = {}) {
		this.lastRenderOptions = {
			...this.lastRenderOptions,
			...options,
		};
		const preparedBlocks = this.prepareRenderableBlocks(ganttBlocks);

		// Save for export
		this.lastBlocks = preparedBlocks;
		this.config.colorful = this.lastRenderOptions.colorful;
		this.config.darkMode = this.lastRenderOptions.darkMode;

		if (preparedBlocks.length === 0) {
			this.renderEmpty();
			return;
		}

		// Detect multi-queue mode
		const isMultiQueue = this.isMultiQueueMode(preparedBlocks);

		const queueGroups = isMultiQueue
			? this.groupBlocksByQueue(preparedBlocks)
			: [];
		const queueAnnotationSpace = this.getQueueAnnotationSpace(
			isMultiQueue && queueGroups.length > 0,
		);

		// Calculate time scale to fit width
		const paddingX = 30;
		const availableWidth = this.config.width - paddingX * 2;
		const timeScale = this.calculateTimeScale(
			preparedBlocks,
			availableWidth,
			0,
		);
		const annotationBlockKeys = this.buildAnnotationBlocks(
			preparedBlocks,
			timeScale,
			this.config.fontSize,
		);
		const timeLabelPositions = this.buildTimeLabelPositions(
			preparedBlocks,
			paddingX,
			timeScale,
		);
		const timeLabelLayout = this.buildTimeLabelLayout(
			timeLabelPositions,
			this.lastRenderOptions.timeLabelRenderMode,
		);

		const pointerLayout =
			this.getEffectiveProcessAnnotationMode() === "POINTER_LEVELING" ||
			this.getEffectiveProcessAnnotationMode() === "POINTER_FIRST_ONLY"
				? this.buildPointerLevels(
						preparedBlocks,
						annotationBlockKeys,
						paddingX,
						timeScale,
					)
				: { levels: new Map<string, number>(), maxLevel: 0 };

		const legendRows =
			this.getEffectiveProcessAnnotationMode() === "LEGEND"
				? Math.ceil(
						new Set(
							preparedBlocks
								.filter((block) =>
									annotationBlockKeys.has(this.getBlockKey(block)),
								)
								.map((block) => block.processId),
						).size /
							Math.max(
								1,
								Math.floor(
									availableWidth / GanttChartRenderer.LEGEND_ITEM_WIDTH,
								),
							),
					)
				: 0;
		const legendBottomSpace =
			this.getEffectiveProcessAnnotationMode() === "LEGEND" && legendRows > 0
				? legendRows * GanttChartRenderer.LEGEND_ROW_HEIGHT + 10
				: 0;

		const annotationTopSpace =
			this.getEffectiveProcessAnnotationMode() === "LEGEND"
				? 0
				: pointerLayout.maxLevel >= 0 &&
					  annotationBlockKeys.size > 0 &&
					  this.getEffectiveProcessAnnotationMode() !== "HIDDEN"
					? 30 +
						pointerLayout.maxLevel * GanttChartRenderer.POINTER_LEVEL_SPACING
					: 0;

		// Calculate canvas dimensions
		const canvasHeight =
			queueAnnotationSpace +
			annotationTopSpace +
			this.config.blockHeight +
			this.config.lineSpacing +
			60 +
			timeLabelLayout.maxLevel * GanttChartRenderer.TIME_LABEL_LEVEL_SPACING +
			legendBottomSpace;

		// Set canvas dimensions
		this.canvas.width = this.config.width;
		this.canvas.height = canvasHeight;

		// Clear canvas (transparent background)
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// Render the chart
		const chartY = queueAnnotationSpace + annotationTopSpace + 32;

		// Render queue markers for multi-queue mode
		if (
			isMultiQueue &&
			queueGroups.length > 0 &&
			this.lastRenderOptions.showQueueAnnotation
		) {
			this.renderQueueMarkers(
				this.ctx,
				preparedBlocks,
				queueGroups,
				paddingX,
				queueAnnotationSpace + 8,
				timeScale,
				this.config.fontSize,
			);
		}

		this.renderBlocks(
			this.ctx,
			preparedBlocks,
			paddingX,
			chartY,
			timeScale,
			this.config.blockHeight,
			this.config.fontSize,
			annotationBlockKeys,
			pointerLayout.levels,
			timeLabelLayout,
		);

		if (
			this.getEffectiveProcessAnnotationMode() === "LEGEND" &&
			legendRows > 0
		) {
			const legendTopY =
				chartY +
				this.config.blockHeight +
				this.config.lineSpacing +
				24 +
				timeLabelLayout.maxLevel * GanttChartRenderer.TIME_LABEL_LEVEL_SPACING;

			this.renderLegend(
				this.ctx,
				preparedBlocks,
				annotationBlockKeys,
				paddingX,
				legendTopY,
				availableWidth,
				this.config.fontSize,
			);
		}
	}

	/**
	 * Render all blocks
	 */
	private renderBlocks(
		ctx: CanvasRenderingContext2D,
		blocks: GanttBlock[],
		startX: number,
		y: number,
		timeScale: number,
		blockHeight: number,
		fontSize: number,
		annotationBlockKeys: Set<string>,
		pointerLevels: Map<string, number>,
		timeLabelLayout: {
			levels: number[];
			visible: boolean[];
			maxLevel: number;
			fontScales: number[];
		},
		timelineStartTime?: number,
	) {
		const { minStartTime } = this.getTimelineBounds(blocks);
		const baseStartTime = timelineStartTime ?? minStartTime;

		// Render start time label
		if (
			this.config.showTimeLabels &&
			blocks.length > 0 &&
			timeLabelLayout.visible[0]
		) {
			const startLevel = timeLabelLayout.levels[0] ?? 0;
			this.renderTimeLabel(
				ctx,
				blocks[0].startTime,
				startX,
				y,
				blockHeight,
				fontSize,
				startLevel,
				this.lastRenderOptions.timeLabelRenderMode,
				timeLabelLayout.fontScales[0] ?? 1,
			);
		}

		// Render each block
		for (let i = 0; i < blocks.length; i++) {
			const block = blocks[i];
			const width = this.getBlockSpan(block) * timeScale;
			const currentX =
				startX + Math.max(0, block.startTime - baseStartTime) * timeScale;

			// Determine block colors based on colorful and dark mode settings
			let fillColor: string;
			let textColor: string;

			if (this.config.colorful) {
				// Use the block's color (which may be adjusted for dark mode)
				if (this.config.darkMode) {
					// In dark mode colorful, darken the color and keep white text
					fillColor = darkenColor(block.color, 0.35);
					textColor = "#ffffff";
				} else {
					// In light mode colorful, use bright color with white text
					fillColor = block.color;
					textColor = "#ffffff";
				}
			} else {
				// Monochrome mode
				fillColor = "transparent"; // White blocks with only borders
				// White text in dark mode, black text in light mode
				textColor = this.config.darkMode ? "#ffffff" : "#000000";
			}

			// Draw block background
			ctx.fillStyle = fillColor;
			ctx.fillRect(currentX, y, width, blockHeight);

			// Draw borders (white in dark mode, black otherwise)
			ctx.strokeStyle = this.config.darkMode ? "#ffffff" : "#000000";
			ctx.lineWidth = this.config.borderWidth;
			ctx.strokeRect(currentX, y, width, blockHeight);

			const blockKey = this.getBlockKey(block);
			const canRenderInside = this.canRenderProcessNameInside(
				width,
				block.processName,
				fontSize,
			);

			// Draw process name inside block
			if (this.config.showProcessNames && canRenderInside) {
				this.renderProcessName(
					ctx,
					block.processName,
					currentX,
					y,
					width,
					blockHeight,
					textColor,
					fontSize,
				);
			}

			// Draw external process annotation line for blocks where inside text cannot fit
			if (
				this.config.showProcessNames &&
				annotationBlockKeys.has(blockKey) &&
				(this.getEffectiveProcessAnnotationMode() === "POINTER_LEVELING" ||
					this.getEffectiveProcessAnnotationMode() === "POINTER_FIRST_ONLY")
			) {
				const level = pointerLevels.get(blockKey) ?? -1;
				if (level >= 0) {
					this.renderPointerLine(
						ctx,
						block.processName,
						currentX,
						y,
						width,
						fontSize,
						level,
					);
				}
			}

			// Move to next position
			const dividerX = currentX + width;

			// Render time label at divider (end of this block)
			if (this.config.showTimeLabels && timeLabelLayout.visible[i + 1]) {
				const level = timeLabelLayout.levels[i + 1] ?? 0;
				this.renderTimeLabel(
					ctx,
					block.endTime,
					dividerX,
					y,
					blockHeight,
					fontSize,
					level,
					this.lastRenderOptions.timeLabelRenderMode,
					timeLabelLayout.fontScales[i + 1] ?? 1,
				);
			}

			// Render context switch time under the divider (if there's a next block with gap)
			if (i < blocks.length - 1) {
				const nextBlock = blocks[i + 1];
				const contextSwitchTime = nextBlock.startTime - block.endTime;
				if (contextSwitchTime > 0) {
					this.renderContextSwitchTime(
						ctx,
						contextSwitchTime,
						dividerX,
						y,
						blockHeight,
						fontSize,
						timeLabelLayout.maxLevel,
					);
				}
			}
		}
	}

	/**
	 * Render pointer line connecting narrow block to its name label
	 * Multi-level support: each level extends the line further up to avoid overlaps
	 */
	private renderPointerLine(
		ctx: CanvasRenderingContext2D,
		name: string,
		x: number,
		y: number,
		width: number,
		fontSize: number,
		level: number = 0,
	) {
		ctx.save();

		// Calculate center of block
		const blockCenterX = x + width / 2;
		const blockTopY = y;

		// Base line end position + level offset
		// Level 0: 25px above block, Level 1: 45px above, Level 2: 65px, etc.
		// Each level adds 20px for proper spacing
		const baseLineLength = 25;
		const levelOffset = level * GanttChartRenderer.POINTER_LEVEL_SPACING;
		const totalLineLength = baseLineLength + levelOffset;
		const lineEndY = y - totalLineLength;

		// Draw thin dashed line from block center upward (white in dark mode)
		ctx.strokeStyle = this.config.darkMode ? "#ffffff" : "#666666";
		ctx.lineWidth = 1;
		ctx.setLineDash([2, 2]); // Dashed line
		ctx.beginPath();
		ctx.moveTo(blockCenterX, blockTopY);
		ctx.lineTo(blockCenterX, lineEndY);
		ctx.stroke();

		// Draw process name above the line (white in dark mode)
		ctx.fillStyle = this.config.darkMode ? "#ffffff" : "#000000";
		ctx.font = `500 ${Math.round(fontSize * 0.5)}px ${this.config.fontFamily}`;
		ctx.textAlign = "center";
		ctx.textBaseline = "bottom";
		ctx.fillText(name, blockCenterX, lineEndY - 3);

		ctx.restore();
	}

	/**
	 * Render process name centered inside a block
	 */
	private renderProcessName(
		ctx: CanvasRenderingContext2D,
		name: string,
		x: number,
		y: number,
		width: number,
		blockHeight: number,
		color: string,
		fontSize: number,
	) {
		ctx.save();

		ctx.fillStyle = color;
		ctx.font = `600 ${fontSize}px ${this.config.fontFamily}`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";

		// Add text shadow for colorful mode (better readability)
		if (this.config.colorful) {
			ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
			ctx.shadowBlur = 2;
			ctx.shadowOffsetX = 1;
			ctx.shadowOffsetY = 1;
		}

		const textX = x + width / 2;
		const textY = y + blockHeight / 2;

		ctx.fillText(name, textX, textY);

		ctx.restore();
	}

	/**
	 * Render time label below a block divider
	 */
	private renderTimeLabel(
		ctx: CanvasRenderingContext2D,
		time: number,
		x: number,
		y: number,
		blockHeight: number,
		fontSize: number,
		level: number = 0,
		mode: TimeLabelRenderMode = "LINE_LEVELING",
		fontScaleMultiplier: number = 1,
	) {
		ctx.save();

		const levelOffset = level * GanttChartRenderer.TIME_LABEL_LEVEL_SPACING;
		const lineStartY = y + blockHeight;
		const textY = y + blockHeight + 8 + levelOffset;

		ctx.fillStyle = this.config.darkMode ? "#ffffff" : "#000000";
		const baseScale = level > 0 ? 0.6 : 0.85;
		const finalScale = Math.max(0.5, baseScale * fontScaleMultiplier);
		ctx.font = `500 ${Math.round(fontSize * finalScale)}px ${this.config.fontFamily}`;
		ctx.textAlign = "center";
		ctx.textBaseline = "top";

		if (mode === "LINE_LEVELING" && level > 0) {
			// Connector line from divider to its assigned label level.
			ctx.strokeStyle = this.config.darkMode ? "#ffffff" : "#666666";
			ctx.lineWidth = 1;
			ctx.setLineDash([]);
			ctx.beginPath();
			ctx.moveTo(x, lineStartY);
			ctx.lineTo(x, textY - 2);
			ctx.stroke();
		}

		ctx.fillText(time.toString(), x, textY);

		ctx.restore();
	}

	/**
	 * Render context switch time under a divider
	 */
	private renderContextSwitchTime(
		ctx: CanvasRenderingContext2D,
		time: number,
		x: number,
		y: number,
		blockHeight: number,
		fontSize: number,
		maxTimeLabelLevel: number = 0,
	) {
		ctx.save();

		ctx.fillStyle = this.config.darkMode ? "#ffffff" : "#dc2626"; // White in dark mode, red otherwise
		ctx.font = `${Math.round(fontSize * 0.7)}px ${this.config.fontFamily}`;
		ctx.textAlign = "center";
		ctx.textBaseline = "top";

		const textY =
			y +
			blockHeight +
			20 +
			maxTimeLabelLevel * GanttChartRenderer.TIME_LABEL_LEVEL_SPACING;
		ctx.fillText(`CS:${time}`, x, textY);

		ctx.restore();
	}

	/**
	 * Render empty state when no blocks
	 */
	private renderEmpty() {
		this.canvas.width = this.config.width;
		this.canvas.height = 100;

		// Clear with transparent background
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		this.ctx.fillStyle = this.config.darkMode ? "#ffffff" : "#666666";
		this.ctx.font = `16px ${this.config.fontFamily}`;
		this.ctx.textAlign = "center";
		this.ctx.textBaseline = "middle";
		this.ctx.fillText("No processes to display", this.canvas.width / 2, 50);
	}

	/**
	 * Export canvas to PNG data URL with 1920px width and dynamic height
	 */
	exportToPNG(): string {
		if (this.lastBlocks.length === 0) {
			return this.canvas.toDataURL("image/png");
		}

		// Export dimensions - take full width with minimal padding
		const exportWidth = 1920;
		const paddingX = 30; // Minimal left/right padding
		const paddingY = 10;
		const availableWidth = exportWidth - paddingX * 2; // Chart uses full width minus minimal margins
		const blockHeight = 100;
		const lineSpacing = 40;
		const fontSize = 48;

		// Calculate time scale for export width
		const timeScale = this.calculateTimeScale(
			this.lastBlocks,
			availableWidth,
			5,
		);
		const isMultiQueue = this.isMultiQueueMode(this.lastBlocks);
		const queueGroups = isMultiQueue ? this.groupBlocksByQueue(this.lastBlocks) : [];
		const queueAnnotationSpace = this.getQueueAnnotationSpace(
			isMultiQueue && queueGroups.length > 0,
		);
		const annotationBlockKeys = this.buildAnnotationBlocks(
			this.lastBlocks,
			timeScale,
			fontSize,
		);
		const timeLabelPositions = this.buildTimeLabelPositions(
			this.lastBlocks,
			paddingX,
			timeScale,
		);
		const baseTimeLabelLayout = this.buildTimeLabelLayout(
			timeLabelPositions,
			this.lastRenderOptions.timeLabelRenderMode,
		);
		const timeLabelValues = [
			this.lastBlocks[0].startTime,
			...this.lastBlocks.map((block) => block.endTime),
		].map((value) => value.toString());
		const timeLabelLayout = {
			...baseTimeLabelLayout,
			fontScales: this.tightenTimeLabelFontScalesForExport(
				timeLabelPositions,
				timeLabelValues,
				baseTimeLabelLayout,
				fontSize,
			),
		};
		const pointerLayout =
			this.getEffectiveProcessAnnotationMode() === "POINTER_LEVELING" ||
			this.getEffectiveProcessAnnotationMode() === "POINTER_FIRST_ONLY"
				? this.buildPointerLevels(
						this.lastBlocks,
						annotationBlockKeys,
						paddingX,
						timeScale,
					)
				: { levels: new Map<string, number>(), maxLevel: 0 };

		const legendRows =
			this.getEffectiveProcessAnnotationMode() === "LEGEND"
				? Math.ceil(
						new Set(
							this.lastBlocks
								.filter((block) =>
									annotationBlockKeys.has(this.getBlockKey(block)),
								)
								.map((block) => block.processId),
						).size /
							Math.max(
								1,
								Math.floor(
									availableWidth / GanttChartRenderer.LEGEND_ITEM_WIDTH,
								),
							),
					)
				: 0;
		const legendBottomSpace =
			this.getEffectiveProcessAnnotationMode() === "LEGEND" && legendRows > 0
				? legendRows * GanttChartRenderer.LEGEND_ROW_HEIGHT + 54
				: 0;

		const annotationTopSpace =
			this.getEffectiveProcessAnnotationMode() === "LEGEND"
				? 0
				: pointerLayout.maxLevel >= 0 &&
					  annotationBlockKeys.size > 0 &&
					  this.getEffectiveProcessAnnotationMode() !== "HIDDEN"
					? 30 +
						pointerLayout.maxLevel * GanttChartRenderer.POINTER_LEVEL_SPACING
					: 0;
		const chartY = paddingY + queueAnnotationSpace + annotationTopSpace + 30;

		// Calculate dynamic height based on content
		// Height = pointer line space + padding + chart area + labels + padding
		const adjustedExportHeight =
			chartY +
			blockHeight +
			lineSpacing +
			20 +
			timeLabelLayout.maxLevel * GanttChartRenderer.TIME_LABEL_LEVEL_SPACING +
			legendBottomSpace;

		// Create a temporary canvas with calculated dimensions
		const exportCanvas = document.createElement("canvas");
		const exportCtx = exportCanvas.getContext("2d");

		if (!exportCtx) {
			return this.canvas.toDataURL("image/png");
		}

		// Set canvas dimensions
		exportCanvas.width = exportWidth;
		exportCanvas.height = adjustedExportHeight;

		// Clear with transparent background
		exportCtx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);

		if (
			isMultiQueue &&
			queueGroups.length > 0 &&
			this.lastRenderOptions.showQueueAnnotation
		) {
			this.renderQueueMarkers(
				exportCtx,
				this.lastBlocks,
				queueGroups,
				paddingX,
				paddingY + queueAnnotationSpace + 8,
				timeScale,
				36,
			);
		}

		// Render blocks on export canvas
		this.renderBlocks(
			exportCtx,
			this.lastBlocks,
			paddingX,
			chartY,
			timeScale,
			blockHeight,
			fontSize,
			annotationBlockKeys,
			pointerLayout.levels,
			timeLabelLayout,
		);

		if (
			this.getEffectiveProcessAnnotationMode() === "LEGEND" &&
			legendRows > 0
		) {
			const legendTopY =
				chartY +
				blockHeight +
				lineSpacing +
				64 +
				timeLabelLayout.maxLevel * GanttChartRenderer.TIME_LABEL_LEVEL_SPACING;

			this.renderLegend(
				exportCtx,
				this.lastBlocks,
				annotationBlockKeys,
				paddingX,
				legendTopY,
				availableWidth,
				fontSize,
				20,
				80
			);
		}

		return exportCanvas.toDataURL("image/png");
	}

	/**
	 * Update colorful setting
	 */
	setColorful(colorful: boolean) {
		this.config.colorful = colorful;
	}

	/**
	 * Update dark mode setting
	 */
	setDarkMode(darkMode: boolean) {
		this.config.darkMode = darkMode;
	}

	/**
	 * Update configuration
	 */
	updateConfig(newConfig: Partial<GanttCanvasConfig>) {
		this.config = { ...this.config, ...newConfig };
	}

	/**
	 * Get current colorful setting
	 */
	isColorful(): boolean {
		return this.config.colorful;
	}
}
