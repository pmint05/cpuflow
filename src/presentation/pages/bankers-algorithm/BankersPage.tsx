import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
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
import { Separator } from "@components/ui/separator";
import { MatrixDisplay } from "@presentation/components/shared/MatrixDisplay";
import { PageBreadcrumb } from "@presentation/components/shared/PageBreadcrumb";
import { ResourceMatrixGrid } from "@presentation/components/shared/ResourceMatrixGrid";
import {
	createVector,
	makeLabels,
	matrixToString,
	resizeMatrix,
	resizeVector,
	vectorToString,
} from "@presentation/components/shared/resource-matrix-utils";
import { StepViewer } from "@presentation/components/shared/StepViewer";
import { useBankersAlgorithm } from "@app/bankers-algorithm/useBankersAlgorithm";
import {
	encodeBankersConfig,
	decodeBankersConfig,
	BANKERS_DEFAULTS,
} from "../../../infrastructure/serializers/bankers-config-serializer";
import type { ResourceCellValue } from "@presentation/components/shared/resource-matrix-utils";
import {
	AlertCircleIcon,
	ArrowRightIcon,
	CalculatorIcon,
	InfoIcon,
	RotateCcwIcon,
	ShieldCheckIcon,
	ShieldXIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MIN_COUNT = 1;
const MAX_COUNT = 12;

function clampCount(value: number): number {
	if (!Number.isFinite(value)) return MIN_COUNT;
	return Math.min(MAX_COUNT, Math.max(MIN_COUNT, Math.trunc(value)));
}

function normalizeProcessId(value: number, processCount: number): number {
	return Math.min(Math.max(0, value), Math.max(processCount - 1, 0));
}

function toVector(matrix: ResourceCellValue[][]): ResourceCellValue[] {
	return matrix[0] ?? [];
}

export function BankersPage() {
	const [processCount, setProcessCount] = useState(
		BANKERS_DEFAULTS.processCount,
	);
	const [resourceCount, setResourceCount] = useState(
		BANKERS_DEFAULTS.resourceCount,
	);
	const [allocation, setAllocation] = useState<ResourceCellValue[][]>(
		BANKERS_DEFAULTS.allocation,
	);
	const [max, setMax] = useState<ResourceCellValue[][]>(BANKERS_DEFAULTS.max);
	const [available, setAvailable] = useState<ResourceCellValue[][]>([
		BANKERS_DEFAULTS.available,
	]);
	const [showRequest, setShowRequest] = useState(false);
	const [requestProcessId, setRequestProcessId] = useState(0);
	const [requestVector, setRequestVector] = useState<ResourceCellValue[]>(
		createVector(BANKERS_DEFAULTS.resourceCount),
	);

	const {
		input,
		need,
		safeResult,
		requestResult,
		error,
		calculate,
		testRequest,
		reset,
	} = useBankersAlgorithm();
	const hasHydratedRef = useRef(false);

	useEffect(() => {
		if (hasHydratedRef.current) return;
		hasHydratedRef.current = true;

		const params = new URLSearchParams(window.location.search);
		const configParam = params.get("config");
		if (!configParam) return;

		const cfg = decodeBankersConfig(configParam);
		setProcessCount(clampCount(cfg.processCount));
		setResourceCount(clampCount(cfg.resourceCount));
		setAllocation(cfg.allocation);
		setMax(cfg.max);
		setAvailable([cfg.available]);
		setRequestProcessId(cfg.requestProcessId ?? 0);
		setRequestVector(cfg.requestVector ?? createVector(cfg.resourceCount));
		setShowRequest(Boolean(cfg.requestVector));
	}, []);

	useEffect(() => {
		setAllocation((current) =>
			resizeMatrix(current, processCount, resourceCount),
		);
		setMax((current) => resizeMatrix(current, processCount, resourceCount));
		setAvailable((current) => resizeMatrix(current, 1, resourceCount));
		setRequestVector((current) => resizeVector(current, resourceCount));
		setRequestProcessId((current) => normalizeProcessId(current, processCount));
	}, [processCount, resourceCount]);

	useEffect(() => {
		if (!hasHydratedRef.current) return;

		const encoded = encodeBankersConfig({
			processCount,
			resourceCount,
			allocation,
			max,
			available: toVector(available),
			requestProcessId: showRequest ? requestProcessId : undefined,
			requestVector: showRequest ? requestVector : undefined,
		});

		window.history.replaceState(
			null,
			"",
			`${window.location.pathname}?config=${encoded}`,
		);
	}, [
		allocation,
		available,
		max,
		processCount,
		requestProcessId,
		requestVector,
		resourceCount,
		showRequest,
	]);

	const processLabels = useMemo(
		() => makeLabels(processCount, "P"),
		[processCount],
	);
	const resourceLabels = useMemo(
		() => makeLabels(resourceCount, "R"),
		[resourceCount],
	);
	const availableVector = useMemo(() => toVector(available), [available]);

	const handleCalculate = useCallback(() => {
		if (processCount < MIN_COUNT || resourceCount < MIN_COUNT) {
			toast.error("Process count and resource count must be at least 1");
			return;
		}

		calculate({
			allocationStr: matrixToString(allocation),
			maxStr: matrixToString(max),
			availableStr: vectorToString(availableVector),
		});
	}, [
		allocation,
		availableVector,
		calculate,
		max,
		processCount,
		resourceCount,
	]);

	const handleTestRequest = useCallback(() => {
		if (!input) {
			toast.error("Run Calculate first before testing a request");
			return;
		}

		testRequest(requestProcessId, vectorToString(requestVector));
	}, [input, requestProcessId, requestVector, testRequest]);

	const handleReset = useCallback(() => {
		setProcessCount(BANKERS_DEFAULTS.processCount);
		setResourceCount(BANKERS_DEFAULTS.resourceCount);
		setAllocation(BANKERS_DEFAULTS.allocation);
		setMax(BANKERS_DEFAULTS.max);
		setAvailable([BANKERS_DEFAULTS.available]);
		setShowRequest(false);
		setRequestProcessId(0);
		setRequestVector(createVector(BANKERS_DEFAULTS.resourceCount));
		reset();
		toast.info("Reset to defaults");
	}, [reset]);

	const handleCopyUrl = useCallback(() => {
		navigator.clipboard
			.writeText(window.location.href)
			.then(() => toast.success("URL copied!"));
	}, []);

	const needMatrixForDisplay =
		need ??
		((): number[][] | null => {
			if (allocation.length !== max.length) return null;
			return allocation.map((row, rowIndex) =>
				row.map((value, colIndex) => (max[rowIndex]?.[colIndex] ?? 0) - value),
			);
		})();

	return (
		<div className="p-4 lg:p-8">
			<div className="container mx-auto max-w-7xl">
				<div className="mb-6 space-y-3">
					<PageBreadcrumb
						items={[
							{ label: "Home", href: "/" },
							{ label: "Banker's Algorithm" },
						]}
					/>
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div>
							<h1 className="flex items-center gap-2 text-2xl font-bold">
								<ShieldCheckIcon className="size-6 text-emerald-500" />
								Banker's Algorithm
							</h1>
							<p className="mt-1 text-sm text-muted-foreground">
								Deadlock avoidance — find safe sequences and evaluate resource
								requests
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
								<Link to="/algo/deadlock-detection">
									Go to Deadlock Detection
								</Link>
							</Button> */}
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					<div className="space-y-4 lg:sticky lg:top-[70px] lg:h-fit">
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
									{processCount} processes · {resourceCount} resources
								</p>
							</CardHeader>
							<CardContent className="space-y-5">
								<ResourceMatrixGrid
									title="Allocation Matrix"
									helpText="Each row represents resources currently held by a process"
									rowLabels={processLabels}
									colLabels={resourceLabels}
									values={allocation}
									onChange={setAllocation}
									compact
								/>

								<ResourceMatrixGrid
									title="Max Matrix"
									helpText="Maximum claim for each process and resource type"
									rowLabels={processLabels}
									colLabels={resourceLabels}
									values={max}
									onChange={setMax}
									compact
								/>

								<ResourceMatrixGrid
									title="Available Vector"
									helpText="Free resources available in the system"
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
									<Button onClick={handleCalculate} className="flex-1 gap-1.5">
										<CalculatorIcon className="size-4" />
										Calculate
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

						<Card>
							<CardHeader className="pb-3">
								<div className="flex items-center justify-between gap-3">
									<CardTitle className="text-base">Test a Request</CardTitle>
									<Button
										variant="ghost"
										size="sm"
										className="h-7 text-xs"
										onClick={() => setShowRequest((value) => !value)}
										disabled={!input}>
										{showRequest ? "Hide" : "Show"}
									</Button>
								</div>
							</CardHeader>
							{showRequest && input ? (
								<CardContent className="space-y-4">
									<div className="space-y-2">
										<Label className="text-sm font-medium">Process</Label>
										<Select
											value={String(requestProcessId)}
											onValueChange={(value) =>
												setRequestProcessId(Number(value))
											}>
											<SelectTrigger>
												<SelectValue placeholder="Select process" />
											</SelectTrigger>
											<SelectContent>
												{processLabels.map((label, index) => (
													<SelectItem key={label} value={String(index)}>
														{label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<ResourceMatrixGrid
										title="Request Vector"
										helpText={`Resources requested by ${processLabels[requestProcessId] ?? `P${requestProcessId}`}`}
										rowLabels={["Request"]}
										colLabels={resourceLabels}
										values={[requestVector]}
										onChange={(nextValues) =>
											setRequestVector(
												nextValues[0] ?? createVector(resourceCount),
											)
										}
										compact
									/>

									<Button
										onClick={handleTestRequest}
										className="w-full gap-1.5"
										variant="secondary">
										Test Request
									</Button>
								</CardContent>
							) : (
								<CardContent>
									<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
										<InfoIcon className="size-3.5" />
										Run Calculate first
									</p>
								</CardContent>
							)}
						</Card>
					</div>

					<div className="space-y-5 lg:col-span-2">
						{!safeResult && !error && (
							<div className="flex min-h-75 flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center text-muted-foreground">
								<ShieldCheckIcon className="mb-4 size-12 opacity-20" />
								<p className="mb-1 text-base font-medium">No results yet</p>
								<p className="text-sm">
									Fill in the matrices and click Calculate
								</p>
							</div>
						)}

						{safeResult && (
							<>
								<Card
									className={cn(
										"border-2",
										safeResult.safe
											? "border-emerald-500/30"
											: "border-destructive/30",
									)}>
									<CardContent className="pb-4 pt-5">
										<div className="mb-3 flex items-center gap-3">
											{safeResult.safe ? (
												<ShieldCheckIcon className="size-8 text-emerald-500" />
											) : (
												<ShieldXIcon className="size-8 text-destructive" />
											)}
											<div>
												<p className="text-lg font-bold">
													{safeResult.safe ? "Safe State" : "Unsafe State"}
												</p>
												<p className="text-sm text-muted-foreground">
													{safeResult.safe
														? "A safe sequence exists — no deadlock possible"
														: "No safe sequence found — potential deadlock"}
												</p>
											</div>
										</div>

										{safeResult.safe && safeResult.sequence.length > 0 && (
											<>
												<Separator className="my-3" />
												<div>
													<p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
														Safe Sequence
													</p>
													<div className="flex flex-wrap items-center gap-1.5">
														{safeResult.sequence.map((pid, index) => (
															<span
																key={pid}
																className="flex items-center gap-1">
																<span className="rounded-full bg-emerald-500/15 px-3 py-1 font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400">
																	P{pid}
																</span>
																{index < safeResult.sequence.length - 1 && (
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

								<Card>
									<CardHeader className="pb-3">
										<CardTitle className="text-base">
											Step-by-Step Trace
										</CardTitle>
										<p className="text-xs text-muted-foreground">
											{safeResult.steps.length} steps — shows Work vector
											progression
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

								{needMatrixForDisplay && (
									<Card>
										<CardHeader className="pb-3">
											<CardTitle className="text-base">Need Matrix</CardTitle>
											<p className="text-xs text-muted-foreground">
												Need[i][j] = Max[i][j] − Allocation[i][j]
											</p>
										</CardHeader>
										<CardContent>
											<MatrixDisplay
												matrix={needMatrixForDisplay}
												rowLabels={processLabels}
												colLabels={resourceLabels}
												cellClassName={(_, __, value) =>
													value === 0 ? "text-muted-foreground" : undefined
												}
											/>
										</CardContent>
									</Card>
								)}
							</>
						)}

						{requestResult && (
							<Card
								className={cn(
									"border-2",
									requestResult.granted
										? "border-emerald-500/30"
										: "border-amber-500/30",
								)}>
								<CardHeader className="pb-3">
									<CardTitle className="text-base">Request Result</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									<div className="flex items-center gap-2">
										<span
											className={cn(
												"rounded-full px-3 py-1 text-sm font-semibold",
												requestResult.granted
													? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
													: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
											)}>
											{requestResult.granted
												? "✓ Request Granted"
												: "✗ Request Denied"}
										</span>
									</div>
									{requestResult.reason && (
										<p className="text-sm text-muted-foreground">
											{requestResult.reason}
										</p>
									)}
									{requestResult.granted && requestResult.newState && (
										<div className="space-y-2 pt-1">
											<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
												New Safe Sequence After Grant
											</p>
											<div className="flex flex-wrap items-center gap-1.5">
												{requestResult.newState.safeSequenceResult.sequence.map(
													(pid, index, sequence) => (
														<span key={pid} className="flex items-center gap-1">
															<span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
																P{pid}
															</span>
															{index < sequence.length - 1 && (
																<ArrowRightIcon className="size-3 text-muted-foreground" />
															)}
														</span>
													),
												)}
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
