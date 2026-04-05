import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Label } from '@components/ui/label';
import { Separator } from '@components/ui/separator';
import { MatrixInput } from '@presentation/components/shared/MatrixInput';
import { MatrixDisplay } from '@presentation/components/shared/MatrixDisplay';
import { StepViewer } from '@presentation/components/shared/StepViewer';
import { useBankersAlgorithm } from '@app/bankers-algorithm/useBankersAlgorithm';
import {
  encodeBankersConfig,
  decodeBankersConfig,
  BANKERS_DEFAULTS,
} from '@infra/serializers/bankers-config-serializer';
import { parseMatrixString, parseVectorString } from '@infra/parsers/matrix-parser';
import {
  ShieldCheckIcon,
  ShieldXIcon,
  ArrowRightIcon,
  CalculatorIcon,
  RotateCcwIcon,
  InfoIcon,
  HomeIcon,
  AlertCircleIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ================================================================
// Helpers
// ================================================================

function makeLabels(count: number, prefix: string) {
  return Array.from({ length: count }, (_, i) => `${prefix}${i}`);
}

function inferDimensions(allocationStr: string, availableStr: string) {
  const allocation = parseMatrixString(allocationStr);
  const available = parseVectorString(availableStr);
  if (!allocation || !available) return null;
  return { processCount: allocation.length, resourceCount: available.length };
}

// ================================================================
// BankersPage
// ================================================================

export function BankersPage() {
  // ── Input state ────────────────────────────────────────────────
  const [allocationStr, setAllocationStr] = useState(BANKERS_DEFAULTS.allocation);
  const [maxStr, setMaxStr] = useState(BANKERS_DEFAULTS.max);
  const [availableStr, setAvailableStr] = useState(BANKERS_DEFAULTS.available);

  // ── Request section ────────────────────────────────────────────
  const [showRequest, setShowRequest] = useState(false);
  const [requestProcessId, setRequestProcessId] = useState(0);
  const [requestStr, setRequestStr] = useState('');

  // ── Hook ───────────────────────────────────────────────────────
  const { input, need, safeResult, requestResult, error, calculate, testRequest, reset } =
    useBankersAlgorithm();

  // ── URL persistence ────────────────────────────────────────────
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (hasHydratedRef.current) return;
    hasHydratedRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const configParam = params.get('config');
    if (configParam) {
      const cfg = decodeBankersConfig(configParam);
      setAllocationStr(cfg.allocation);
      setMaxStr(cfg.max);
      setAvailableStr(cfg.available);
      if (cfg.requestProcessId !== undefined) setRequestProcessId(cfg.requestProcessId);
      if (cfg.requestVector) { setRequestStr(cfg.requestVector); setShowRequest(true); }
    }
  }, []);

  useEffect(() => {
    if (!hasHydratedRef.current) return;
    const encoded = encodeBankersConfig({
      allocation: allocationStr,
      max: maxStr,
      available: availableStr,
      requestProcessId: showRequest ? requestProcessId : undefined,
      requestVector: showRequest ? requestStr : undefined,
    });
    window.history.replaceState(null, '', `${window.location.pathname}?config=${encoded}`);
  }, [allocationStr, maxStr, availableStr, showRequest, requestProcessId, requestStr]);

  // ── Actions ────────────────────────────────────────────────────
  const handleCalculate = useCallback(() => {
    calculate({ allocationStr, maxStr, availableStr });
  }, [calculate, allocationStr, maxStr, availableStr]);

  const handleTestRequest = useCallback(() => {
    testRequest(requestProcessId, requestStr);
  }, [testRequest, requestProcessId, requestStr]);

  const handleReset = useCallback(() => {
    setAllocationStr(BANKERS_DEFAULTS.allocation);
    setMaxStr(BANKERS_DEFAULTS.max);
    setAvailableStr(BANKERS_DEFAULTS.available);
    setRequestStr('');
    setShowRequest(false);
    setRequestProcessId(0);
    reset();
    toast.info('Reset to defaults');
  }, [reset]);

  // Copy shareable URL
  const handleCopyUrl = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => toast.success('URL copied!'));
  }, []);

  // ── Derived ────────────────────────────────────────────────────
  const dims = inferDimensions(allocationStr, availableStr);
  const processCount = input?.processCount ?? dims?.processCount ?? 0;
  const resourceCount = input?.resourceCount ?? dims?.resourceCount ?? 0;
  const processLabels = makeLabels(processCount, 'P');
  const resourceLabels = makeLabels(resourceCount, 'R');

  const needMatrixForDisplay =
    need ?? ((): number[][] | null => {
      const a = parseMatrixString(allocationStr);
      const m = parseMatrixString(maxStr);
      if (!a || !m || a.length !== m.length) return null;
      return a.map((row, i) => row.map((v, j) => (m[i]?.[j] ?? 0) - v));
    })();

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
            <span className="text-foreground">Banker's Algorithm</span>
          </div>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ShieldCheckIcon className="size-6 text-emerald-500" />
                Banker's Algorithm
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Deadlock avoidance — find safe sequences and evaluate resource requests
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
                    {dims.processCount} processes · {dims.resourceCount} resources
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-5">
                <MatrixInput
                  id="allocation"
                  label="Allocation Matrix"
                  value={allocationStr}
                  onChange={setAllocationStr}
                  placeholder="0,1,0&#10;2,0,0&#10;3,0,2"
                  helperText="Each row = one process; values = held resources"
                  minRows={4}
                />
                <MatrixInput
                  id="max"
                  label="Max Matrix"
                  value={maxStr}
                  onChange={setMaxStr}
                  placeholder="7,5,3&#10;3,2,2&#10;9,0,2"
                  helperText="Max resources each process may claim"
                  minRows={4}
                />
                <div className="space-y-1.5">
                  <Label htmlFor="available" className="text-sm font-medium">
                    Available Vector
                  </Label>
                  <input
                    id="available"
                    type="text"
                    value={availableStr}
                    onChange={(e) => setAvailableStr(e.target.value)}
                    placeholder="3,3,2"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground">Free resources of each type</p>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs">
                    <AlertCircleIcon className="size-3.5 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button onClick={handleCalculate} className="flex-1 gap-1.5">
                    <CalculatorIcon className="size-4" />
                    Calculate
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleReset} title="Reset">
                    <RotateCcwIcon className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Request Test Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Test a Request</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setShowRequest((v) => !v)}
                    disabled={!input}
                  >
                    {showRequest ? 'Hide' : 'Show'}
                  </Button>
                </div>
              </CardHeader>
              {showRequest && input && (
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Process</Label>
                    <select
                      value={requestProcessId}
                      onChange={(e) => setRequestProcessId(Number(e.target.value))}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {processLabels.map((label, i) => (
                        <option key={i} value={i}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Request Vector</Label>
                    <input
                      type="text"
                      value={requestStr}
                      onChange={(e) => setRequestStr(e.target.value)}
                      placeholder={`0,${resourceLabels.slice(1).map(() => '0').join(',')}`}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <p className="text-xs text-muted-foreground">
                      Resources {processLabels[requestProcessId]} is requesting
                    </p>
                  </div>
                  <Button onClick={handleTestRequest} className="w-full gap-1.5" variant="secondary">
                    Test Request
                  </Button>
                </CardContent>
              )}
              {!input && (
                <CardContent>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <InfoIcon className="size-3.5" />
                    Run Calculate first
                  </p>
                </CardContent>
              )}
            </Card>
          </div>

          {/* ─── Right: Results Panel ──────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            {!safeResult && !error && (
              <div className="flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed rounded-xl text-center text-muted-foreground p-8">
                <ShieldCheckIcon className="size-12 mb-4 opacity-20" />
                <p className="text-base font-medium mb-1">No results yet</p>
                <p className="text-sm">Fill in the matrices and click Calculate</p>
              </div>
            )}

            {safeResult && (
              <>
                {/* Safety Status */}
                <Card className={cn(
                  'border-2',
                  safeResult.safe ? 'border-emerald-500/30' : 'border-destructive/30'
                )}>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center gap-3 mb-3">
                      {safeResult.safe ? (
                        <ShieldCheckIcon className="size-8 text-emerald-500" />
                      ) : (
                        <ShieldXIcon className="size-8 text-destructive" />
                      )}
                      <div>
                        <p className="text-lg font-bold">
                          {safeResult.safe ? 'Safe State' : 'Unsafe State'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {safeResult.safe
                            ? 'A safe sequence exists — no deadlock possible'
                            : 'No safe sequence found — potential deadlock'}
                        </p>
                      </div>
                    </div>

                    {safeResult.safe && safeResult.sequence.length > 0 && (
                      <>
                        <Separator className="my-3" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                            Safe Sequence
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {safeResult.sequence.map((pid, idx) => (
                              <span key={idx} className="flex items-center gap-1">
                                <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-sm font-mono font-semibold">
                                  P{pid}
                                </span>
                                {idx < safeResult.sequence.length - 1 && (
                                  <ArrowRightIcon className="size-3.5 text-muted-foreground" />
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Need Matrix */}
                {needMatrixForDisplay && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Need Matrix</CardTitle>
                      <p className="text-xs text-muted-foreground">Need[i][j] = Max[i][j] − Allocation[i][j]</p>
                    </CardHeader>
                    <CardContent>
                      <MatrixDisplay
                        matrix={needMatrixForDisplay}
                        rowLabels={processLabels}
                        colLabels={resourceLabels}
                        cellClassName={(_, __, v) =>
                          v === 0 ? 'text-muted-foreground' : undefined
                        }
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Step Viewer */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Step-by-Step Trace</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {safeResult.steps.length} steps — shows Work vector progression
                    </p>
                  </CardHeader>
                  <CardContent>
                    <StepViewer
                      steps={safeResult.steps}
                      processCount={processCount}
                      processLabels={processLabels}
                      resourceLabels={resourceLabels}
                      variant="banker"
                    />
                  </CardContent>
                </Card>
              </>
            )}

            {/* Request Result */}
            {requestResult && (
              <Card className={cn(
                'border-2',
                requestResult.granted ? 'border-emerald-500/30' : 'border-amber-500/30'
              )}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Request Result</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'px-3 py-1 rounded-full text-sm font-semibold',
                        requestResult.granted
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      )}
                    >
                      {requestResult.granted ? '✓ Request Granted' : '✗ Request Denied'}
                    </span>
                  </div>
                  {requestResult.reason && (
                    <p className="text-sm text-muted-foreground">{requestResult.reason}</p>
                  )}
                  {requestResult.granted && requestResult.newState && (
                    <div className="space-y-2 pt-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        New Safe Sequence After Grant
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {requestResult.newState.safeSequenceResult.sequence.map((pid, idx, arr) => (
                          <span key={idx} className="flex items-center gap-1">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-semibold">
                              P{pid}
                            </span>
                            {idx < arr.length - 1 && <ArrowRightIcon className="size-3 text-muted-foreground" />}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
