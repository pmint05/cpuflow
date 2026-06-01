import type {
	PageReplacementAlgorithmType,
	PageReplacementInput,
	PageReplacementMetrics,
	PageReplacementResult,
	PageReplacementStep,
} from '@domain/types/page-replacement';

export type FrameValue = string | null;

export function createEmptyFrames(frameCount: number): FrameValue[] {
	return Array.from({ length: frameCount }, () => null);
}

export function cloneFrames(frames: FrameValue[]): FrameValue[] {
	return [...frames];
}

export function findFrameIndex(frames: FrameValue[], page: string): number {
	return frames.findIndex((frame) => frame === page);
}

export function findEmptyFrameIndex(frames: FrameValue[]): number {
	return frames.findIndex((frame) => frame === null);
}

export function buildStep(params: PageReplacementStep): PageReplacementStep {
	return params;
}

export function buildResult(params: {
	input: PageReplacementInput;
	steps: PageReplacementStep[];
}): PageReplacementResult {
	const pageFaults = params.steps.filter((step) => step.fault).length;
	const hits = params.steps.length - pageFaults;
	const faultSequence = params.steps
		.filter((step) => step.fault)
		.map((step) => step.referencedPage);

	const metrics: PageReplacementMetrics = {
		totalReferences: params.input.referenceString.length,
		pageFaults,
		hits,
		hitRate: params.input.referenceString.length > 0
			? Number(((hits / params.input.referenceString.length) * 100).toFixed(2))
			: 0,
		faultRate: params.input.referenceString.length > 0
			? Number(((pageFaults / params.input.referenceString.length) * 100).toFixed(2))
			: 0,
		faultSequence,
	};

	return {
		...params.input,
		...metrics,
		steps: params.steps,
	};
}

export function formatFrameLabel(frameIndex: number): string {
	return `F${frameIndex + 1}`;
}

export function createNotApplicableResult(
	input: PageReplacementInput,
	message: string,
): PageReplacementResult {
	return {
		...input,
		totalReferences: input.referenceString.length,
		pageFaults: 0,
		hits: 0,
		hitRate: 0,
		faultRate: 0,
		faultSequence: [],
		steps: input.referenceString.map((referencedPage, stepIndex) => ({
			stepIndex,
			referencedPage,
			hit: false,
			fault: false,
			replacedPage: null,
			changedFrameIndex: null,
			framesBefore: createEmptyFrames(input.frameCount),
			framesAfter: createEmptyFrames(input.frameCount),
			reason: message,
		})),
	};
}

export function isAlgorithmType(value: string): value is PageReplacementAlgorithmType {
	return value === 'FIFO' || value === 'LRU' || value === 'OPT' || value === 'LFU' || value === 'SECOND_CHANCE';
}
