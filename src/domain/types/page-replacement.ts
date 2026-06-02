export type PageReplacementAlgorithmType =
	| 'FIFO'
	| 'LRU'
	| 'OPT'
	| 'LFU'
	| 'SECOND_CHANCE';

export interface PageReplacementInput {
	algorithm: PageReplacementAlgorithmType;
	referenceString: string[];
	frameCount: number;
}

export interface PageReplacementStep {
	stepIndex: number;
	referencedPage: string;
	hit: boolean;
	fault: boolean;
	replacedPage: string | null;
	changedFrameIndex: number | null;
	framesBefore: Array<string | null>;
	framesAfter: Array<string | null>;
	reason: string;
}

export interface PageReplacementMetrics {
	totalReferences: number;
	pageFaults: number;
	hits: number;
	hitRate: number;
	faultRate: number;
	faultSequence: string[];
	victimSequence: string[];
}

export interface PageReplacementResult extends PageReplacementInput, PageReplacementMetrics {
	steps: PageReplacementStep[];
}

export interface PageReplacementRun {
	runId: string;
	algorithm: PageReplacementAlgorithmType;
	frameCount: number;
	result: PageReplacementResult;
}

export interface PageReplacementBatchResult {
	referenceString: string[];
	runs: PageReplacementRun[];
}
