import { useState, useCallback } from 'react';
import type {
  ResourceAllocationInput,
  ResourceRequest,
  SafeSequenceResult,
  RequestResult,
} from '@domain/types/resource-allocation';
import { calculateNeedMatrix } from '@domain/algorithms/bankers-algorithm/calculate';
import { findSafeSequence } from '@domain/algorithms/bankers-algorithm/safe-sequence';
import { simulateRequest } from '@domain/algorithms/bankers-algorithm/request-simulator';
import { validateBankersInput, validateResourceRequest } from '@domain/validators/resource-allocation';
import { parseMatrixString, parseVectorString } from '@infra/parsers/matrix-parser';

// ============================================================
// useBankersAlgorithm application hook (TICKET-018)
// ============================================================

export interface BankersInputStrings {
  allocationStr: string;
  maxStr: string;
  availableStr: string;
}

export interface BankersState {
  /** Parsed & validated input (null until successfully parsed) */
  input: ResourceAllocationInput | null;
  /** Need matrix derived from input */
  need: number[][] | null;
  /** Safe sequence result */
  safeResult: SafeSequenceResult | null;
  /** Resource request test result */
  requestResult: RequestResult | null;
  /** Validation / parse errors */
  error: string | null;
  /** Whether a calculation is in progress */
  isCalculating: boolean;
}

export interface BankersActions {
  /** Parse inputs and run the safety algorithm */
  calculate: (strings: BankersInputStrings) => void;
  /** Test a resource request against the current state */
  testRequest: (processId: number, requestStr: string) => void;
  /** Clear all results and errors */
  reset: () => void;
}

const initialState: BankersState = {
  input: null,
  need: null,
  safeResult: null,
  requestResult: null,
  error: null,
  isCalculating: false,
};

export function useBankersAlgorithm(): BankersState & BankersActions {
  const [state, setState] = useState<BankersState>(initialState);

  const calculate = useCallback((strings: BankersInputStrings) => {
    setState((s) => ({ ...s, isCalculating: true, error: null }));

    // Parse matrices
    const allocation = parseMatrixString(strings.allocationStr);
    const max = parseMatrixString(strings.maxStr);
    const available = parseVectorString(strings.availableStr);

    if (!allocation) {
      setState((s) => ({ ...s, isCalculating: false, error: 'Allocation: invalid matrix format' }));
      return;
    }
    if (!max) {
      setState((s) => ({ ...s, isCalculating: false, error: 'Max: invalid matrix format' }));
      return;
    }
    if (!available) {
      setState((s) => ({ ...s, isCalculating: false, error: 'Available: invalid vector format' }));
      return;
    }

    // Derive counts from parsed matrices
    const processCount = allocation.length;
    const resourceCount = available.length;

    const input: ResourceAllocationInput = { allocation, max, available, processCount, resourceCount };

    // Validate domain rules
    const validation = validateBankersInput(input);
    if (!validation.valid) {
      setState((s) => ({
        ...s,
        isCalculating: false,
        error: validation.errors.join('; '),
      }));
      return;
    }

    const need = calculateNeedMatrix(allocation, max);
    const safeResult = findSafeSequence(allocation, need, available);

    setState({
      input,
      need,
      safeResult,
      requestResult: null,
      error: null,
      isCalculating: false,
    });
  }, []);

  const testRequest = useCallback(
    (processId: number, requestStr: string) => {
      setState((s) => {
        if (!s.input || !s.need) {
          return { ...s, error: 'Run Calculate first before testing a request' };
        }

        const request = parseVectorString(requestStr);
        if (!request) {
          return { ...s, error: 'Request: invalid vector format' };
        }

        // Validate request
        const reqObj: ResourceRequest = { processId, request };
        const validation = validateResourceRequest(
          reqObj,
          s.need,
          s.input.available,
          s.input.processCount,
          s.input.resourceCount
        );
        if (!validation.valid) {
          return { ...s, error: validation.errors.join('; ') };
        }

        const requestResult = simulateRequest(s.input, reqObj);
        return { ...s, requestResult, error: null };
      });
    },
    []
  );

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return { ...state, calculate, testRequest, reset };
}
