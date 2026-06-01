import { useCallback, useMemo, useState } from 'react';
import { getAlgorithm, PAGE_REPLACEMENT_ALGORITHMS } from '@domain/algorithms/page-replacement';
import type {
	PageReplacementAlgorithmType,
	PageReplacementBatchResult,
	PageReplacementRun,
} from '@domain/types/page-replacement';
import { parseFrameCounts, parseReferenceString, validatePageReplacementSelection } from '@domain/validators/page-replacement-validators';

const DEFAULT_ALGORITHM: PageReplacementAlgorithmType = 'FIFO';
const DEFAULT_REFERENCE_STRING = '7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2';
const DEFAULT_FRAME_COUNTS = '3, 4, 5';

export interface PageReplacementInitialState {
	algorithm?: PageReplacementAlgorithmType;
	referenceStringInput?: string;
	frameCountsInput?: string;
	selectedRunId?: string | null;
}

export interface PageReplacementRunState {
	algorithm: PageReplacementAlgorithmType;
	referenceStringInput: string;
	frameCountsInput: string;
	selectedRunId: string | null;
	selectedStepIndex: number;
	batchResult: PageReplacementBatchResult | null;
	errors: string[];
}

export function usePageReplacement(initialState: PageReplacementInitialState = {}) {
	const [algorithm, setAlgorithm] = useState<PageReplacementAlgorithmType>(initialState.algorithm ?? DEFAULT_ALGORITHM);
	const [referenceStringInput, setReferenceStringInput] = useState(initialState.referenceStringInput ?? DEFAULT_REFERENCE_STRING);
	const [frameCountsInput, setFrameCountsInput] = useState(initialState.frameCountsInput ?? DEFAULT_FRAME_COUNTS);
	const [selectedRunId, setSelectedRunId] = useState<string | null>(initialState.selectedRunId ?? null);
	const [selectedStepIndex, setSelectedStepIndex] = useState(0);
	const [batchResult, setBatchResult] = useState<PageReplacementBatchResult | null>(null);
	const [errors, setErrors] = useState<string[]>([]);

	const runComparison = useCallback(() => {
		const selectedAlgorithmValidation = validatePageReplacementSelection(algorithm);
		const referenceParsed = parseReferenceString(referenceStringInput);
		const frameParsed = parseFrameCounts(frameCountsInput);
		const nextErrors = [
			...selectedAlgorithmValidation.errors,
			...referenceParsed.errors,
			...frameParsed.errors,
		];

		if (referenceParsed.values.length === 0) {
			nextErrors.push('Reference string cannot be empty.');
		}

		if (frameParsed.values.length === 0) {
			nextErrors.push('Frame count list cannot be empty.');
		}

		if (nextErrors.length > 0) {
			setErrors(Array.from(new Set(nextErrors)));
			setBatchResult(null);
			setSelectedRunId(null);
			setSelectedStepIndex(0);
			return false;
		}

		const referenceString = referenceParsed.values;
		const frameCounts = frameParsed.values;
		const runs: PageReplacementRun[] = [];

		const calculate = getAlgorithm(algorithm);
		for (const frameCount of frameCounts) {
			const result = calculate(referenceString, frameCount);
			runs.push({
				runId: `${algorithm}-${frameCount}`,
				algorithm,
				frameCount,
				result,
			});
		}

		setErrors([]);
		setBatchResult({ referenceString, runs });
		
		const nextRunId = (selectedRunId && runs.some(r => r.runId === selectedRunId))
			? selectedRunId
			: (runs[0]?.runId ?? null);
			
		setSelectedRunId(nextRunId);
		setSelectedStepIndex(0);
		return true;
	}, [algorithm, frameCountsInput, referenceStringInput]);

	const selectedRun = useMemo<PageReplacementRun | null>(() => {
		if (!batchResult) return null;
		return batchResult.runs.find((run) => run.runId === selectedRunId) ?? batchResult.runs[0] ?? null;
	}, [batchResult, selectedRunId]);

	const selectRun = useCallback((runId: string) => {
		setSelectedRunId(runId);
		setSelectedStepIndex(0);
	}, []);

	const nextStep = useCallback(() => {
		if (!selectedRun) return;
		setSelectedStepIndex((current) => Math.min(current + 1, Math.max(selectedRun.result.steps.length - 1, 0)));
	}, [selectedRun]);

	const previousStep = useCallback(() => {
		setSelectedStepIndex((current) => Math.max(current - 1, 0));
	}, []);

	const reset = useCallback(() => {
		setAlgorithm(DEFAULT_ALGORITHM);
		setReferenceStringInput(DEFAULT_REFERENCE_STRING);
		setFrameCountsInput(DEFAULT_FRAME_COUNTS);
		setSelectedRunId(null);
		setSelectedStepIndex(0);
		setBatchResult(null);
		setErrors([]);
	}, []);

	return {
		algorithm,
		setAlgorithm,
		referenceStringInput,
		setReferenceStringInput,
		frameCountsInput,
		setFrameCountsInput,
		selectedRunId,
		selectedRun,
		selectedStepIndex,
		setSelectedStepIndex,
		batchResult,
		errors,
		runComparison,
		selectRun,
		nextStep,
		previousStep,
		reset,
		allAlgorithms: PAGE_REPLACEMENT_ALGORITHMS,
	};
}
