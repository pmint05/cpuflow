import { useMemo } from 'react';
import { Label } from '@components/ui/label';
import { cn } from '@/lib/utils';
import { parseMatrixString } from '@infra/parsers/matrix-parser';

interface MatrixInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  errorMessage?: string | null;
  minRows?: number;
  className?: string;
  id?: string;
}

export function MatrixInput({
  label,
  value,
  onChange,
  placeholder,
  helperText,
  errorMessage,
  minRows = 4,
  className,
  id,
}: MatrixInputProps) {
  const dimensions = useMemo(() => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = parseMatrixString(trimmed);
    if (!parsed || parsed.length === 0) return null;
    return { rows: parsed.length, cols: parsed[0].length };
  }, [value]);

  const isInvalid = !!errorMessage;

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {dimensions && !isInvalid && (
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {dimensions.rows} × {dimensions.cols}
          </span>
        )}
        {isInvalid && (
          <span className="text-xs text-destructive font-medium">invalid</span>
        )}
      </div>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={minRows}
        spellCheck={false}
        className={cn(
          'w-full resize-none rounded-md border bg-background px-3 py-2',
          'font-mono text-sm leading-5',
          'placeholder:text-muted-foreground/50',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0',
          'transition-colors',
          isInvalid
            ? 'border-destructive focus:ring-destructive/30'
            : 'border-input hover:border-primary/50'
        )}
      />
      {isInvalid && (
        <p className="text-xs text-destructive">{errorMessage}</p>
      )}
      {!isInvalid && helperText && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}
