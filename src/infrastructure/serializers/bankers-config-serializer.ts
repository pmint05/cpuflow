import { encodeBase64URL, decodeBase64URL } from './common-serializer';
import { parseMatrixString, parseVectorString } from '../parsers/matrix-parser';

// ============================================================
// Banker's Algorithm URL Config Serializer (TICKET-009)
// ============================================================

/** Shape stored in the URL for Banker's Algorithm page */
export interface BankersConfig {
  processCount: number;
  resourceCount: number;
  allocation: number[][];
  max: number[][];
  available: number[];
  /** Optional: process ID to test request for (0-indexed) */
  requestProcessId?: number;
  /** Optional: request vector */
  requestVector?: number[];
}

const BANKERS_DEFAULTS: BankersConfig = {
  processCount: 5,
  resourceCount: 3,
  allocation: [
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2],
    [2, 1, 1],
    [0, 0, 2],
  ],
  max: [
    [7, 5, 3],
    [3, 2, 2],
    [9, 0, 2],
    [2, 2, 2],
    [4, 3, 3],
  ],
  available: [3, 3, 2],
};

function isMatrix(value: unknown): value is number[][] {
	return Array.isArray(value) && value.every((row) => Array.isArray(row) && row.every((cell) => typeof cell === 'number' && Number.isFinite(cell)));
}

function isVector(value: unknown): value is number[] {
	return Array.isArray(value) && value.every((cell) => typeof cell === 'number' && Number.isFinite(cell));
}

function normalizeLegacyConfig(parsed: Record<string, unknown>): BankersConfig {
	const allocation = typeof parsed.allocation === 'string' ? parseMatrixString(parsed.allocation) : isMatrix(parsed.allocation) ? parsed.allocation : null;
	const max = typeof parsed.max === 'string' ? parseMatrixString(parsed.max) : isMatrix(parsed.max) ? parsed.max : null;
	const available = typeof parsed.available === 'string' ? parseVectorString(parsed.available) : isVector(parsed.available) ? parsed.available : null;

	if (!allocation || !max || !available) {
		return BANKERS_DEFAULTS;
	}

	return {
		processCount: typeof parsed.processCount === 'number' ? parsed.processCount : allocation.length,
		resourceCount: typeof parsed.resourceCount === 'number' ? parsed.resourceCount : available.length,
		allocation,
		max,
		available,
		requestProcessId: typeof parsed.requestProcessId === 'number' ? parsed.requestProcessId : undefined,
		requestVector: typeof parsed.requestVector === 'string' ? parseVectorString(parsed.requestVector) ?? undefined : isVector(parsed.requestVector) ? parsed.requestVector : undefined,
	};
}

export function encodeBankersConfig(config: BankersConfig): string {
  return encodeBase64URL(config);
}

export function decodeBankersConfig(encoded: string): BankersConfig {
  const parsed = decodeBase64URL<BankersConfig>(encoded);
  if (!parsed || typeof parsed !== 'object') return BANKERS_DEFAULTS;

  const record = parsed as Record<string, unknown>;

  if (isMatrix(record.allocation) && isMatrix(record.max) && isVector(record.available)) {
    return {
      processCount: typeof record.processCount === 'number' ? record.processCount : record.allocation.length,
      resourceCount: typeof record.resourceCount === 'number' ? record.resourceCount : record.available.length,
      allocation: record.allocation,
      max: record.max,
      available: record.available,
      requestProcessId: typeof record.requestProcessId === 'number' ? record.requestProcessId : undefined,
      requestVector: isVector(record.requestVector) ? record.requestVector : undefined,
    };
  }

  return normalizeLegacyConfig(record);
}

export { BANKERS_DEFAULTS };
