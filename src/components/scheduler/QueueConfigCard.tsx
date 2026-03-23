import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import { AlgorithmSelector } from "./AlgorithmSelector";
import { ProcessInputForm } from "./ProcessInputForm";
import type { AlgorithmType } from "@/types/scheduler";

interface QueueConfigCardProps {
  queueIndex: number;
  algorithm: AlgorithmType;
  onAlgorithmChange: (value: AlgorithmType) => void;
  arrivalTimesInput: string;
  onArrivalTimesChange: (value: string) => void;
  burstTimesInput: string;
  onBurstTimesChange: (value: string) => void;
  prioritiesInput: string;
  onPrioritiesChange: (value: string) => void;
  quantum: number;
  onQuantumChange: (value: number) => void;
  onRemove: () => void;
}

export function QueueConfigCard({
  queueIndex,
  algorithm,
  onAlgorithmChange,
  arrivalTimesInput,
  onArrivalTimesChange,
  burstTimesInput,
  onBurstTimesChange,
  prioritiesInput,
  onPrioritiesChange,
  quantum,
  onQuantumChange,
  onRemove,
}: QueueConfigCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Queue {queueIndex + 1}</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-6 w-6"
          title="Remove queue"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <AlgorithmSelector value={algorithm} onChange={onAlgorithmChange} />

        <ProcessInputForm
          algorithm={algorithm}
          arrivalTimesInput={arrivalTimesInput}
          onArrivalTimesChange={onArrivalTimesChange}
          burstTimesInput={burstTimesInput}
          onBurstTimesChange={onBurstTimesChange}
          prioritiesInput={prioritiesInput}
          onPrioritiesChange={onPrioritiesChange}
          quantum={quantum}
          onQuantumChange={onQuantumChange}
        />
      </CardContent>
    </Card>
  );
}
