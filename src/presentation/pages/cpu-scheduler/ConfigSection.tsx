import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Label } from "@components/ui/label";
import { Switch } from "@components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@components/ui/select";
import { AlgorithmSelector } from "./AlgorithmSelector";
import { ProcessNameTemplateSelector } from "./ProcessNameTemplateSelector";
import { ProcessInputForm } from "./ProcessInputForm";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@components/ui/tabs";
import { MultiQueueConfig, type QueueData } from "./MultiQueueConfig";
import type {
	AlgorithmType,
	ProcessAnnotationMode,
	ProcessNameTemplate,
	TimeLabelRenderMode,
} from "@domain/types/cpu-scheduling";

interface ConfigSectionProps {
	// Single queue mode
	algorithm: AlgorithmType;
	onAlgorithmChange: (value: AlgorithmType) => void;
	nameTemplate: ProcessNameTemplate;
	onNameTemplateChange: (value: ProcessNameTemplate) => void;
	arrivalTimesInput: string;
	onArrivalTimesChange: (value: string) => void;
	burstTimesInput: string;
	onBurstTimesChange: (value: string) => void;
	prioritiesInput: string;
	onPrioritiesChange: (value: string) => void;
	quantum: number;
	onQuantumChange: (value: number) => void;
	// Multi queue mode
	multiQueueMode: boolean;
	onMultiQueueModeChange: (value: boolean) => void;
	multiQueues: QueueData[];
	onMultiQueuesChange: (queues: QueueData[]) => void;
	multiQueueNameTemplate: ProcessNameTemplate;
	onMultiQueueNameTemplateChange: (value: ProcessNameTemplate) => void;
	showQueueAnnotation: boolean;
	onShowQueueAnnotationChange: (value: boolean) => void;
	// Shared options
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
	onCalculate: () => void;
	onReset: () => void;
}

/**
 * Single Queue Configuration Component
 * Displays configuration options for single queue mode
 */
function SingleQueueConfig({
	algorithm,
	onAlgorithmChange,
	nameTemplate,
	onNameTemplateChange,
	arrivalTimesInput,
	onArrivalTimesChange,
	burstTimesInput,
	onBurstTimesChange,
	prioritiesInput,
	onPrioritiesChange,
	quantum,
	onQuantumChange,
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
	onCalculate,
	onReset,
}: Omit<
	ConfigSectionProps,
	| "multiQueueMode"
	| "onMultiQueueModeChange"
	| "multiQueues"
	| "onMultiQueuesChange"
	| "multiQueueNameTemplate"
	| "onMultiQueueNameTemplateChange"
	| "showQueueAnnotation"
	| "onShowQueueAnnotationChange"
>) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Configuration</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<AlgorithmSelector value={algorithm} onChange={onAlgorithmChange} />

				<ProcessNameTemplateSelector
					value={nameTemplate}
					onChange={onNameTemplateChange}
				/>

				<ProcessInputForm
					algorithm={algorithm}
					arrivalTimesInput={arrivalTimesInput}
					onArrivalTimesChange={onArrivalTimesChange}
					burstTimesInput={burstTimesInput}
					onBurstTimesChange={onBurstTimesChange}
					prioritiesInput={prioritiesInput}
					onPrioritiesChange={onPrioritiesChange}
					quantum={quantum}
					onQuantumChange={onQuantumChange}
				/>

				{/* Colorful Chart & Dark Mode Toggles */}
				<div className="space-y-3">
					<div className="space-y-2">
						<Label className="text-sm font-medium">Process Annotation</Label>
						<Select
							value={processAnnotationMode}
							onValueChange={(value) =>
								onProcessAnnotationModeChange(value as ProcessAnnotationMode)
							}>
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
							}>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="MAJOR_ONLY">
									Major Only (Non-overlapping)
								</SelectItem>
								<SelectItem value="LINE_LEVELING">
									Line Leveling
								</SelectItem>
								<SelectItem value="FORCE_SHRINK">
									Force Render (Shrink on Overlap)
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="flex items-center gap-3">
						<Switch
							checked={allowProcessNameInBlock}
							onCheckedChange={onAllowProcessNameInBlockChange}
							id="allow-process-name-in-block"
						/>
						<Label htmlFor="allow-process-name-in-block" className="cursor-pointer">
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

				<div className="flex gap-2">
					<Button onClick={onCalculate} className="flex-1">
						Calculate
					</Button>
					<Button onClick={onReset} variant="outline">
						Reset
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

