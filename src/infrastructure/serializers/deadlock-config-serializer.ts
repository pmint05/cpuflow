import { encodeBase64URL, decodeBase64URL } from './common-serializer';

// ============================================================
// Deadlock Detection URL Config Serializer (TICKET-009)
// ============================================================

/** Shape stored in the URL for Deadlock Detection page */
export interface DeadlockConfig {
  /** Allocation matrix as "row\nrow" where row is "a,b,c" */
  allocation: string;
  /** Request matrix in same format */
  request: string;
  /** Available vector as "a,b,c" */
  available: string;
}

const DEADLOCK_DEFAULTS: DeadlockConfig = {
  allocation: '0,1,0\n2,0,0\n3,0,2',
  request:    '0,0,0\n2,0,2\n0,0,0',
  available:  '0,0,0',
};

export function encodeDeadlockConfig(config: DeadlockConfig): string {
  return encodeBase64URL(config);
}

export function decodeDeadlockConfig(encoded: string): DeadlockConfig {
  const parsed = decodeBase64URL<DeadlockConfig>(encoded);
  if (!parsed || typeof parsed !== 'object') return DEADLOCK_DEFAULTS;

  return {
    allocation: typeof parsed.allocation === 'string' ? parsed.allocation : DEADLOCK_DEFAULTS.allocation,
    request:    typeof parsed.request === 'string'    ? parsed.request    : DEADLOCK_DEFAULTS.request,
    available:  typeof parsed.available === 'string'  ? parsed.available  : DEADLOCK_DEFAULTS.available,
  };
}

export { DEADLOCK_DEFAULTS };
