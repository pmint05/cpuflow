import { RadioGroup, RadioGroupItem } from '@components/ui/radio-group';
import { Label } from '@components/ui/label';
import type { ProcessNameTemplate } from '@domain/types/cpu-scheduling';

interface ProcessNameTemplateSelectorProps {
  value: ProcessNameTemplate;
  onChange: (value: ProcessNameTemplate) => void;
}

const templates: { value: ProcessNameTemplate; label: string; example: string }[] = [
  { value: 'P_i', label: 'P_i', example: 'P1, P2, P3,...' },
  { value: 'ABC', label: 'Letters', example: 'A, B, C,...' },
  { value: '123', label: 'Numbers', example: '1, 2, 3,...' },
];

export function ProcessNameTemplateSelector({
  value,
  onChange,
}: ProcessNameTemplateSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Process Names</Label>
      <RadioGroup
        value={value}
        onValueChange={(newValue) => onChange(newValue as ProcessNameTemplate)}
        className="flex flex-col gap-4"
      >
        {templates.map((template) => (
          <div key={template.value} className="flex items-center gap-2">
            <RadioGroupItem value={template.value} id={template.value} />
            <Label htmlFor={template.value} className="cursor-pointer">
              <span className="font-medium">{template.label}</span>
              <span className="text-xs text-muted-foreground ml-1">
                {template.example}
              </span>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
