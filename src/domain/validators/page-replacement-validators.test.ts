import { describe, expect, it } from 'vitest';
import { parseFrameCounts, parseReferenceString, validateFrameCounts, validateReferenceString } from './page-replacement-validators';

describe('page replacement validators', () => {
	it('parses reference strings into strings', () => {
		const parsed = parseReferenceString('7, 0, 1, 2, 0, 3');

		expect(parsed.errors).toEqual([]);
		expect(parsed.values).toEqual(['7', '0', '1', '2', '0', '3']);
	});

	it('parses alphabetic reference strings', () => {
		const parsed = parseReferenceString('A, B, C, D, A, B, E');

		expect(parsed.errors).toEqual([]);
		expect(parsed.values).toEqual(['A', 'B', 'C', 'D', 'A', 'B', 'E']);
	});

	it('rejects mixed alphanumeric reference strings', () => {
		const parsed = parseReferenceString('7, A, 1, B');

		expect(parsed.errors.length).toBeGreaterThan(0);
		expect(parsed.errors[0]).toContain('cannot mix numbers and letters');
	});

	it('deduplicates frame counts while preserving order', () => {
		const parsed = parseFrameCounts('3, 4, 3, 5, 4');

		expect(parsed.errors).toEqual([]);
		expect(parsed.values).toEqual([3, 4, 5]);
		expect(parsed.hadDuplicates).toBe(true);
	});

	it('rejects invalid frame counts and empty reference strings', () => {
		const frameCounts = validateFrameCounts('3, 0, x');
		const referenceString = validateReferenceString('');

		expect(frameCounts.valid).toBe(false);
		expect(frameCounts.errors.join(' ')).toContain('invalid value "x"');
		expect(frameCounts.errors.join(' ')).toContain('invalid value "0"');
		expect(referenceString.valid).toBe(false);
		expect(referenceString.errors).toContain('Reference string cannot be empty');
	});
});