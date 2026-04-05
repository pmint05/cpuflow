import { useState, useCallback } from 'react';
import type {
  DeadlockInput,
  DeadlockResult,
} from '@domain/types/resource-allocation';
import { detectDeadlock } from '@domain/algorithms/deadlock-detection/detect';
import { validateDeadlockInput } from '@domain/validators/deadlock-validators';
import { parseMatrixString, parseVectorString } from '@infra/parsers/matrix-parser';

// ============================================================
// useDeadlockDetection application hook (TICKET-019)
// ============================================================

export interface DeadlockInputStrings {
  allocationStr: string;
  requestStr: string;
  availableStr: string;
}

export interface DeadlockState {
  input: DeadlockInput | null;
  result: DeadlockResult | null;
  error: string | null;
  isCalculating: boolean;
}

export interface DeadlockActions {
  detect: (strings: DeadlockInputStrings) => void;
  reset: () => void;
}

const initialState: DeadlockState = {
  input: null,
  result: null,
  error: null,
  isCalculating: false,
};

export function useDeadlockDetection(): DeadlockState & DeadlockActions {
  const [state, setState] = useState<DeadlockState>(initialState);

  const detect = useCallback((strings: DeadlockInputStrings) => {
    setState((s) => ({ ...s, isCalculating: true, error: null }));

    const allocation = parseMatrixString(strings.allocationStr);
    const request = parseMatrixString(strings.requestStr);
    const available = parseVectorString(strings.availableStr);

    if (!allocation) {
      setState((s) => ({ ...s, isCalculating: false, error: 'Allocation: invalid matrix format' }));
      return;
    }
    if (!request) {
      setState((s) => ({ ...s, isCalculating: false, error: 'Request: invalid matrix format' }));
      return;
    }
    if (!available) {
      setState((s) => ({ ...s, isCalculating: false, error: 'Available: invalid vector format' }));
      return;
    }

    const processCount = allocation.length;
    const resourceCount = available.length;
    const input: DeadlockInput = { allocation, request, available, processCount, resourceCount };

    const validation = validateDeadlockInput(input);
    if (!validation.valid) {
      setState((s) => ({
        ...s,
        isCalculating: false,
        error: validation.errors.join('; '),
      }));
      return;
    }

    const result = detectDeadlock(input);
    setState({ input, result, error: null, isCalculating: false });
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return { ...state, detect, reset };
}
