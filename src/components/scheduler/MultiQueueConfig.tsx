import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { QueueConfigCard } from "./QueueConfigCard";
import { ProcessNameTemplateSelector } from "./ProcessNameTemplateSelector";
import type {
  AlgorithmType,
  ProcessAnnotationMode,
  ProcessNameTemplate,
  TimeLabelRenderMode,
} from "@/types/scheduler";

export interface QueueData {
  id: string;
  algorithm: AlgorithmType;
  arrivalTimesInput: string;
  burstTimesInput: string;
  prioritiesInput: string;
  quantum: number;
}

interface MultiQueueConfigProps {
  queues: QueueData[];
  onQueuesChange: (queues: QueueData[]) => void;
  nameTemplate: ProcessNameTemplate;
  onNameTemplateChange: (value: ProcessNameTemplate) => void;
  colorful: boolean;
  onColorfulChange: (value: boolean) => void;
  darkMode: boolean;
  onDarkModeChange: (value: boolean) => void;
  processAnnotationMode: ProcessAnnotationMode;
  onProcessAnnotationModeChange: (value: ProcessAnnotationMode) => void;
  timeLabelRenderMode: TimeLabelRenderMode;
  onTimeLabelRenderModeChange: (value: TimeLabelRenderMode) => void;
  allowProcessNameInBlock: boolean;
  onAllowProcessNameInBlockChange: (value: boolean) => void;
  showQueueAnnotation: boolean;
  onShowQueueAnnotationChange: (value: boolean) => void;
  onCalculate: () => void;
  onReset: () => void;
}

export function MultiQueueConfig({
  queues,
  onQueuesChange,
  nameTemplate,
  onNameTemplateChange,
  colorful,
  onColorfulChange,
  darkMode,
  onDarkModeChange,
  processAnnotationMode,
  onProcessAnnotationModeChange,
  timeLabelRenderMode,
  onTimeLabelRenderModeChange,
  allowProcessNameInBlock,
  onAllowProcessNameInBlockChange,
  showQueueAnnotation,
  onShowQueueAnnotationChange,
  onCalculate,
  onReset,
}: MultiQueueConfigProps) {
  const addQueue = () => {
    const newQueue: QueueData = {
      id: `queue-${Date.now()}`,
      algorithm: "FCFS",
      arrivalTimesInput: "",
      burstTimesInput: "",
      prioritiesInput: "",
      quantum: 2,
    };
    onQueuesChange([...queues, newQueue]);
  };

  const removeQueue = (index: number) => {
    onQueuesChange(queues.filter((_, i) => i !== index));
  };

  const updateQueue = (index: number, updates: Partial<QueueData>) => {
    const newQueues = [...queues];
    newQueues[index] = { ...newQueues[index], ...updates };
    onQueuesChange(newQueues);
  };

  return (
    <div className="space-y-6">
      {/* Shared Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle>Shared Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProcessNameTemplateSelector
            value={nameTemplate}
            onChange={onNameTemplateChange}
          />

          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Process Annotation</Label>
              <Select
                value={processAnnotationMode}
                onValueChange={(value) =>
                  onProcessAnnotationModeChange(value as ProcessAnnotationMode)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POINTER_LEVELING">
                    Extra Name With Leveling Line
                  </SelectItem>
                  <SelectItem value="POINTER_FIRST_ONLY">
                    Simple (First Block Per Process)
                  </SelectItem>
                  {colorful && (
                    <SelectItem value="LEGEND">
                      Legend (Color Square + Name)
                    </SelectItem>
                  )}
                  <SelectItem value="HIDDEN">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Time Label Rendering</Label>
              <Select
                value={timeLabelRenderMode}
                onValueChange={(value) =>
                  onTimeLabelRenderModeChange(value as TimeLabelRenderMode)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAJOR_ONLY">
                    Major Only (Non-overlapping)
                  </SelectItem>
                  <SelectItem value="LINE_LEVELING">Line Leveling</SelectItem>
                  <SelectItem value="FORCE_SHRINK">
                    Force Render (Shrink on Overlap)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={showQueueAnnotation}
                onCheckedChange={onShowQueueAnnotationChange}
                id="show-queue-annotation"
              />
              <Label htmlFor="show-queue-annotation" className="cursor-pointer">
                Show Queue Annotation
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={allowProcessNameInBlock}
                onCheckedChange={onAllowProcessNameInBlockChange}
                id="allow-process-name-in-block"
              />
              <Label
                htmlFor="allow-process-name-in-block"
                className="cursor-pointer"
              >
                Try Insert Process Name Inside Block
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={colorful}
                onCheckedChange={onColorfulChange}
                id="colorful-toggle"
              />
              <Label htmlFor="colorful-toggle" className="cursor-pointer">
                Colorful Chart
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={darkMode}
                onCheckedChange={onDarkModeChange}
                id="dark-mode-toggle"
              />
              <Label htmlFor="dark-mode-toggle" className="cursor-pointer">
                Dark Mode Chart
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queues Configuration Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Queues</h3>
          <Button onClick={addQueue} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Queue
          </Button>
        </div>

        <div className="grid gap-4">
          {queues.map((queue, index) => (
            <QueueConfigCard
              key={queue.id}
              queueIndex={index}
              algorithm={queue.algorithm}
              onAlgorithmChange={(value) =>
                updateQueue(index, { algorithm: value })
              }
              arrivalTimesInput={queue.arrivalTimesInput}
              onArrivalTimesChange={(value) =>
                updateQueue(index, { arrivalTimesInput: value })
              }
              burstTimesInput={queue.burstTimesInput}
              onBurstTimesChange={(value) =>
                updateQueue(index, { burstTimesInput: value })
              }
              prioritiesInput={queue.prioritiesInput}
              onPrioritiesChange={(value) =>
                updateQueue(index, { prioritiesInput: value })
              }
              quantum={queue.quantum}
              onQuantumChange={(value) =>
                updateQueue(index, { quantum: value })
              }
              onRemove={() => removeQueue(index)}
            />
          ))}
        </div>

        {queues.length === 0 && (
          <div className="rounded-lg border-2 border-dashed border-muted-foreground/50 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No queues yet. Click "Add Queue" to create one.
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={onCalculate} className="flex-1" disabled={queues.length === 0}>
          Calculate
        </Button>
        <Button onClick={onReset} variant="outline">
          Reset
        </Button>
      </div>
    </div>
  );
}
