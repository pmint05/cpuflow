import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Label } from '@components/ui/label';
import { MatrixInput } from '@presentation/components/shared/MatrixInput';
import { MatrixDisplay } from '@presentation/components/shared/MatrixDisplay';
import { StepViewer } from '@presentation/components/shared/StepViewer';
import { useDeadlockDetection } from '@app/deadlock-detection/useDeadlockDetection';
import {
  encodeDeadlockConfig,
  decodeDeadlockConfig,
} from '@infra/serializers/deadlock-config-serializer';
import { parseMatrixString, parseVectorString } from '@infra/parsers/matrix-parser';
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  SearchIcon,
  RotateCcwIcon,
  HomeIcon,
  AlertCircleIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function makeLabels(count: number, prefix: string) {
  return Array.from({ length: count }, (_, i) => `${prefix}${i}`);
}

function inferDimensions(allocationStr: string, availableStr: string) {
  const allocation = parseMatrixString(allocationStr);
  const available = parseVectorString(availableStr);
  if (!allocation || !available) return null;
  return { processCount: allocation.length, resourceCount: available.length };
}

// Use a 3-way circular deadlock as the default example:
// P0 holds R0 waits R1, P1 holds R1 waits R2, P2 holds R2 waits R0
const DEADLOCK_EXAMPLE = {
  allocation: '1,0,0\n0,1,0\n0,0,1',
  request: '0,1,0\n0,0,1\n1,0,0',
  available: '0,0,0',
};

