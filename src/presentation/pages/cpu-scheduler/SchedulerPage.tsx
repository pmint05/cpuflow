import { useEffect, useRef, useState } from 'react';
import { useScheduler } from '@app/cpu-scheduler/useScheduler';
import { useProcessInput } from '@presentation/hooks/useProcessInput';
import { ConfigSection } from './ConfigSection';
import { ResultsSection } from './ResultsSection';
import { requiresPriority } from '@domain/algorithms/cpu-scheduling';
import { toast } from 'sonner';
import type {
  AlgorithmType,
  ProcessAnnotationMode,
  ProcessNameTemplate,
  TimeLabelRenderMode,
} from '@domain/types/cpu-scheduling';
import type { QueueData } from './MultiQueueConfig';

const ALGORITHM_VALUES: AlgorithmType[] = [
  'FCFS',
  'SJF_PREEMPTIVE',
  'SJF_NON_PREEMPTIVE',
  'ROUND_ROBIN',
  'PRIORITY_PREEMPTIVE',
  'PRIORITY_NON_PREEMPTIVE',
  'MULTI_LEVEL_QUEUE',
];

const NAME_TEMPLATE_VALUES: ProcessNameTemplate[] = ['P_i', 'ABC', '123'];

const PROCESS_ANNOTATION_MODE_VALUES: ProcessAnnotationMode[] = [
  'POINTER_LEVELING',
  'POINTER_FIRST_ONLY',
  'LEGEND',
  'HIDDEN',
];

const TIME_LABEL_RENDER_MODE_VALUES: TimeLabelRenderMode[] = [
  'MAJOR_ONLY',
  'LINE_LEVELING',
  'FORCE_SHRINK',
];

function serializeQueuesForUrl(queues: QueueData[]): string {
  const payload = JSON.stringify(
    queues.map((queue) => ({
      id: queue.id,
      algorithm: queue.algorithm,
      arrivalTimesInput: queue.arrivalTimesInput,
      burstTimesInput: queue.burstTimesInput,
      prioritiesInput: queue.prioritiesInput,
      quantum: queue.quantum,
    }))
  );

  return encodeToBase64Url(payload);
}

function encodeToBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeFromBase64Url(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

function sanitizeQueues(parsed: unknown): QueueData[] {
  if (!Array.isArray(parsed)) return [];

  const queues: QueueData[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const queue = parsed[i] as Partial<QueueData>;
    const id = typeof queue.id === 'string' ? queue.id : null;
    const algorithm = typeof queue.algorithm === 'string' ? queue.algorithm : null;
    const arrivalTimesInput =
      typeof queue.arrivalTimesInput === 'string' ? queue.arrivalTimesInput : null;
    const burstTimesInput =
      typeof queue.burstTimesInput === 'string' ? queue.burstTimesInput : null;
    const prioritiesInput =
      typeof queue.prioritiesInput === 'string' ? queue.prioritiesInput : null;

    if (
      !id ||
      !algorithm ||
      arrivalTimesInput === null ||
      burstTimesInput === null ||
      prioritiesInput === null ||
      !ALGORITHM_VALUES.includes(algorithm as AlgorithmType)
    ) {
      continue;
    }

    queues.push({
      id,
      algorithm: algorithm as AlgorithmType,
      arrivalTimesInput,
      burstTimesInput,
      prioritiesInput,
      quantum:
        typeof queue.quantum === 'number' && Number.isFinite(queue.quantum)
          ? queue.quantum
          : 2,
    });
  }

  return queues;
}

function deserializeQueuesFromUrl(value: string | null): QueueData[] {
  if (!value) return [];

  try {
    const decoded = decodeFromBase64Url(value);
    if (decoded) {
      try {
        return sanitizeQueues(JSON.parse(decoded));
      } catch {
        // Continue to raw JSON fallback for legacy/non-encoded payloads.
      }
    }

    // Backward compatibility for previous links that stored raw JSON.
    return sanitizeQueues(JSON.parse(value));
  } catch {
    return [];
  }
}

function parseModeConfigFromUrl(value: string | null): Record<string, unknown> | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getStringFromConfig(
  config: Record<string, unknown> | null,
  keys: readonly string[]
): string | null {
  if (!config) return null;
  for (const key of keys) {
    const value = config[key];
    if (typeof value === 'string') {
      return value;
    }
  }
  return null;
}

function getNumberFromConfig(
  config: Record<string, unknown> | null,
  keys: readonly string[]
): number | null {
  if (!config) return null;
  for (const key of keys) {
    const value = config[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return null;
}

function getBooleanFromConfig(
  config: Record<string, unknown> | null,
  keys: readonly string[]
): boolean | null {
  if (!config) return null;
  for (const key of keys) {
    const value = config[key];
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      if (value === '1' || value.toLowerCase() === 'true') return true;
      if (value === '0' || value.toLowerCase() === 'false') return false;
    }
  }
  return null;
}

function getQueuesFromConfig(
  config: Record<string, unknown> | null,
  keys: readonly string[]
): QueueData[] {
  if (!config) return [];
  for (const key of keys) {
    if (key in config) {
      return sanitizeQueues(config[key]);
    }
  }
  return [];
}

function asBoolean(value: string | null, fallback: boolean): boolean {
  if (value === null) return fallback;
  if (value === '1' || value.toLowerCase() === 'true') return true;
  if (value === '0' || value.toLowerCase() === 'false') return false;
  return fallback;
}

function asNumber(value: string | null, fallback: number): number {
  if (value === null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asEnumValue<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T
): T {
  if (!value) return fallback;
  return allowed.includes(value as T) ? (value as T) : fallback;
}

const MODE_VALUES = ['single', 'multi'] as const;

export function SchedulerPage() {
  const {
    algorithm,
    setAlgorithm,
    quantum,
    setQuantum,
    nameTemplate,
    setNameTemplate,
    result,
    setProcesses,
    calculateWithProcesses,
    multiQueueResult,
    calculateMultiQueue,
    reset,
  } = useScheduler();

  const {
    arrivalTimesInput,
    setArrivalTimesInput,
    burstTimesInput,
    setBurstTimesInput,
    prioritiesInput,
    setPrioritiesInput,
    parseInputs,
    validateInputs,
  } = useProcessInput();

  // Colorful chart state
  const [colorful, setColorful] = useState(true);
  // Dark mode for canvas
  const [darkMode, setDarkMode] = useState(false);
  const [processAnnotationMode, setProcessAnnotationMode] =
    useState<ProcessAnnotationMode>('POINTER_LEVELING');
  const [timeLabelRenderMode, setTimeLabelRenderMode] =
    useState<TimeLabelRenderMode>('LINE_LEVELING');
  const [allowProcessNameInBlock, setAllowProcessNameInBlock] = useState(true);
  
  // Multi-queue mode state
  const [multiQueueMode, setMultiQueueMode] = useState(false);
  const [multiQueues, setMultiQueues] = useState<QueueData[]>([]);
  const [multiQueueNameTemplate, setMultiQueueNameTemplate] =
    useState<ProcessNameTemplate>('P_i');
  const [showQueueAnnotation, setShowQueueAnnotation] = useState(false);
  
  const hasHydratedFromQueryRef = useRef(false);
  const shouldAutoCalculateRef = useRef(false);
  const hydrationTargetRef = useRef<{
    algorithm: AlgorithmType;
    nameTemplate: ProcessNameTemplate;
    quantum: number;
    arrivalTimesInput: string;
    burstTimesInput: string;
    prioritiesInput: string;
    multiQueueMode: boolean;
    multiQueueNameTemplate: ProcessNameTemplate;
    showQueueAnnotation: boolean;
    queuesSerialized: string;
  } | null>(null);

  const runCalculation = (showToast: boolean): boolean => {
    // Handle multi-queue mode
    if (multiQueueMode) {
      if (multiQueues.length === 0) {
        if (showToast) {
          toast.error('Add at least one queue');
        }
        return false;
      }

      // Validate all queues
      const validQueues = multiQueues.map((queue) => {
        const showPriority = requiresPriority(queue.algorithm);
        const validation = validateInputs(showPriority, false, queue.arrivalTimesInput, queue.burstTimesInput, queue.prioritiesInput);
        return { queue, validation };
      });

      const invalidQueue = validQueues.find((q) => !q.validation.valid);
      if (invalidQueue) {
        if (showToast) {
          toast.error(
            `Queue ${multiQueues.indexOf(invalidQueue.queue) + 1}: ${invalidQueue.validation.error || 'Invalid input'}`
          );
        }
        return false;
      }

      // Parse processes for all queues
      const parseQueueInputs = (
        arrivalTimesInput: string,
        burstTimesInput: string,
        prioritiesInput: string,
        showPriority: boolean
      ) => {
        const arrivalTimes = arrivalTimesInput
          .split(/[,\s]+/)
          .filter((v) => v.trim())
          .map((v) => parseFloat(v))
          .filter((v) => !isNaN(v));

        const burstTimes = burstTimesInput
          .split(/[,\s]+/)
          .filter((v) => v.trim())
          .map((v) => parseFloat(v))
          .filter((v) => !isNaN(v));

        const priorities = showPriority
          ? prioritiesInput
              .split(/[,\s]+/)
              .filter((v) => v.trim())
              .map((v) => parseFloat(v))
              .filter((v) => !isNaN(v))
          : [];

        const minLength = Math.min(arrivalTimes.length, burstTimes.length);
        const processes = [];

        for (let i = 0; i < minLength; i++) {
          processes.push({
            arrivalTime: arrivalTimes[i],
            burstTime: burstTimes[i],
            priority: showPriority && priorities[i] ? priorities[i] : undefined,
          });
        }

        return processes.length > 0 ? processes : null;
      };

      const queuesToCalculate = multiQueues
        .map((queue) => {
          const showPriority = requiresPriority(queue.algorithm);
          const processes = parseQueueInputs(
            queue.arrivalTimesInput,
            queue.burstTimesInput,
            queue.prioritiesInput,
            showPriority
          );

          if (!processes) return null;

          return {
            id: queue.id,
            algorithm: queue.algorithm,
            processes,
            quantum: queue.quantum,
          };
        })
        .filter((q) => q !== null);

      if (queuesToCalculate.length === 0) {
        if (showToast) {
          toast.error('No valid queues to calculate');
        }
        return false;
      }

      calculateMultiQueue(queuesToCalculate, multiQueueNameTemplate);

      if (showToast) {
        toast.success('Multi-queue calculation complete');
      }

      return true;
    }

    // Handle single-queue mode (existing logic)
    const showPriority = requiresPriority(algorithm);
    const validation = validateInputs(showPriority, false);

    if (!validation.valid) {
      if (showToast) {
        toast.error(validation.error || 'Invalid input');
      }
      return false;
    }

    const parsedProcesses = parseInputs(showPriority, false);
    if (!parsedProcesses) {
      if (showToast) {
        toast.error('Failed to parse inputs');
      }
      return false;
    }

    setProcesses(parsedProcesses);
    calculateWithProcesses(parsedProcesses);

    if (showToast) {
      toast.success('Calculation complete');
    }

    return true;
  };

  useEffect(() => {
    if (hasHydratedFromQueryRef.current) return;

    const params = new URLSearchParams(window.location.search);

    const nextMode = asEnumValue(params.get('mode'), MODE_VALUES, 'single');
    const modeConfig = parseModeConfigFromUrl(params.get('modeConfig'));

    const modeConfigAlgorithm = getStringFromConfig(modeConfig, ['algorithm']);
    const modeConfigNameTemplate = getStringFromConfig(modeConfig, ['nameTemplate']);
    const modeConfigQuantum = getNumberFromConfig(modeConfig, ['quantum']);
    const modeConfigArrival = getStringFromConfig(modeConfig, [
      'arrival',
      'arrivalTimesInput',
    ]);
    const modeConfigBurst = getStringFromConfig(modeConfig, [
      'burst',
      'burstTimesInput',
    ]);
    const modeConfigPriority = getStringFromConfig(modeConfig, [
      'priority',
      'prioritiesInput',
    ]);
    const modeConfigMultiQueueNameTemplate = getStringFromConfig(modeConfig, [
      'multiQueueNameTemplate',
      'nameTemplate',
    ]);
    const modeConfigMultiQueues = getQueuesFromConfig(modeConfig, [
      'multiQueues',
      'queues',
    ]);

    const nextAlgorithm = asEnumValue(
      modeConfigAlgorithm ?? params.get('algorithm'),
      ALGORITHM_VALUES,
      'FCFS'
    );
    const nextNameTemplate = asEnumValue(
      modeConfigNameTemplate ?? params.get('nameTemplate'),
      NAME_TEMPLATE_VALUES,
      'P_i'
    );
    const nextQuantum =
      modeConfigQuantum ?? asNumber(params.get('quantum'), 2);
    const nextArrival =
      modeConfigArrival ?? params.get('arrival') ?? '0, 1, 2';
    const nextBurst =
      modeConfigBurst ?? params.get('burst') ?? '4, 3, 2';
    const nextPriority =
      modeConfigPriority ?? params.get('priority') ?? '2, 1, 3';
    const nextMultiQueueNameTemplate = asEnumValue(
      modeConfigMultiQueueNameTemplate ?? params.get('multiQueueNameTemplate'),
      NAME_TEMPLATE_VALUES,
      'P_i'
    );
    const modeConfigShowQueueAnnotation = getBooleanFromConfig(modeConfig, [
      'showQueueAnnotation',
    ]);
    const nextShowQueueAnnotation = asBoolean(
      modeConfigShowQueueAnnotation === null
        ? params.get('showQueueAnnotation')
        : modeConfigShowQueueAnnotation
          ? '1'
          : '0',
      false
    );
    const nextMultiQueues =
      modeConfigMultiQueues.length > 0
        ? modeConfigMultiQueues
        : deserializeQueuesFromUrl(params.get('multiQueues'));
    const shouldEnableMultiQueue = nextMode === 'multi';

    hydrationTargetRef.current = {
      algorithm: nextAlgorithm,
      nameTemplate: nextNameTemplate,
      quantum: nextQuantum,
      arrivalTimesInput: nextArrival,
      burstTimesInput: nextBurst,
      prioritiesInput: nextPriority,
      multiQueueMode: shouldEnableMultiQueue,
      multiQueueNameTemplate: nextMultiQueueNameTemplate,
      showQueueAnnotation: nextShowQueueAnnotation,
      queuesSerialized: serializeQueuesForUrl(nextMultiQueues),
    };

    setAlgorithm(nextAlgorithm);
    setNameTemplate(nextNameTemplate);
    setQuantum(nextQuantum);

    setArrivalTimesInput(nextArrival);
    setBurstTimesInput(nextBurst);
    setPrioritiesInput(nextPriority);
    setMultiQueueMode(shouldEnableMultiQueue);
    setMultiQueueNameTemplate(nextMultiQueueNameTemplate);
    setShowQueueAnnotation(nextShowQueueAnnotation);
    setMultiQueues(nextMultiQueues);

    setColorful(asBoolean(params.get('colorful'), true));
    setDarkMode(asBoolean(params.get('darkMode'), false));
    setProcessAnnotationMode(
      asEnumValue(
        params.get('processAnnotationMode'),
        PROCESS_ANNOTATION_MODE_VALUES,
        'POINTER_LEVELING'
      )
    );
    setTimeLabelRenderMode(
      asEnumValue(
        params.get('timeLabelRenderMode'),
        TIME_LABEL_RENDER_MODE_VALUES,
        'LINE_LEVELING'
      )
    );
    setAllowProcessNameInBlock(asBoolean(params.get('allowProcessNameInBlock'), true));

    shouldAutoCalculateRef.current = asBoolean(params.get('calculated'), false);
    hasHydratedFromQueryRef.current = true;
  }, [
    setAlgorithm,
    setArrivalTimesInput,
    setBurstTimesInput,
    setNameTemplate,
    setPrioritiesInput,
    setQuantum,
  ]);

  useEffect(() => {
    if (!hasHydratedFromQueryRef.current) return;

    const params = new URLSearchParams(window.location.search);
    params.set('algorithm', algorithm);
    params.set('nameTemplate', nameTemplate);
    params.set('quantum', String(quantum));
    params.set('arrival', arrivalTimesInput);
    params.set('burst', burstTimesInput);
    params.set('priority', prioritiesInput);
    params.set('colorful', colorful ? '1' : '0');
    params.set('darkMode', darkMode ? '1' : '0');
    params.set('processAnnotationMode', processAnnotationMode);
    params.set('timeLabelRenderMode', timeLabelRenderMode);
    params.set('allowProcessNameInBlock', allowProcessNameInBlock ? '1' : '0');
    params.set('mode', multiQueueMode ? 'multi' : 'single');

    if (multiQueueMode) {
      params.set('multiQueueNameTemplate', multiQueueNameTemplate);
      params.set('showQueueAnnotation', showQueueAnnotation ? '1' : '0');
      params.set('multiQueues', serializeQueuesForUrl(multiQueues));
      params.set('calculated', multiQueueResult ? '1' : '0');
    } else {
      params.delete('multiQueueNameTemplate');
      params.delete('showQueueAnnotation');
      params.delete('multiQueues');
      params.set('calculated', result ? '1' : '0');
    }

    const next = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', next);
  }, [
    algorithm,
    nameTemplate,
    quantum,
    arrivalTimesInput,
    burstTimesInput,
    prioritiesInput,
    colorful,
    darkMode,
    processAnnotationMode,
    timeLabelRenderMode,
    allowProcessNameInBlock,
    multiQueueMode,
    multiQueueNameTemplate,
    showQueueAnnotation,
    multiQueues,
    multiQueueResult,
    result,
  ]);

  useEffect(() => {
    if (!hasHydratedFromQueryRef.current) return;
    if (!shouldAutoCalculateRef.current) return;

    const hydrationTarget = hydrationTargetRef.current;
    if (!hydrationTarget) return;
    if (
      algorithm !== hydrationTarget.algorithm ||
      nameTemplate !== hydrationTarget.nameTemplate ||
      quantum !== hydrationTarget.quantum ||
      arrivalTimesInput !== hydrationTarget.arrivalTimesInput ||
      burstTimesInput !== hydrationTarget.burstTimesInput ||
      prioritiesInput !== hydrationTarget.prioritiesInput ||
      multiQueueMode !== hydrationTarget.multiQueueMode ||
      multiQueueNameTemplate !== hydrationTarget.multiQueueNameTemplate ||
      showQueueAnnotation !== hydrationTarget.showQueueAnnotation ||
      serializeQueuesForUrl(multiQueues) !== hydrationTarget.queuesSerialized
    ) {
      return;
    }

    const didCalculate = runCalculation(false);
    if (didCalculate) {
      shouldAutoCalculateRef.current = false;
    }
  }, [
    algorithm,
    quantum,
    nameTemplate,
    multiQueueMode,
    multiQueueNameTemplate,
    showQueueAnnotation,
    multiQueues,
    arrivalTimesInput,
    burstTimesInput,
    prioritiesInput,
    parseInputs,
    validateInputs,
    calculateWithProcesses,
    setProcesses,
  ]);

  useEffect(() => {
    if (!colorful && processAnnotationMode === 'LEGEND') {
      setProcessAnnotationMode('POINTER_LEVELING');
    }
  }, [colorful, processAnnotationMode]);

  const handleCalculate = () => {
    runCalculation(true);
  };

  const handleReset = () => {
    reset();
    setArrivalTimesInput('0, 1, 2');
    setBurstTimesInput('4, 3, 2');
    setPrioritiesInput('2, 1, 3');
    setMultiQueues([]);
    setMultiQueueMode(false);
    setMultiQueueNameTemplate('P_i');
    setShowQueueAnnotation(false);
    toast.info('Reset to default values');
  };

  return (
    <div className="p-4 lg:p-8 bg-background">
      <div className="container mx-auto max-w-7xl">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left/Top: Configuration */}
          <div className="lg:sticky lg:top-8 lg:h-fit">
            <ConfigSection
              algorithm={algorithm}
              onAlgorithmChange={setAlgorithm}
              nameTemplate={nameTemplate}
              onNameTemplateChange={setNameTemplate}
              arrivalTimesInput={arrivalTimesInput}
              onArrivalTimesChange={setArrivalTimesInput}
              burstTimesInput={burstTimesInput}
              onBurstTimesChange={setBurstTimesInput}
              prioritiesInput={prioritiesInput}
              onPrioritiesChange={setPrioritiesInput}
              quantum={quantum}
              onQuantumChange={setQuantum}
              multiQueueMode={multiQueueMode}
              onMultiQueueModeChange={setMultiQueueMode}
              multiQueues={multiQueues}
              onMultiQueuesChange={setMultiQueues}
              multiQueueNameTemplate={multiQueueNameTemplate}
              onMultiQueueNameTemplateChange={setMultiQueueNameTemplate}
              showQueueAnnotation={showQueueAnnotation}
              onShowQueueAnnotationChange={setShowQueueAnnotation}
              colorful={colorful}
              onColorfulChange={setColorful}
              darkMode={darkMode}
              onDarkModeChange={setDarkMode}
              processAnnotationMode={processAnnotationMode}
              onProcessAnnotationModeChange={setProcessAnnotationMode}
              timeLabelRenderMode={timeLabelRenderMode}
              onTimeLabelRenderModeChange={setTimeLabelRenderMode}
              allowProcessNameInBlock={allowProcessNameInBlock}
              onAllowProcessNameInBlockChange={setAllowProcessNameInBlock}
              onCalculate={handleCalculate}
              onReset={handleReset}
            />
          </div>

          {/* Right/Bottom: Results */}
          {(result || multiQueueResult) && (
            <div className='lg:col-span-2'>
              <ResultsSection
                result={result || (multiQueueResult ? { ...multiQueueResult, ganttChart: multiQueueResult.ganttChart } : undefined)}
                algorithm={algorithm}
                colorful={colorful}
                darkMode={darkMode}
                processAnnotationMode={processAnnotationMode}
                timeLabelRenderMode={timeLabelRenderMode}
                allowProcessNameInBlock={allowProcessNameInBlock}
                showQueueAnnotation={multiQueueMode ? showQueueAnnotation : false}
              />
            </div>
          )}

          {/* Empty State */}
          {!result && !multiQueueResult && (
            <div className="flex items-center justify-center p-12 border-2 border-dashed rounded-lg lg:col-span-2">
              <div className="text-center text-muted-foreground">
                <p className="text-lg font-medium mb-2">No results yet</p>
                <p className="text-sm">
                  Configure your processes and click Calculate to see results
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
