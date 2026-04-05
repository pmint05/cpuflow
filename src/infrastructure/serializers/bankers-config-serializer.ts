import { encodeBase64URL, decodeBase64URL } from './common-serializer';

// ============================================================
// Banker's Algorithm URL Config Serializer (TICKET-009)
// ============================================================

/** Shape stored in the URL for Banker's Algorithm page */
export interface BankersConfig {
  /** Allocation matrix as "row\nrow" where row is "a,b,c" */
  allocation: string;
  /** Max matrix in same format */
  max: string;
  /** Available vector as "a,b,c" */
  available: string;
  /** Optional: process ID to test request for (0-indexed) */
  requestProcessId?: number;
  /** Optional: request vector as "a,b,c" */
  requestVector?: string;
}

const BANKERS_DEFAULTS: BankersConfig = {
  allocation: '0,1,0\n2,0,0\n3,0,2\n2,1,1\n0,0,2',
  max:        '7,5,3\n3,2,2\n9,0,2\n2,2,2\n4,3,3',
  available:  '3,3,2',
};

export function encodeBankersConfig(config: BankersConfig): string {
  return encodeBase64URL(config);
}

export function decodeBankersConfig(encoded: string): BankersConfig {
  const parsed = decodeBase64URL<BankersConfig>(encoded);
  if (!parsed || typeof parsed !== 'object') return BANKERS_DEFAULTS;

  // Sanitize each field — fall back to default if missing
  return {
    allocation:        typeof parsed.allocation === 'string'        ? parsed.allocation        : BANKERS_DEFAULTS.allocation,
    max:               typeof parsed.max === 'string'               ? parsed.max               : BANKERS_DEFAULTS.max,
    available:         typeof parsed.available === 'string'         ? parsed.available         : BANKERS_DEFAULTS.available,
    requestProcessId:  typeof parsed.requestProcessId === 'number'  ? parsed.requestProcessId  : undefined,
    requestVector:     typeof parsed.requestVector === 'string'     ? parsed.requestVector     : undefined,
  };
}

export { BANKERS_DEFAULTS };
