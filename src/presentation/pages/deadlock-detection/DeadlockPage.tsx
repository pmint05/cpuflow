import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { MatrixDisplay } from "@presentation/components/shared/MatrixDisplay";
import { PageBreadcrumb } from "@presentation/components/shared/PageBreadcrumb";
import { ResourceMatrixGrid } from "@presentation/components/shared/ResourceMatrixGrid";
import {
	makeLabels,
	matrixToString,
	resizeMatrix,
	vectorToString,
} from "@presentation/components/shared/resource-matrix-utils";
import { StepViewer } from "@presentation/components/shared/StepViewer";
import { useDeadlockDetection } from "@app/deadlock-detection/useDeadlockDetection";
import {
	encodeDeadlockConfig,
	decodeDeadlockConfig,
	DEADLOCK_DEFAULTS,
} from "../../../infrastructure/serializers/deadlock-config-serializer";
import type { ResourceCellValue } from "@presentation/components/shared/resource-matrix-utils";
import {
	AlertCircleIcon,
	AlertTriangleIcon,
	CheckCircle2Icon,
	RotateCcwIcon,
	SearchIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MIN_COUNT = 1;
const MAX_COUNT = 12;

function clampCount(value: number): number {
	if (!Number.isFinite(value)) return MIN_COUNT;
	return Math.min(MAX_COUNT, Math.max(MIN_COUNT, Math.trunc(value)));
}

function toVector(matrix: ResourceCellValue[][]): ResourceCellValue[] {
	return matrix[0] ?? [];
}

export function DeadlockPage() {
	const [processCount, setProcessCount] = useState(
		DEADLOCK_DEFAULTS.processCount,
	);
	const [resourceCount, setResourceCount] = useState(
		DEADLOCK_DEFAULTS.resourceCount,
	);
	const [allocation, setAllocation] = useState<ResourceCellValue[][]>(
		DEADLOCK_DEFAULTS.allocation,
	);
	const [request, setRequest] = useState<ResourceCellValue[][]>(
		DEADLOCK_DEFAULTS.request,
	);
	const [available, setAvailable] = useState<ResourceCellValue[][]>([
		DEADLOCK_DEFAULTS.available,
	]);

	const { input, result, error, detect, reset } = useDeadlockDetection();
	const hasHydratedRef = useRef(false);

	useEffect(() => {
		if (hasHydratedRef.current) return;
		hasHydratedRef.current = true;

		const params = new URLSearchParams(window.location.search);
		const configParam = params.get("config");
		if (!configParam) return;

		const cfg = decodeDeadlockConfig(configParam);
		setProcessCount(clampCount(cfg.processCount));
		setResourceCount(clampCount(cfg.resourceCount));
		setAllocation(cfg.allocation);
		setRequest(cfg.request);
		setAvailable([cfg.available]);
	}, []);

	useEffect(() => {
		setAllocation((current) =>
			resizeMatrix(current, processCount, resourceCount),
		);
		setRequest((current) => resizeMatrix(current, processCount, resourceCount));
		setAvailable((current) => resizeMatrix(current, 1, resourceCount));
	}, [processCount, resourceCount]);

	useEffect(() => {
		if (!hasHydratedRef.current) return;

		const encoded = encodeDeadlockConfig({
			processCount,
			resourceCount,
			allocation,
			request,
			available: toVector(available),
		});

		window.history.replaceState(
			null,
			"",
			`${window.location.pathname}?config=${encoded}`,
		);
	}, [allocation, available, processCount, request, resourceCount]);

	const processLabels = useMemo(
		() => makeLabels(processCount, "P"),
		[processCount],
	);
	const resourceLabels = useMemo(
		() => makeLabels(resourceCount, "R"),
		[resourceCount],
	);
	const availableVector = useMemo(() => toVector(available), [available]);

	const handleDetect = useCallback(() => {
		if (processCount < MIN_COUNT || resourceCount < MIN_COUNT) {
			toast.error("Process count and resource count must be at least 1");
			return;
		}

		detect({
			allocationStr: matrixToString(allocation),
			requestStr: matrixToString(request),
			availableStr: vectorToString(availableVector),
		});
	}, [
		allocation,
		availableVector,
		detect,
		processCount,
		request,
		resourceCount,
	]);

	const handleReset = useCallback(() => {
		setProcessCount(DEADLOCK_DEFAULTS.processCount);
		setResourceCount(DEADLOCK_DEFAULTS.resourceCount);
		setAllocation(DEADLOCK_DEFAULTS.allocation);
		setRequest(DEADLOCK_DEFAULTS.request);
		setAvailable([DEADLOCK_DEFAULTS.available]);
		reset();
		toast.info("Reset to defaults");
	}, [reset]);

	const handleCopyUrl = useCallback(() => {
		navigator.clipboard
			.writeText(window.location.href)
			.then(() => toast.success("URL copied!"));
	}, []);

	return (
		<div className="p-4 lg:p-8">
			<div className="container mx-auto max-w-7xl">
				<div className="mb-6 space-y-3">
					<PageBreadcrumb
						items={[
							{ label: "Home", href: "/" },
							{ label: "Deadlock Detection" },
						]}
					/>
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div>
							<h1 className="flex items-center gap-2 text-2xl font-bold">
								<AlertTriangleIcon className="size-6 text-amber-500" />
								Deadlock Detection
							</h1>
							<p className="mt-1 text-sm text-muted-foreground">
								Identify deadlocked processes using resource-allocation graph
								reduction
							</p>
						</div>
						<div className="flex items-center gap-2">
							{/* <Button
								variant="outline"
								size="sm"
								onClick={handleCopyUrl}
								className="text-xs">
								Share URL
							</Button>
							<Button asChild variant="outline" size="sm" className="text-xs">
								<Link to="/algo/banker">Go to Banker&#39;s Algorithm</Link>
							</Button> */}
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					<div className="space-y-4 lg:sticky lg:top-17.5 lg:h-fit">
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-base">Matrix Dimensions</CardTitle>
								<p className="text-xs text-muted-foreground">
									Adjust the grid before editing values
								</p>
							</CardHeader>
							<CardContent className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label
										htmlFor="process-count"
										className="text-sm font-medium">
										Process count
									</Label>
									<Input
										id="process-count"
										type="number"
										min={MIN_COUNT}
										max={MAX_COUNT}
										value={processCount}
										onChange={(event) =>
											setProcessCount(clampCount(Number(event.target.value)))
										}
									/>
								</div>
								<div className="space-y-2">
									<Label
										htmlFor="resource-count"
										className="text-sm font-medium">
										Resource types
									</Label>
									<Input
										id="resource-count"
										type="number"
										min={MIN_COUNT}
										max={MAX_COUNT}
										value={resourceCount}
										onChange={(event) =>
											setResourceCount(clampCount(Number(event.target.value)))
										}
									/>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-base">Input Matrices</CardTitle>
								<p className="text-xs text-muted-foreground">
									{processCount} processes · {resourceCount} resource types
								</p>
							</CardHeader>
							<CardContent className="space-y-5">
								<ResourceMatrixGrid
									title="Allocation Matrix"
									helpText="Resources currently held by each process"
									rowLabels={processLabels}
									colLabels={resourceLabels}
									values={allocation}
									onChange={setAllocation}
									compact
								/>

								<ResourceMatrixGrid
									title="Request Matrix"
									helpText="Resources each process is waiting for"
									rowLabels={processLabels}
									colLabels={resourceLabels}
									values={request}
									onChange={setRequest}
									compact
								/>

								<ResourceMatrixGrid
									title="Available Vector"
									helpText="Free unallocated resources"
									rowLabels={["Available"]}
									colLabels={resourceLabels}
									values={available}
									onChange={setAvailable}
									compact
								/>

								{error && (
									<div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
										<AlertCircleIcon className="mt-0.5 size-3.5 shrink-0" />
										<span>{error}</span>
									</div>
								)}

								<div className="flex gap-2 pt-1">
									<Button onClick={handleDetect} className="flex-1 gap-1.5">
										<SearchIcon className="size-4" />
										Detect
									</Button>
									<Button
										variant="outline"
										size="icon"
										onClick={handleReset}
										title="Reset">
										<RotateCcwIcon className="size-4" />
									</Button>
								</div>
							</CardContent>
						</Card>

						<Card className="bg-muted/30">
							<CardContent className="pb-4 pt-4">
								<p className="text-xs leading-relaxed text-muted-foreground">
									<span className="font-semibold text-foreground">
										Algorithm:
									</span>{" "}
									Processes with zero allocation are marked finished. The
									algorithm finds processes whose requests can be satisfied by
									current work, marks them finished and releases their
									resources. Processes still unmarked are{" "}
									<span className="font-medium text-destructive">
										deadlocked
									</span>
									.
								</p>
							</CardContent>
						</Card>
					</div>

					<div className="space-y-5 lg:col-span-2">
						{!result && !error && (
							<div className="flex min-h-75 flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center text-muted-foreground">
								<AlertTriangleIcon className="mb-4 size-12 opacity-20" />
								<p className="mb-1 text-base font-medium">No results yet</p>
								<p className="text-sm">Fill in the matrices and click Detect</p>
							</div>
						)}

						{result && (
							<>
								<Card
									className={cn(
										"border-2",
										result.deadlocked
											? "border-destructive/40"
											: "border-emerald-500/30",
									)}>
									<CardContent className="pb-4 pt-5">
										<div className="mb-4 flex items-start gap-3">
											{result.deadlocked ? (
												<AlertTriangleIcon className="mt-0.5 size-8 shrink-0 text-destructive" />
											) : (
												<CheckCircle2Icon className="mt-0.5 size-8 shrink-0 text-emerald-500" />
											)}
											<div>
												<p className="text-lg font-bold">
													{result.deadlocked
														? "Deadlock Detected"
														: "No Deadlock"}
												</p>
												<p className="text-sm text-muted-foreground">
													{result.deadlocked
														? `${result.deadlockedProcesses.length} process${result.deadlockedProcesses.length > 1 ? "es" : ""} are deadlocked`
														: "All processes can complete successfully"}
												</p>
											</div>
										</div>

										<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
											{result.finish.map((finished, index) => (
												<div
													key={index}
													className={cn(
														"flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-mono font-semibold",
														finished
															? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
															: "bg-destructive/10 text-destructive",
													)}>
													{finished ? (
														<CheckCircle2Icon className="size-4 shrink-0" />
													) : (
														<AlertTriangleIcon className="size-4 shrink-0" />
													)}
													{processLabels[index] ?? `P${index}`}
													<span className="ml-auto text-xs font-normal">
														{finished ? "OK" : "DEADLOCKED"}
													</span>
												</div>
											))}
										</div>

										<div className="mt-4 border-t pt-3">
											<p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
												Final Work Vector
											</p>
											<div className="flex flex-wrap gap-2">
												{result.work.map((value, index) => (
													<div
														key={index}
														className="flex flex-col items-center gap-0.5">
														<span className="text-[10px] font-mono text-muted-foreground">
															{resourceLabels[index] ?? `R${index}`}
														</span>
														<span className="min-w-8 rounded bg-muted px-1.5 py-0.5 text-center font-mono text-sm font-semibold tabular-nums">
															{value}
														</span>
													</div>
												))}
											</div>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="pb-3">
										<CardTitle className="text-base">
											Step-by-Step Detection Trace
										</CardTitle>
										<p className="text-xs text-muted-foreground">
											{result.steps.length} steps — shows Work vector and
											request evaluation
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

								{input && (
									<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
													cellClassName={(row, _, value) =>
														result.deadlockedProcesses.includes(row) &&
														value > 0
															? "bg-destructive/15 text-destructive"
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
													cellClassName={(row, _, value) =>
														result.deadlockedProcesses.includes(row) &&
														value > 0
															? "bg-destructive/15 text-destructive"
															: undefined
													}
												/>
											</CardContent>
										</Card>
									</div>
								)}
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
