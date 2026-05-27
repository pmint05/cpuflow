import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  diskInputSchema,
  type DiskInputFormValues,
} from "@domain/validators/disk-input-validator";
import { useEffect, useMemo } from "react";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Input } from "@components/ui/input";
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
import { getDiskAlgorithmName } from "@domain/algorithms/disk-scheduling";
import { parseQueue } from "@infra/serializers/disk-scheduler-config-serializer";
import { Field, FieldContent, FieldLabel, FieldGroup, FieldError } from "@components/ui/field";

interface DiskInputFormProps {
	algorithm: DiskSchedulingAlgorithm;
	initialHead: number;
	direction: DiskDirection;
	maxCylinder: number;
	queueInput: string;
	includeEdges: boolean;
	onValuesChange: (values: DiskInputFormValues) => void;
	onSubmit: (values: DiskInputFormValues) => void;
}

const ALGORITHMS: DiskSchedulingAlgorithm[] = [
	"FCFS",
	"SSTF",
	"SCAN",
	"C_SCAN",
	"LOOK",
	"C_LOOK",
];

export function DiskInputForm({
	algorithm,
	initialHead,
	direction,
	maxCylinder,
	queueInput,
	includeEdges,
	onValuesChange,
	onSubmit,
}: DiskInputFormProps) {
	const form = useForm<DiskInputFormValues>({
		resolver: zodResolver(diskInputSchema) as any,
		defaultValues: {
			algorithm,
			initialHead: initialHead as any,
			direction,
			maxCylinder: maxCylinder as any,
			queueInput,
			includeEdges,
		},
		mode: "onChange",
	});

	// Hydration: Sync form with URL when props change
	useEffect(() => {
		form.reset({
			algorithm,
			initialHead,
			direction,
			maxCylinder,
			queueInput,
			includeEdges,
		});
	}, [algorithm, initialHead, direction, maxCylinder, queueInput, includeEdges, form]);

	// Serialization: Notify parent of valid changes for URL update
	useEffect(() => {
		const subscription = form.watch((value, { name, type }) => {
			if (type === "change") {
				form.trigger().then(isValid => {
					if (isValid) {
						onValuesChange(value as DiskInputFormValues);
					}
				});
			}
		});
		return () => subscription.unsubscribe();
	}, [form, onValuesChange]);

	const watchedQueue = form.watch("queueInput");
	const watchedMax = form.watch("maxCylinder");

	const queuePreview = useMemo(() => {
		if (typeof watchedQueue !== "string" || typeof watchedMax !== "number") return [];
		return parseQueue(watchedQueue, watchedMax);
	}, [watchedQueue, watchedMax]);

	return (
		<Card className="shadow-none">
			<CardHeader>
				<CardTitle>Disk Input</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
					<FieldGroup>
						<Controller
							control={form.control}
							name="algorithm"
							render={({ field, fieldState: { error } }) => (
								<Field>
									<FieldLabel>Algorithm</FieldLabel>
									<FieldContent>
										<Select onValueChange={field.onChange} value={field.value}>
											<SelectTrigger>
												<SelectValue placeholder="Select algorithm" />
											</SelectTrigger>
											<SelectContent>
												{ALGORITHMS.map((algo) => (
													<SelectItem key={algo} value={algo}>
														{getDiskAlgorithmName(algo)}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FieldError errors={[error]} />
									</FieldContent>
								</Field>
							)}
						/>

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<Controller
								control={form.control}
								name="initialHead"
								render={({ field, fieldState: { error } }) => (
									<Field>
										<FieldLabel>Initial Head</FieldLabel>
										<FieldContent>
											<Input type="number" {...field} />
											<FieldError errors={[error]} />
										</FieldContent>
									</Field>
								)}
							/>
							<Controller
								control={form.control}
								name="maxCylinder"
								render={({ field, fieldState: { error } }) => (
									<Field>
										<FieldLabel>Max Cylinder</FieldLabel>
										<FieldContent>
											<Input type="number" {...field} />
											<FieldError errors={[error]} />
										</FieldContent>
									</Field>
								)}
							/>
						</div>

						<Controller
							control={form.control}
							name="direction"
							render={({ field, fieldState: { error } }) => (
								<Field>
									<FieldLabel>Direction</FieldLabel>
									<FieldContent>
										<Select onValueChange={field.onChange} value={field.value}>
											<SelectTrigger>
												<SelectValue placeholder="Select direction" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="LEFT">LEFT</SelectItem>
												<SelectItem value="RIGHT">RIGHT</SelectItem>
											</SelectContent>
										</Select>
										<FieldError errors={[error]} />
									</FieldContent>
								</Field>
							)}
						/>

						<Controller
							control={form.control}
							name="queueInput"
							render={({ field, fieldState: { error } }) => (
								<Field>
									<FieldLabel>Cylinder Queue</FieldLabel>
									<FieldContent>
										<Input placeholder="2069, 1212, 2296" {...field} />
										<FieldError errors={[error]} />
										<p className="text-xs text-muted-foreground">
											Parsed requests: {queuePreview.length}
										</p>
									</FieldContent>
								</Field>
							)}
						/>
					</FieldGroup>

					<Button type="submit" className="w-full">
						Run Simulation
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}