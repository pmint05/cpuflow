import type { AlgorithmType } from '@domain/types/cpu-scheduling';
import { DynamicFieldArray } from './DynamicFieldArray';
import { QuantumInput } from './QuantumInput';
import { PriorityInput } from './PriorityInput';
import { requiresQuantum, requiresPriority } from '@domain/algorithms/cpu-scheduling';

interface ProcessInputFormProps {
  algorithm: AlgorithmType;
  arrivalTimesInput: string;
  onArrivalTimesChange: (value: string) => void;
  burstTimesInput: string;
  onBurstTimesChange: (value: string) => void;
  prioritiesInput: string;
  onPrioritiesChange: (value: string) => void;
  quantum: number;
  onQuantumChange: (value: number) => void;
}

export function ProcessInputForm({
  algorithm,
  arrivalTimesInput,
  onArrivalTimesChange,
  burstTimesInput,
  onBurstTimesChange,
  prioritiesInput,
  onPrioritiesChange,
  quantum,
  onQuantumChange,
}: ProcessInputFormProps) {
  const showQuantum = requiresQuantum(algorithm);
  const showPriority = requiresPriority(algorithm);

  return (
    <div className="space-y-4">
      <DynamicFieldArray
        label="Arrival Times"
        value={arrivalTimesInput}
        onChange={onArrivalTimesChange}
        placeholder="0, 1, 2"
        description="Enter arrival times separated by commas or spaces"
      />

      <DynamicFieldArray
        label="Burst Times"
        value={burstTimesInput}
        onChange={onBurstTimesChange}
        placeholder="4, 3, 2"
        description="Enter burst times separated by commas or spaces"
      />

      {showPriority && (
        <PriorityInput value={prioritiesInput} onChange={onPrioritiesChange} />
      )}

      {showQuantum && <QuantumInput value={quantum} onChange={onQuantumChange} />}
    </div>
  );
}
