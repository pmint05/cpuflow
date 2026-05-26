import { useMemo, useState } from "react";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@components/ui/select";
import type {
	DiskDirection,
	DiskSchedulingAlgorithm,
} from "@domain/types/disk-scheduling";
import {
	getDiskAlgorithmDescription,
	getDiskAlgorithmName,
} from "@domain/algorithms/disk-scheduling";

interface DiskInputFormProps {
	algorithm: DiskSchedulingAlgorithm;
	initialHead: number;
	direction: DiskDirection;
	maxCylinder: number;
	queueInput: string;
	includeEdges: boolean;
	onSubmit: (payload: {
		algorithm: DiskSchedulingAlgorithm;
		initialHead: number;
		direction: DiskDirection;
		maxCylinder: number;
		queue: number[];
		includeEdges: boolean;
	}) => void;
}

const ALGORITHMS: DiskSchedulingAlgorithm[] = [
	"FCFS",
	"SSTF",
	"SCAN",
	"C_SCAN",
	"LOOK",
	"C_LOOK",
];

function parseQueue(input: string, maxCylinder: number): number[] {
	return input
		.split(/[\s,]+/)
		.map((item) => item.trim())
		.filter((item) => item.length > 0)
		.map((item) => Number(item))
		.filter((item) => Number.isFinite(item) && item >= 0 && item <= maxCylinder)
		.map((item) => Math.trunc(item));
}

export function DiskInputForm({
	algorithm,
	initialHead,
	direction,
	maxCylinder,
	queueInput,
	includeEdges,
	onSubmit,
}: DiskInputFormProps) {
	const [localAlgorithm, setLocalAlgorithm] =
		useState<DiskSchedulingAlgorithm>(algorithm);
	const [localHead, setLocalHead] = useState(String(initialHead));
	const [localDirection, setLocalDirection] =
		useState<DiskDirection>(direction);
	const [localMaxCylinder, setLocalMaxCylinder] = useState(String(maxCylinder));
	const [localQueue, setLocalQueue] = useState(queueInput);

	const queuePreview = useMemo(() => {
		const maxValue = Number(localMaxCylinder);
		if (!Number.isFinite(maxValue)) return [];
		return parseQueue(localQueue, Math.max(1, Math.trunc(maxValue)));
	}, [localMaxCylinder, localQueue]);

	return (
		<Card className="shadow-none">
		  <CardHeader>
		    <CardTitle>Disk Input</CardTitle>
		  </CardHeader>			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Label>Algorithm</Label>
					<Select
						value={localAlgorithm}
						onValueChange={(value) =>
							setLocalAlgorithm(value as DiskSchedulingAlgorithm)
						}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent align="start" position="popper">
							{ALGORITHMS.map((candidate) => (
								<SelectItem key={candidate} value={candidate}>
									<div className="flex flex-col items-start">
										<span>{getDiskAlgorithmName(candidate)}</span>
										{/* <span className="text-xs text-muted-foreground truncate">
											{getDiskAlgorithmDescription(candidate)}
										</span> */}
									</div>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div className="space-y-2">
						<Label htmlFor="disk-head">Initial Head</Label>
						<Input
							id="disk-head"
							type="number"
							value={localHead}
							onChange={(event) => setLocalHead(event.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="disk-max-cylinder">Max Cylinder</Label>
						<Input
							id="disk-max-cylinder"
							type="number"
							value={localMaxCylinder}
							onChange={(event) => setLocalMaxCylinder(event.target.value)}
							placeholder="Defaults to max(queue)"
						/>
					</div>
				</div>

				<div className="space-y-2">
					<Label>Direction</Label>
					<Select
						value={localDirection}
						onValueChange={(value) =>
							setLocalDirection(value as DiskDirection)
						}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent align="start" position="popper">
							<SelectItem value="LEFT">LEFT</SelectItem>
							<SelectItem value="RIGHT">RIGHT</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label htmlFor="disk-queue">Cylinder Queue</Label>
					<Input
						id="disk-queue"
						value={localQueue}
						onChange={(event) => setLocalQueue(event.target.value)}
						placeholder="2069, 1212, 2296"
					/>
					<p className="text-xs text-muted-foreground">
						Parsed requests: {queuePreview.length}
					</p>
				</div>

				<Button
					className="w-full"
					onClick={() => {
						const parsedQueue = parseQueue(
							localQueue,
							Number.POSITIVE_INFINITY,
						);
						const inferredQueueMax =
							parsedQueue.length > 0 ? Math.max(...parsedQueue) : maxCylinder;
						const rawMax = Number(localMaxCylinder);
						const max = Math.max(
							1,
							Math.trunc(
								Number.isFinite(rawMax) && rawMax > 0
									? rawMax
									: inferredQueueMax,
							),
						);
						const head = Math.min(
							max,
							Math.max(0, Math.trunc(Number(localHead) || initialHead)),
						);
						onSubmit({
							algorithm: localAlgorithm,
							initialHead: head,
							direction: localDirection,
							maxCylinder: max,
							queue: parseQueue(localQueue, max),
							includeEdges,
						});
					}}>
					Run Simulation
				</Button>
			</CardContent>
		</Card>
	);
}
