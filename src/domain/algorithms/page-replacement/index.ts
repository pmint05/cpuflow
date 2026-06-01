import type { PageReplacementAlgorithmType, PageReplacementResult } from '@domain/types/page-replacement';
import { calculateFIFO } from './fifo';
import { calculateLFU } from './lfu';
import { calculateLRU } from './lru';
import { calculateOPT } from './opt';
import { calculateSecondChance } from './second-chance';

export const algorithms = {
	FIFO: calculateFIFO,
	LRU: calculateLRU,
	OPT: calculateOPT,
	LFU: calculateLFU,
	SECOND_CHANCE: calculateSecondChance,
} as const;

export function getAlgorithm(type: PageReplacementAlgorithmType): (referenceString: string[], frameCount: number) => PageReplacementResult {
	return algorithms[type];
}

export function getAlgorithmName(type: PageReplacementAlgorithmType): string {
	const names: Record<PageReplacementAlgorithmType, string> = {
		FIFO: 'FIFO',
		LRU: 'LRU',
		OPT: 'OPT',
		LFU: 'LFU',
		SECOND_CHANCE: 'Second Chance',
	};

	return names[type];
}

export const PAGE_REPLACEMENT_ALGORITHMS: PageReplacementAlgorithmType[] = [
	'FIFO',
	'LRU',
	'OPT',
	'LFU',
	'SECOND_CHANCE',
];
