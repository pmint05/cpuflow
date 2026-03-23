import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PriorityInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function PriorityInput({ value, onChange }: PriorityInputProps) {
  return (
    <div className="space-y-2">
      <Label>Priorities</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="2, 1, 3"
      />
      <p className="text-xs text-muted-foreground">
        Lower number = higher priority (0 is highest priority)
      </p>
    </div>
  );
}
