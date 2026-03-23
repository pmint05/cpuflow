import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface QuantumInputProps {
  value: number;
  onChange: (value: number) => void;
}

export function QuantumInput({ value, onChange }: QuantumInputProps) {
  return (
    <div className="space-y-2">
      <Label>Time Quantum</Label>
      <Input
        type="number"
        min="1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder="2"
      />
      <p className="text-xs text-muted-foreground">
        Time slice for each process in Round Robin algorithm
      </p>
    </div>
  );
}
