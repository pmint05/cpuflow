import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';
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

  const visibleColumnCount =
    colLabels?.length ?? matrix.reduce((max, row) => Math.max(max, row.length), 0);

  const cellPad = compact ? 'px-2 py-1' : 'px-3 py-1.5';
  const headerPad = compact ? 'px-2 py-1' : 'px-3 py-1.5';
  const textSize = compact ? 'text-xs' : 'text-sm';

  return (
    <div className={cn('overflow-auto rounded-lg border', className)}>
      {title && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
      )}
      <Table className={cn('min-w-max border-separate border-spacing-0', textSize)}>
        <TableHeader>
          <TableRow>
            {rowLabels && (
              <TableHead
                className={cn(
                  headerPad,
                  'sticky left-0 top-0 z-30 bg-background font-mono text-muted-foreground',
                )}
              />
            )}
            {colLabels?.map((col) => (
              <TableHead
                key={col}
                className={cn(
                  headerPad,
                  'sticky top-0 z-20 bg-background font-mono font-semibold text-muted-foreground text-center',
                )}
              >
                {col}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {matrix.map((row, i) => (
            <TableRow
              key={i}
              className={cn(
                'transition-colors',
                i === activeRow
                  ? 'bg-primary/10'
                  : i % 2 === 0
                  ? 'bg-muted/20'
                  : '',
              )}
            >
              {rowLabels && (
                <TableHead
                  scope="row"
                  className={cn(
                    headerPad,
                    'sticky left-0 z-10 bg-inherit font-mono font-semibold text-left',
                    i === activeRow ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {rowLabels[i] ?? `P${i}`}
                </TableHead>
              )}
              {Array.from({ length: visibleColumnCount }, (_, j) => row[j] ?? 0).map((val, j) => (
                <TableCell
                  key={j}
                  className={cn(
                    cellPad,
                    'bg-inherit font-mono text-center tabular-nums border border-border/30',
                    cellClassName?.(i, j, val),
                  )}
                >
                  {val}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
