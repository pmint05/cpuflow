import type { ValidationResult } from '@domain/types/resource-allocation';
import type { PageReplacementAlgorithmType } from '@domain/types/page-replacement';
import { PAGE_REPLACEMENT_ALGORITHMS } from '@domain/algorithms/page-replacement';

const NON_NEGATIVE_INTEGER_PATTERN = /^(0|[1-9]\d*)$/;
const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;

export interface ParsedPageReplacementInput {
	referenceString: string[];
	frameCounts: number[];
	comparisonAlgorithms: PageReplacementAlgorithmType[];
}

function splitTokens(input: string): string[] {
	return input.split(/[\s,]+/).map((token) => token.trim()).filter((token) => token.length > 0);
}

function parseIntegerList(
	input: string,
	pattern: RegExp,
	label: string,
): { values: number[]; errors: string[] } {
	const trimmed = input.trim();
	if (trimmed.length === 0) {
		return { values: [], errors: [`${label} cannot be empty`] };
	}

	const values: number[] = [];
	const errors: string[] = [];

	for (const token of splitTokens(trimmed)) {
		if (!pattern.test(token)) {
			errors.push(`${label} contains invalid value "${token}"`);
			continue;
		}

		values.push(Number(token));
	}

	if (values.length === 0 && errors.length === 0) {
		errors.push(`${label} cannot be empty`);
	}

	return { values, errors };
}

export function parseReferenceString(input: string): { values: string[]; errors: string[] } {
	const trimmed = input.trim();
	if (trimmed.length === 0) {
		return { values: [], errors: ['Reference string cannot be empty'] };
	}

	const tokens = splitTokens(trimmed);
	if (tokens.length === 0) {
		return { values: [], errors: ['Reference string cannot be empty'] };
	}

	const ALPHABETIC_PATTERN = /^[A-Za-z]+$/;
	const isNumeric = NON_NEGATIVE_INTEGER_PATTERN.test(tokens[0]);
	const isAlphabetic = ALPHABETIC_PATTERN.test(tokens[0]);

	if (!isNumeric && !isAlphabetic) {
		return { values: [], errors: [`Reference string contains invalid value "${tokens[0]}"`] };
	}

	const values: string[] = [];
	const errors: string[] = [];
	const expectedPattern = isNumeric ? NON_NEGATIVE_INTEGER_PATTERN : ALPHABETIC_PATTERN;

	for (const token of tokens) {
		if (!expectedPattern.test(token)) {
			if (isNumeric && ALPHABETIC_PATTERN.test(token)) {
				errors.push(`Reference string cannot mix numbers and letters. Found letter "${token}" but expected numbers.`);
			} else if (isAlphabetic && NON_NEGATIVE_INTEGER_PATTERN.test(token)) {
				errors.push(`Reference string cannot mix numbers and letters. Found number "${token}" but expected letters.`);
			} else {
				errors.push(`Reference string contains invalid value "${token}"`);
			}
			continue;
		}
		// Normalize numeric tokens: "07" -> "7"
		values.push(isNumeric ? String(Number(token)) : token);
	}

	if (values.length === 0 && errors.length === 0) {
		errors.push('Reference string cannot be empty');
	}

	return { values, errors };
}

export function parseFrameCounts(input: string): { values: number[]; errors: string[]; hadDuplicates: boolean } {
	const parsed = parseIntegerList(input, POSITIVE_INTEGER_PATTERN, 'Frame count list');
	const uniqueValues: number[] = [];
	const seen = new Set<number>();
	let hadDuplicates = false;

	for (const value of parsed.values) {
		if (seen.has(value)) {
			hadDuplicates = true;
			continue;
		}

		seen.add(value);
		uniqueValues.push(value);
	}

	return { values: uniqueValues, errors: parsed.errors, hadDuplicates };
}

export function validateReferenceString(input: string): ValidationResult {
	const parsed = parseReferenceString(input);
	return { valid: parsed.errors.length === 0 && parsed.values.length > 0, errors: parsed.errors.length > 0 ? parsed.errors : (parsed.values.length > 0 ? [] : ['Reference string cannot be empty']) };
}

export function validateFrameCounts(input: string): ValidationResult {
	const parsed = parseFrameCounts(input);
	return { valid: parsed.errors.length === 0 && parsed.values.length > 0, errors: parsed.errors.length > 0 ? parsed.errors : (parsed.values.length > 0 ? [] : ['Frame count list cannot be empty']) };
}

export function validatePageReplacementSelection(algorithm: string): ValidationResult {
	if (!PAGE_REPLACEMENT_ALGORITHMS.includes(algorithm as PageReplacementAlgorithmType)) {
		return { valid: false, errors: [`Unsupported algorithm: ${algorithm}`] };
	}

	return { valid: true, errors: [] };
}
