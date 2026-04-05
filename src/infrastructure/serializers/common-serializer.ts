// ============================================================
// Common base64 URL-safe serialization helpers (TICKET-009)
// ============================================================

/**
 * Encode a JSON-serializable value to a URL-safe base64 string.
 * Uses TextEncoder → btoa → replace +/= with URL-safe chars.
 */
export function encodeBase64URL(value: unknown): string {
  const json = JSON.stringify(value);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Decode a URL-safe base64 string back to a typed value.
 * Returns null if decoding or JSON parsing fails.
 */
export function decodeBase64URL<T>(value: string): T | null {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
