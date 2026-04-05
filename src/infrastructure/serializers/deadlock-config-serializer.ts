import { encodeBase64URL, decodeBase64URL } from './common-serializer';
import { parseMatrixString, parseVectorString } from '../parsers/matrix-parser';

// ============================================================
// Deadlock Detection URL Config Serializer (TICKET-009)
// ============================================================

/** Shape stored in the URL for Deadlock Detection page */
export interface DeadlockConfig {
  processCount: number;
  resourceCount: number;
  allocation: number[][];
  request: number[][];
  available: number[];
}

const DEADLOCK_DEFAULTS: DeadlockConfig = {
  processCount: 5,
  resourceCount: 3,
  allocation: [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
    [1, 1, 0],
    [0, 1, 1],
  ],
  request: [
    [0, 1, 0],
    [0, 0, 1],
    [1, 0, 0],
    [0, 1, 1],
    [1, 0, 0],
  ],
  available: [0, 0, 0],
};

function isMatrix(value: unknown): value is number[][] {
	return Array.isArray(value) && value.every((row) => Array.isArray(row) && row.every((cell) => typeof cell === 'number' && Number.isFinite(cell)));
}

function isVector(value: unknown): value is number[] {
	return Array.isArray(value) && value.every((cell) => typeof cell === 'number' && Number.isFinite(cell));
}

function normalizeLegacyConfig(parsed: Record<string, unknown>): DeadlockConfig {
	const allocation = typeof parsed.allocation === 'string' ? parseMatrixString(parsed.allocation) : isMatrix(parsed.allocation) ? parsed.allocation : null;
	const request = typeof parsed.request === 'string' ? parseMatrixString(parsed.request) : isMatrix(parsed.request) ? parsed.request : null;
	const available = typeof parsed.available === 'string' ? parseVectorString(parsed.available) : isVector(parsed.available) ? parsed.available : null;

	if (!allocation || !request || !available) {
		return DEADLOCK_DEFAULTS;
	}

	return {
		processCount: typeof parsed.processCount === 'number' ? parsed.processCount : allocation.length,
		resourceCount: typeof parsed.resourceCount === 'number' ? parsed.resourceCount : available.length,
		allocation,
		request,
		available,
	};
}

export function encodeDeadlockConfig(config: DeadlockConfig): string {
  return encodeBase64URL(config);
}

export function decodeDeadlockConfig(encoded: string): DeadlockConfig {
  const parsed = decodeBase64URL<DeadlockConfig>(encoded);
  if (!parsed || typeof parsed !== 'object') return DEADLOCK_DEFAULTS;

  const record = parsed as unknown as Record<string, unknown>;

  if (isMatrix(record.allocation) && isMatrix(record.request) && isVector(record.available)) {
    return {
      processCount: typeof record.processCount === 'number' ? record.processCount : record.allocation.length,
      resourceCount: typeof record.resourceCount === 'number' ? record.resourceCount : record.available.length,
      allocation: record.allocation,
      request: record.request,
      available: record.available,
    };
  }

  return normalizeLegacyConfig(record);
}

export { DEADLOCK_DEFAULTS };
