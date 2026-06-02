import { useEffect, useMemo, useState } from 'react';
import { PageBreadcrumb } from '@presentation/components/shared/PageBreadcrumb';
import { usePageReplacement } from '@app/page-replacement/usePageReplacement';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { Textarea } from '@components/ui/textarea';
import { Badge } from '@components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { RadioGroup, RadioGroupItem } from '@components/ui/radio-group';
import { cn } from '@/lib/utils';
import { formatFrameLabel } from '@domain/algorithms/page-replacement/shared';
import { getAlgorithmName } from '@domain/algorithms/page-replacement';
import {
	decodePageReplacementConfig,
	encodePageReplacementConfig,
	type PageReplacementUrlConfig,
} from '@infra/serializers/page-replacement-config-serializer';

export function PageReplacementPage() {
	const initialUrlConfig = useMemo<PageReplacementUrlConfig>(
		() => decodePageReplacementConfig(window.location.search),
		[]
	);

	const {
		algorithm,
		setAlgorithm,
		referenceStringInput,
		setReferenceStringInput,
		frameCountsInput,
		setFrameCountsInput,
		selectedRun,
		selectedRunId,
		selectedStepIndex,
		batchResult,
		errors,
		runComparison,
		selectRun,
		nextStep,
		previousStep,
		reset,
		allAlgorithms,
	} = usePageReplacement({
		algorithm: initialUrlConfig.algorithm,
		referenceStringInput: initialUrlConfig.referenceStringInput,
		frameCountsInput: initialUrlConfig.frameCountsInput,
		selectedRunId: initialUrlConfig.selectedRunId,
	});

	const selectedRunTabs = useMemo(() => {
		if (!batchResult) return [] as Array<{ runId: string; label: string }>;
		return batchResult.runs.map((run) => ({
			runId: run.runId,
			label: `${run.frameCount} Frames`,
		}));
	}, [batchResult]);

	useEffect(() => {
		const timer = window.setTimeout(() => {
			runComparison();
		}, 250);

		return () => window.clearTimeout(timer);
	}, [algorithm, frameCountsInput, referenceStringInput, runComparison]);

	useEffect(() => {
		const timer = window.setTimeout(() => {
			const query = encodePageReplacementConfig({
				algorithm,
				referenceStringInput,
				frameCountsInput,
				selectedRunId: selectedRunId ?? '',
			});
			const nextUrl = query.length > 0 ? `${window.location.pathname}?${query}` : window.location.pathname;
			window.history.replaceState(null, '', nextUrl);
		}, 250);

		return () => window.clearTimeout(timer);
	}, [algorithm, frameCountsInput, referenceStringInput, selectedRunId]);

	return (
		<div className="p-4 lg:p-8">
			<div className="container mx-auto max-w-7xl space-y-6">
				<div className="space-y-3">
					<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Page Replacement' }]} />
					<div className="flex flex-wrap items-end justify-between gap-3">
						<div className="space-y-1">
							<h1 className="text-3xl font-bold tracking-tight">Page Replacement Visualizer</h1>
							<p className="text-sm text-muted-foreground">
								Kết quả tự chạy theo config hiện tại và được lưu lại trên URL.
							</p>
						</div>
						<div className="flex gap-2">
							<Button variant="outline" onClick={reset}>Reset</Button>
						</div>
					</div>
				</div>

				<div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
					<Card className="h-fit shadow-none">
						<CardHeader>
							<CardTitle>Configuration</CardTitle>
							<CardDescription>Chọn thuật toán, chuỗi tham chiếu và danh sách frame count.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-5">
							<div className="space-y-2">
								<Label>Algorithm</Label>
								<RadioGroup
									value={algorithm}
									onValueChange={(value) => setAlgorithm(value as never)}
									className="flex flex-wrap gap-2"
								>
									{allAlgorithms.map((item) => (
										<Label
											key={item}
											className="flex cursor-pointer items-center gap-2"
										>
											<RadioGroupItem value={item} className="sr-only hidden" />
											<Button
												variant={algorithm === item ? 'default' : 'outline'}
												size="sm"
												className="pointer-events-none"
												asChild
											>
												<span>{getAlgorithmName(item)}</span>
											</Button>
										</Label>
									))}
								</RadioGroup>
							</div>

							<div className="space-y-2">
								<Label htmlFor="reference-string">Reference string</Label>
								<Textarea
									id="reference-string"
									value={referenceStringInput}
									onChange={(event) => setReferenceStringInput(event.target.value)}
									placeholder="7, 0, 1, 2, 0, 3, 0, 4..."
									rows={5}
									className="resize-y"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="frame-counts">Frame counts</Label>
								<Input id="frame-counts" value={frameCountsInput} onChange={(event) => setFrameCountsInput(event.target.value)} placeholder="3, 4, 5" />
							</div>

							<div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
								Mỗi lần sửa config sẽ tự tính lại và đồng bộ lên URL.
							</div>

							{errors.length > 0 && (
								<div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-600 dark:text-rose-300">
									{errors.map((error) => <div key={error}>{error}</div>)}
								</div>
							)}
						</CardContent>
					</Card>

					<div className="space-y-6">
						{selectedRun && (
							<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
								<Card className="shadow-none pt-3"><CardContent className="pt-0"><div className="text-sm text-muted-foreground">Total references</div><div className="text-2xl font-semibold">{selectedRun.result.totalReferences}</div></CardContent></Card>
								<Card className="shadow-none pt-3"><CardContent className="pt-0"><div className="text-sm text-muted-foreground">Page faults</div><div className="text-2xl font-semibold">{selectedRun.result.pageFaults}</div></CardContent></Card>
								<Card className="shadow-none pt-3"><CardContent className="pt-0"><div className="text-sm text-muted-foreground">Hits</div><div className="text-2xl font-semibold">{selectedRun.result.hits}</div></CardContent></Card>
								<Card className="shadow-none pt-3"><CardContent className="pt-0"><div className="text-sm text-muted-foreground">Hit rate</div><div className="text-2xl font-semibold">{selectedRun.result.hitRate}%</div></CardContent></Card>
								<Card className="shadow-none pt-3"><CardContent className="pt-0"><div className="text-sm text-muted-foreground">Fault rate</div><div className="text-2xl font-semibold">{selectedRun.result.faultRate}%</div></CardContent></Card>
							</div>
						)}

						{batchResult && selectedRunTabs.length > 0 && (
							<Tabs value={selectedRunId ?? ''} onValueChange={(value) => selectRun(value)} className="space-y-4">
								<TabsList className="flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
									{selectedRunTabs.map((tab) => (
										<TabsTrigger key={tab.runId} value={tab.runId} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
											{tab.label}
										</TabsTrigger>
									))}
								</TabsList>

								{batchResult.runs.map((run) => {
									const currentStep = run.result.steps[selectedStepIndex] ?? run.result.steps[run.result.steps.length - 1];
									return (
										<TabsContent key={run.runId} value={run.runId} className="space-y-6">
											<Card className="shadow-none">
												<CardHeader className="space-y-2">
													<div className="flex flex-wrap items-center justify-between gap-3">
														<div>
															<CardTitle className="text-lg">{getAlgorithmName(run.algorithm)} · {run.frameCount} frames</CardTitle>
															<CardDescription>Hiển thị kết quả cho cấu hình frame hiện tại.</CardDescription>
														</div>
														<div className="flex gap-2">
															<Button variant="outline" size="sm" onClick={previousStep}>Prev</Button>
															<Button variant="outline" size="sm" onClick={nextStep}>Next</Button>
														</div>
													</div>
													<div className="flex flex-wrap gap-2">
														<Badge variant="secondary">Faults: {run.result.pageFaults}</Badge>
														<Badge variant="secondary">Hits: {run.result.hits}</Badge>
														<Badge variant="secondary">Hit rate: {run.result.hitRate}%</Badge>
														<Badge variant="secondary">Fault rate: {run.result.faultRate}%</Badge>
													</div>
												</CardHeader>
												<CardContent className="space-y-4">
													<div className="rounded-lg border bg-muted/20 p-3 text-sm">
														<div className="font-medium">{currentStep?.reason}</div>
														<div className="mt-1 text-muted-foreground">Step {Math.min(selectedStepIndex + 1, run.result.steps.length)} / {run.result.steps.length} · Page {currentStep?.referencedPage}</div>
													</div>

													<div className="overflow-auto rounded-lg border">
														<Table>
															<TableHeader>
																<TableRow>
																	<TableHead className="sticky left-0 z-20 min-w-24 bg-background">Frame</TableHead>
																	{run.result.steps.map((step) => (
																		<TableHead key={step.stepIndex} className={cn('min-w-24 text-center', step.stepIndex === selectedStepIndex && 'bg-primary/10')}>
																			<div className="flex flex-col items-center gap-1 py-1">
																				<span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">#{step.stepIndex + 1}</span>
																				<span className="font-mono text-sm">{step.referencedPage}</span>
																				<Badge variant={step.fault ? 'destructive' : 'secondary'} className="text-[10px]">{step.fault ? 'Fault' : 'Hit'}</Badge>
																			</div>
																		</TableHead>
																))}
																</TableRow>
															</TableHeader>
															<TableBody>
																{run.result.steps.length > 0 && run.result.steps[0]?.framesAfter.map((_, frameIndex) => (
																	<TableRow key={frameIndex}>
																		<TableCell className="sticky left-0 z-10 bg-background font-medium">{formatFrameLabel(frameIndex)}</TableCell>
																		{run.result.steps.map((step) => {
																			const cellValue = step.framesAfter[frameIndex];
																			const isChanged = step.changedFrameIndex === frameIndex;
																			const isSelected = selectedStepIndex === step.stepIndex;
																			return (
																				<TableCell key={`${step.stepIndex}-${frameIndex}`} className={cn('min-w-24 text-center font-mono', isSelected && 'bg-primary/5', isChanged && step.fault && 'bg-rose-500/15 text-rose-700 dark:text-rose-200', isChanged && step.hit && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200')}>
																					{cellValue === null ? '—' : cellValue}
																				</TableCell>
																			);
																		})}
																	</TableRow>
																))}
															</TableBody>
														</Table>
													</div>

													<div className="space-y-4">
														<div className="space-y-2">
															<div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Fault Sequence</div>
															<div className="flex flex-wrap gap-2">
																{run.result.faultSequence.length === 0 ? (
																	<Badge variant="outline">No faults</Badge>
																) : (
																	run.result.faultSequence.map((page, index) => (
																		<Badge key={`${run.runId}-fault-${page}-${index}`} variant="destructive">{page}</Badge>
																	))
																)}
															</div>
														</div>

														<div className="space-y-2">
															<div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Victim Sequence (Replaced Pages)</div>
															<div className="flex flex-wrap gap-2">
																{run.result.victimSequence.length === 0 ? (
																	<Badge variant="outline">No replacements</Badge>
																) : (
																	run.result.victimSequence.map((page, index) => (
																		<Badge key={`${run.runId}-victim-${page}-${index}`} variant="outline" className="border-rose-500/50 text-rose-600 dark:text-rose-400">{page}</Badge>
																	))
																)}
															</div>
														</div>
													</div>
												</CardContent>
											</Card>
										</TabsContent>
									);
								})}
							</Tabs>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}