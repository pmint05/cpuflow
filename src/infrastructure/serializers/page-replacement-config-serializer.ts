import type { PageReplacementAlgorithmType } from '@domain/types/page-replacement';

export interface PageReplacementUrlConfig {
	algorithm: PageReplacementAlgorithmType;
	referenceStringInput: string;
	frameCountsInput: string;
	selectedRunId: string;
}

export const PAGE_REPLACEMENT_DEFAULTS: PageReplacementUrlConfig = {
	algorithm: 'FIFO',
	referenceStringInput: '7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2',
	frameCountsInput: '3, 4, 5',
	selectedRunId: '',
};

const ALGORITHMS: PageReplacementAlgorithmType[] = [
	'FIFO',
	'LRU',
	'OPT',
	'LFU',
	'SECOND_CHANCE',
];

function asAlgorithm(value: string | null): PageReplacementAlgorithmType {
	if (!value) return PAGE_REPLACEMENT_DEFAULTS.algorithm;
	const normalized = value.toUpperCase();
	return ALGORITHMS.includes(normalized as PageReplacementAlgorithmType)
		? (normalized as PageReplacementAlgorithmType)
		: PAGE_REPLACEMENT_DEFAULTS.algorithm;
}

function asString(value: string | null, fallback: string): string {
	if (value === null) return fallback;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : fallback;
}

export function decodePageReplacementConfig(search: string): PageReplacementUrlConfig {
	const params = new URLSearchParams(search);

	return {
		algorithm: asAlgorithm(params.get('algo')),
		referenceStringInput: asString(params.get('refs'), PAGE_REPLACEMENT_DEFAULTS.referenceStringInput),
		frameCountsInput: asString(params.get('frames'), PAGE_REPLACEMENT_DEFAULTS.frameCountsInput),
		selectedRunId: asString(params.get('run'), PAGE_REPLACEMENT_DEFAULTS.selectedRunId),
	};
}

export function encodePageReplacementConfig(config: PageReplacementUrlConfig): string {
	const params = new URLSearchParams();
	params.set('algo', config.algorithm);
	params.set('refs', config.referenceStringInput);
	params.set('frames', config.frameCountsInput);
	if (config.selectedRunId.trim().length > 0) {
		params.set('run', config.selectedRunId.trim());
	}
	return params.toString();
}