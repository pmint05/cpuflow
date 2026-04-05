import { cn } from '@/lib/utils';
import type { StepTrace } from '@domain/types/resource-allocation';
import { CheckCircle2Icon, XCircleIcon, MinusCircleIcon } from 'lucide-react';

interface StepCardProps {
  step: StepTrace;
  processCount: number;
  processLabels: string[];
  resourceLabels: string[];
  /** 'banker' shows Need vector; 'deadlock' shows Request vector */
  variant?: 'banker' | 'deadlock';
}

function VectorChips({ values, labels, colorFn }: {
  values: number[];
  labels: string[];
  colorFn?: (i: number, v: number) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((v, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] text-muted-foreground font-mono">{labels[i] ?? `R${i}`}</span>
          <span
            className={cn(
              'min-w-[32px] px-1.5 py-0.5 rounded text-center font-mono text-sm font-semibold tabular-nums',
              colorFn?.(i, v) ?? 'bg-muted text-foreground'
            )}
          >
            {v}
          </span>
        </div>
      ))}
    </div>
  );
}

export function StepCard({ step, processCount, processLabels, resourceLabels, variant = 'banker' }: StepCardProps) {
  const isSummary = step.processId < 0;
  const needLabel = variant === 'banker' ? 'Need' : 'Request';

  return (
    <div className="space-y-4 p-4 rounded-xl border bg-card">
      {/* Action description */}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'shrink-0 mt-0.5 size-5 rounded-full flex items-center justify-center',
            isSummary
              ? step.canFinish
                ? 'bg-emerald-500/15 text-emerald-500'
                : 'bg-destructive/15 text-destructive'
              : step.finished
              ? 'bg-emerald-500/15 text-emerald-500'
              : step.canFinish
              ? 'bg-blue-500/15 text-blue-500'
              : 'bg-amber-500/15 text-amber-500'
          )}
        >
          {isSummary ? (
            step.canFinish ? (
              <CheckCircle2Icon className="size-3.5" />
            ) : (
              <XCircleIcon className="size-3.5" />
            )
          ) : step.finished ? (
            <CheckCircle2Icon className="size-3.5" />
          ) : step.canFinish ? (
            <CheckCircle2Icon className="size-3.5" />
          ) : (
            <MinusCircleIcon className="size-3.5" />
          )}
        </div>
        <p className="text-sm leading-relaxed">{step.action}</p>
      </div>

      {/* Work vector */}
      {step.work.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Work (Available)</p>
          <VectorChips
            values={step.work}
            labels={resourceLabels}
            colorFn={(_, v) => v > 0 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}
          />
        </div>
      )}

      {/* Process detail (when evaluating a specific process) */}
      {!isSummary && (
        <div className="grid grid-cols-2 gap-3">
          {step.need.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {needLabel} [{processLabels[step.processId] ?? `P${step.processId}`}]
              </p>
              <VectorChips
                values={step.need}
                labels={resourceLabels}
                colorFn={(i, v) =>
                  v <= (step.work[i] ?? 0)
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-destructive/15 text-destructive'
                }
              />
            </div>
          )}
          {step.allocation.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Allocation [{processLabels[step.processId] ?? `P${step.processId}`}]
              </p>
              <VectorChips
                values={step.allocation}
                labels={resourceLabels}
                colorFn={() => 'bg-blue-500/15 text-blue-600 dark:text-blue-400'}
              />
            </div>
          )}
        </div>
      )}

      {/* Finish flags */}
      {step.finishFlags.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Process Status</p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: processCount }, (_, i) => (
              <span
                key={i}
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-mono font-semibold',
                  !isSummary && step.processId === i
                    ? 'ring-2 ring-offset-1 ring-primary'
                    : '',
                  step.finishFlags[i]
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {processLabels[i] ?? `P${i}`}
                {step.finishFlags[i] ? ' ✓' : ''}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
