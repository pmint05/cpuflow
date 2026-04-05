import { cn } from '@/lib/utils';

interface MatrixDisplayProps {
  matrix: number[][];
  rowLabels?: string[];
  colLabels?: string[];
  /** 0-indexed row to highlight (e.g. current process in step viewer) */
  activeRow?: number;
  /** Custom class per cell; receives (row, col, value) */
  cellClassName?: (row: number, col: number, value: number) => string | undefined;
  title?: string;
  compact?: boolean;
  className?: string;
}

export function MatrixDisplay({
  matrix,
  rowLabels,
  colLabels,
  activeRow,
  cellClassName,
  title,
  compact = false,
  className,
}: MatrixDisplayProps) {
  if (!matrix || matrix.length === 0) return null;

  const cellPad = compact ? 'px-2 py-1' : 'px-3 py-1.5';
  const headerPad = compact ? 'px-2 py-1' : 'px-3 py-1.5';
  const textSize = compact ? 'text-xs' : 'text-sm';

  return (
    <div className={cn('overflow-x-auto', className)}>
      {title && (
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          {title}
        </p>
      )}
      <table className={cn('border-collapse', textSize)}>
        {colLabels && (
          <thead>
            <tr>
              {/* corner empty cell */}
              {rowLabels && <th className={cn(headerPad, 'text-muted-foreground font-mono')} />}
              {colLabels.map((col) => (
                <th
                  key={col}
                  className={cn(
                    headerPad,
                    'font-mono font-semibold text-muted-foreground text-center'
                  )}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {matrix.map((row, i) => (
            <tr
              key={i}
              className={cn(
                'transition-colors',
                i === activeRow
                  ? 'bg-primary/10 rounded'
                  : i % 2 === 0
                  ? 'bg-muted/20'
                  : ''
              )}
            >
              {rowLabels && (
                <th
                  className={cn(
                    headerPad,
                    'font-mono font-semibold text-left',
                    i === activeRow ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {rowLabels[i] ?? `P${i}`}
                </th>
              )}
              {row.map((val, j) => (
                <td
                  key={j}
                  className={cn(
                    cellPad,
                    'font-mono text-center tabular-nums',
                    'border border-border/30 rounded',
                    cellClassName?.(i, j, val)
                  )}
                >
                  {val}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