export function DeadlockPage() {
  const [allocationStr, setAllocationStr] = useState(DEADLOCK_EXAMPLE.allocation);
  const [requestStr, setRequestStr] = useState(DEADLOCK_EXAMPLE.request);
  const [availableStr, setAvailableStr] = useState(DEADLOCK_EXAMPLE.available);

  const { input, result, error, detect, reset } = useDeadlockDetection();

  // URL persistence ──────────────────────────────────────────────
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (hasHydratedRef.current) return;
    hasHydratedRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const configParam = params.get('config');
    if (configParam) {
      const cfg = decodeDeadlockConfig(configParam);
      setAllocationStr(cfg.allocation);
      setRequestStr(cfg.request);
      setAvailableStr(cfg.available);
    }
  }, []);

  useEffect(() => {
    if (!hasHydratedRef.current) return;
    const encoded = encodeDeadlockConfig({ allocation: allocationStr, request: requestStr, available: availableStr });
    window.history.replaceState(null, '', `${window.location.pathname}?config=${encoded}`);
  }, [allocationStr, requestStr, availableStr]);

  // Actions ──────────────────────────────────────────────────────
  const handleDetect = useCallback(() => {
    detect({ allocationStr, requestStr, availableStr });
  }, [detect, allocationStr, requestStr, availableStr]);

  const handleReset = useCallback(() => {
    setAllocationStr(DEADLOCK_EXAMPLE.allocation);
    setRequestStr(DEADLOCK_EXAMPLE.request);
    setAvailableStr(DEADLOCK_EXAMPLE.available);
    reset();
    toast.info('Reset to defaults');
  }, [reset]);

  const handleCopyUrl = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => toast.success('URL copied!'));
  }, []);

  // Derived ──────────────────────────────────────────────────────
  const dims = inferDimensions(allocationStr, availableStr);
  const processCount = input?.processCount ?? dims?.processCount ?? 0;
  const resourceCount = input?.resourceCount ?? dims?.resourceCount ?? 0;
  const processLabels = makeLabels(processCount, 'P');
  const resourceLabels = makeLabels(resourceCount, 'R');

  return (
    <div className="p-4 lg:p-8">
      <div className="container mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link to="/" className="hover:text-foreground transition-colors flex items-center gap-1">
              <HomeIcon className="size-3.5" />Home
            </Link>
            <span>/</span>
            <span className="text-foreground">Deadlock Detection</span>
          </div>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <AlertTriangleIcon className="size-6 text-amber-500" />
                Deadlock Detection
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Identify deadlocked processes using resource-allocation graph reduction
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopyUrl} className="text-xs">
              Share URL
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ─── Left: Input Panel ─────────────────────────────── */}
          <div className="lg:sticky lg:top-[70px] lg:h-fit space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Input Matrices</CardTitle>
                {dims && (
                  <p className="text-xs text-muted-foreground">
                    {dims.processCount} processes · {dims.resourceCount} resource types
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-5">
                <MatrixInput
                  id="dl-allocation"
                  label="Allocation Matrix"
                  value={allocationStr}
                  onChange={setAllocationStr}
                  placeholder="1,0,0&#10;0,1,0&#10;0,0,1"
                  helperText="Resources currently held by each process"
                  minRows={3}
                />
                <MatrixInput
                  id="dl-request"
                  label="Request Matrix"
                  value={requestStr}
                  onChange={setRequestStr}
                  placeholder="0,1,0&#10;0,0,1&#10;1,0,0"
                  helperText="Resources each process is waiting for"
                  minRows={3}
                />
                <div className="space-y-1.5">
                  <Label htmlFor="dl-available" className="text-sm font-medium">
                    Available Vector
                  </Label>
                  <input
                    id="dl-available"
                    type="text"
                    value={availableStr}
                    onChange={(e) => setAvailableStr(e.target.value)}
                    placeholder="0,0,0"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground">Free unallocated resources</p>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs">
                    <AlertCircleIcon className="size-3.5 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button onClick={handleDetect} className="flex-1 gap-1.5">
                    <SearchIcon className="size-4" />
                    Detect
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleReset} title="Reset">
                    <RotateCcwIcon className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Info card */}
            <Card className="bg-muted/30">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">Algorithm:</span> Processes with zero
                  allocation are marked finished. The algorithm finds processes whose requests can be
                  satisfied by current work, marks them finished and releases their resources.
                  Processes still unmarked are <span className="text-destructive font-medium">deadlocked</span>.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ─── Right: Results Panel ──────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            {!result && !error && (
              <div className="flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed rounded-xl text-center text-muted-foreground p-8">
                <AlertTriangleIcon className="size-12 mb-4 opacity-20" />
                <p className="text-base font-medium mb-1">No results yet</p>
                <p className="text-sm">Fill in the matrices and click Detect</p>
              </div>
            )}

            {result && (
              <>
                {/* Detection Status */}
                <Card className={cn(
                  'border-2',
                  result.deadlocked ? 'border-destructive/40' : 'border-emerald-500/30'
                )}>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start gap-3 mb-4">
                      {result.deadlocked ? (
                        <AlertTriangleIcon className="size-8 text-destructive shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2Icon className="size-8 text-emerald-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="text-lg font-bold">
                          {result.deadlocked ? 'Deadlock Detected' : 'No Deadlock'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {result.deadlocked
                            ? `${result.deadlockedProcesses.length} process${result.deadlockedProcesses.length > 1 ? 'es' : ''} are deadlocked`
                            : 'All processes can complete successfully'}
                        </p>
                      </div>
                    </div>

                    {/* Process finish matrix */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {result.finish.map((finished, i) => (
                        <div
                          key={i}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-mono font-semibold',
                            finished
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-destructive/10 text-destructive'
                          )}
                        >
                          {finished ? (
                            <CheckCircle2Icon className="size-4 shrink-0" />
                          ) : (
                            <AlertTriangleIcon className="size-4 shrink-0" />
                          )}
                          {processLabels[i] ?? `P${i}`}
                          <span className="text-xs font-normal ml-auto">
                            {finished ? 'OK' : 'DEADLOCKED'}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Final Work vector */}
                    <div className="mt-4 pt-3 border-t">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Final Work Vector
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {result.work.map((v, j) => (
                          <div key={j} className="flex flex-col items-center gap-0.5">
                            <span className="text-[10px] text-muted-foreground font-mono">{resourceLabels[j] ?? `R${j}`}</span>
                            <span className="min-w-[32px] px-1.5 py-0.5 rounded text-center font-mono text-sm font-semibold bg-muted tabular-nums">
                              {v}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Allocation and Request matrices side by side */}
                {input && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Allocation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <MatrixDisplay
                          matrix={input.allocation}
                          rowLabels={processLabels}
                          colLabels={resourceLabels}
                          compact
                          cellClassName={(row, _, v) =>
                            result.deadlockedProcesses.includes(row)
                              ? v > 0 ? 'bg-destructive/15 text-destructive' : undefined
                              : undefined
                          }
                        />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Request</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <MatrixDisplay
                          matrix={input.request}
                          rowLabels={processLabels}
                          colLabels={resourceLabels}
                          compact
                          cellClassName={(row, _, v) =>
                            result.deadlockedProcesses.includes(row)
                              ? v > 0 ? 'bg-destructive/15 text-destructive' : undefined
                              : undefined
                          }
                        />
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Step Viewer */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Step-by-Step Detection Trace</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {result.steps.length} steps — shows Work vector and request evaluation
                    </p>
                  </CardHeader>
                  <CardContent>
                    <StepViewer
                      steps={result.steps}
                      processCount={processCount}
                      processLabels={processLabels}
                      resourceLabels={resourceLabels}
                      variant="deadlock"
                    />
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
