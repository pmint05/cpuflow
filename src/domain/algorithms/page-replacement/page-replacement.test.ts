import { describe, expect, it } from 'vitest';
import { calculateFIFO } from './fifo';
import { calculateLRU } from './lru';
import { calculateOPT } from './opt';
import { calculateLFU } from './lfu';
import { calculateSecondChance } from './second-chance';

const referenceString = ['1', '2', '3', '1', '4', '2'];

describe('page replacement algorithms', () => {
	it('calculates FIFO step trace deterministically', () => {
		const result = calculateFIFO(referenceString, 3);

		expect(result.totalReferences).toBe(6);
		expect(result.pageFaults).toBe(4);
		expect(result.hits).toBe(2);
		expect(result.faultSequence).toEqual(['1', '2', '3', '4']);
		expect(result.victimSequence).toEqual(['1']);
		expect(result.steps).toHaveLength(6);
		expect(result.steps[0]?.framesAfter).toEqual(['1', null, null]);
		expect(result.steps[4]?.framesAfter).toEqual(['4', '2', '3']);
	});

	it('calculates LRU with least-recently-used replacement', () => {
		const result = calculateLRU(referenceString, 3);

		expect(result.pageFaults).toBe(5);
		expect(result.hits).toBe(1);
		expect(result.faultSequence).toEqual(['1', '2', '3', '4', '2']);
		expect(result.victimSequence).toEqual(['2', '3']);
		expect(result.steps[4]?.framesAfter).toEqual(['1', '4', '3']);
		expect(result.steps[5]?.fault).toBe(true);
	});

	it('calculates OPT by choosing the farthest next use', () => {
		const result = calculateOPT(referenceString, 3);

		expect(result.pageFaults).toBe(4);
		expect(result.hits).toBe(2);
		expect(result.faultSequence).toEqual(['1', '2', '3', '4']);
		expect(result.victimSequence).toEqual(['1']);
		expect(result.steps[4]?.framesAfter).toEqual(['4', '2', '3']);
		expect(result.steps[5]?.hit).toBe(true);
	});

	it('calculates LFU with frequency and recency tie-breaking', () => {
		const result = calculateLFU(referenceString, 3);

		expect(result.pageFaults).toBe(5);
		expect(result.hits).toBe(1);
		expect(result.faultSequence).toEqual(['1', '2', '3', '4', '2']);
		expect(result.victimSequence).toEqual(['2', '3']);
		expect(result.steps[4]?.framesAfter).toEqual(['1', '4', '3']);
	});

	it('calculates Second Chance deterministically', () => {
		const result = calculateSecondChance(referenceString, 3);

		expect(result.pageFaults).toBe(4);
		expect(result.hits).toBe(2);
		expect(result.faultSequence).toEqual(['1', '2', '3', '4']);
		expect(result.victimSequence).toEqual(['1']);
		expect(result.steps[0]?.framesBefore).toEqual([null, null, null]);
		expect(result.steps[4]?.framesAfter).toEqual(['4', '2', '3']);
	});
});