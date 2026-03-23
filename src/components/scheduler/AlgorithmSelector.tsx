import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { AlgorithmType } from "@/types/scheduler";
import { getAlgorithmName, getAlgorithmDescription } from "@/lib/algorithms";
import { Label } from "../ui/label";

interface AlgorithmSelectorProps {
	value: AlgorithmType;
	onChange: (value: AlgorithmType) => void;
}

const algorithms: AlgorithmType[] = [
	"FCFS",
	"SJF_NON_PREEMPTIVE",
	"SJF_PREEMPTIVE",
	"ROUND_ROBIN",
	"PRIORITY_NON_PREEMPTIVE",
	"PRIORITY_PREEMPTIVE",
];

export function AlgorithmSelector({ value, onChange }: AlgorithmSelectorProps) {
	return (
		<div className="space-y-2">
			<Label className="text-sm font-medium">Algorithm</Label>
			<Select value={value} onValueChange={onChange}>
				<SelectTrigger className="w-full">
					<SelectValue asChild>
						<span>{getAlgorithmName(value)}</span>
					</SelectValue>
				</SelectTrigger>
				<SelectContent position="popper" align="start">
					{algorithms.map((algo) => (
						<SelectItem key={algo} value={algo}>
							<div className="flex flex-col">
								<span>{getAlgorithmName(algo)}</span>
								<span className="text-xs text-muted-foreground">
									{getAlgorithmDescription(algo)}
								</span>
							</div>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