/**
 * Main Config Section Component
 * Supports both single-queue and multi-queue modes using tabs
 */
export function ConfigSection({
	algorithm,
	onAlgorithmChange,
	nameTemplate,
	onNameTemplateChange,
	arrivalTimesInput,
	onArrivalTimesChange,
	burstTimesInput,
	onBurstTimesChange,
	prioritiesInput,
	onPrioritiesChange,
	quantum,
	onQuantumChange,
	multiQueueMode,
	onMultiQueueModeChange,
	multiQueues,
	onMultiQueuesChange,
	multiQueueNameTemplate,
	onMultiQueueNameTemplateChange,
	showQueueAnnotation,
	onShowQueueAnnotationChange,
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
	onCalculate,
	onReset,
}: ConfigSectionProps) {
	return (
		<Tabs
			value={multiQueueMode ? "multi" : "single"}
			onValueChange={(value) => onMultiQueueModeChange(value === "multi")}
			className="w-full"
		>
			<TabsList className="grid w-full grid-cols-2">
				<TabsTrigger value="single">Single Queue</TabsTrigger>
				<TabsTrigger value="multi">Multi Queue</TabsTrigger>
			</TabsList>

			<TabsContent value="single" className="mt-6">
				<SingleQueueConfig
					algorithm={algorithm}
					onAlgorithmChange={onAlgorithmChange}
					nameTemplate={nameTemplate}
					onNameTemplateChange={onNameTemplateChange}
					arrivalTimesInput={arrivalTimesInput}
					onArrivalTimesChange={onArrivalTimesChange}
					burstTimesInput={burstTimesInput}
					onBurstTimesChange={onBurstTimesChange}
					prioritiesInput={prioritiesInput}
					onPrioritiesChange={onPrioritiesChange}
					quantum={quantum}
					onQuantumChange={onQuantumChange}
					colorful={colorful}
					onColorfulChange={onColorfulChange}
					darkMode={darkMode}
					onDarkModeChange={onDarkModeChange}
					processAnnotationMode={processAnnotationMode}
					onProcessAnnotationModeChange={onProcessAnnotationModeChange}
					timeLabelRenderMode={timeLabelRenderMode}
					onTimeLabelRenderModeChange={onTimeLabelRenderModeChange}
					allowProcessNameInBlock={allowProcessNameInBlock}
					onAllowProcessNameInBlockChange={onAllowProcessNameInBlockChange}
					onCalculate={onCalculate}
					onReset={onReset}
				/>
			</TabsContent>

			<TabsContent value="multi" className="mt-6">
				<MultiQueueConfig
					queues={multiQueues}
					onQueuesChange={onMultiQueuesChange}
					nameTemplate={multiQueueNameTemplate}
					onNameTemplateChange={onMultiQueueNameTemplateChange}
					colorful={colorful}
					onColorfulChange={onColorfulChange}
					darkMode={darkMode}
					onDarkModeChange={onDarkModeChange}
					processAnnotationMode={processAnnotationMode}
					onProcessAnnotationModeChange={onProcessAnnotationModeChange}
					timeLabelRenderMode={timeLabelRenderMode}
					onTimeLabelRenderModeChange={onTimeLabelRenderModeChange}
					allowProcessNameInBlock={allowProcessNameInBlock}
					onAllowProcessNameInBlockChange={onAllowProcessNameInBlockChange}
					showQueueAnnotation={showQueueAnnotation}
					onShowQueueAnnotationChange={onShowQueueAnnotationChange}
					onCalculate={onCalculate}
					onReset={onReset}
				/>
			</TabsContent>
		</Tabs>
	);
}
