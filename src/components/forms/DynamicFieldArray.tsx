import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DynamicFieldArrayProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
}

export function DynamicFieldArray({
  label,
  value,
  onChange,
  placeholder = '0, 1, 2',
  description,
}: DynamicFieldArrayProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
