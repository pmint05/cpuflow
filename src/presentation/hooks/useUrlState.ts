import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

// ============================================================
// useUrlState — Generic URL query param state hook (TICKET-020)
// ============================================================

/**
 * Bidirectional URL search parameter ↔ React state sync.
 *
 * On mount:  reads `key` from search params → deserializes → sets value
 * On change: serializes value → writes to search params (replaceState)
 *
 * @param key          The URL query param name
 * @param encode       Convert T to string for URL storage
 * @param decode       Convert string from URL to T, return null on failure
 * @param defaultValue Used when param is absent or decoding fails
 * @param debounceMs   Delay before flushing URL update (default 300ms)
 */
export function useUrlState<T>(
  key: string,
  encode: (value: T) => string,
  decode: (raw: string) => T | null,
  defaultValue: T,
  debounceMs = 300
): [T, (value: T) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const initializedRef = useRef(false);

  // Decode initial value from URL
  const getInitialValue = useCallback((): T => {
    const raw = searchParams.get(key);
    if (!raw) return defaultValue;
    const decoded = decode(raw);
    return decoded ?? defaultValue;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [value, setValueState] = useState<T>(getInitialValue);

  // On mount: hydrate from URL
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const raw = searchParams.get(key);
    if (raw) {
      const decoded = decode(raw);
      if (decoded !== null) setValueState(decoded);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced URL update when value changes
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!initializedRef.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(key, encode(value));
          return next;
        },
        { replace: true }
      );
    }, debounceMs);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, key, encode, debounceMs, setSearchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const setValue = useCallback((newValue: T) => {
    setValueState(newValue);
  }, []);

  return [value, setValue];
}
