import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@components/ui/button";
import { Slider } from "@components/ui/slider";
import { StepCard } from "./StepCard";
import type { StepTrace } from "@domain/types/resource-allocation";
import {
	PlayIcon,
	PauseIcon,
	SkipBackIcon,
	SkipForwardIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SPEED_OPTIONS = [
	{ label: "0.5×", ms: 2000 },
	{ label: "1×", ms: 1000 },
	{ label: "2×", ms: 500 },
	{ label: "3×", ms: 333 },
] as const;

interface StepViewerProps {
	steps: StepTrace[];
	processCount: number;
	processLabels?: string[];
	resourceLabels?: string[];
	variant?: "banker" | "deadlock";
	className?: string;
}

const fadeVariants = {
	enter: { opacity: 0 },
	center: { opacity: 1 },
	exit: { opacity: 0 },
};

export function StepViewer({
	steps,
	processCount,
	processLabels,
	resourceLabels,
	variant = "banker",
	className,
}: StepViewerProps) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [playing, setPlaying] = useState(false);
	const [speedIndex, setSpeedIndex] = useState(1); // default 1×
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const speed = SPEED_OPTIONS[speedIndex].ms;
	const total = steps.length;

	const pLabels = useMemo(
		() =>
			processLabels ?? Array.from({ length: processCount }, (_, i) => `P${i}`),
		[processCount, processLabels],
	);
	const rLabels = useMemo(
		() =>
			resourceLabels ??
			Array.from({ length: steps[0]?.work.length ?? 0 }, (_, i) => `R${i}`),
		[resourceLabels, steps],
	);

	const goTo = useCallback(
		(idx: number) => {
			setCurrentIndex(Math.max(0, Math.min(total - 1, idx)));
		},
		[total],
	);

	const prev = useCallback(() => {
		setPlaying(false);
		goTo(currentIndex - 1);
	}, [currentIndex, goTo]);
	const next = useCallback(() => {
		goTo(currentIndex + 1);
	}, [currentIndex, goTo]);
	const first = useCallback(() => {
		setPlaying(false);
		goTo(0);
	}, [goTo]);
	const last = useCallback(() => {
		setPlaying(false);
		goTo(total - 1);
	}, [goTo, total]);

	// Auto-play
	useEffect(() => {
		if (intervalRef.current) clearInterval(intervalRef.current);
		if (!playing) return;
		intervalRef.current = setInterval(() => {
			setCurrentIndex((prev) => {
				if (prev >= total - 1) {
					setPlaying(false);
					return prev;
				}
				return prev + 1;
			});
		}, speed);
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [playing, speed, total]);

	// Reset on steps change (new calculation)
	useEffect(() => {
		setCurrentIndex(0);
		setPlaying(false);
	}, [steps]);

	const step = steps[currentIndex];
	if (!step) return null;

	const sliderValue = [total === 1 ? 0 : currentIndex];

	return (
		<div
			className={cn("space-y-3", className)}
			role="region"
			aria-label="Step-by-step trace viewer">
			<div>
				{/* Controls */}
				<div
					className="flex items-center justify-center gap-2"
					role="toolbar"
					aria-label="Playback controls">
					<Button
						variant="outline"
						size="sm"
						onClick={first}
						disabled={currentIndex === 0}
						className="size-8 p-0"
						aria-label="First step">
						<SkipBackIcon className="size-3.5" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={prev}
						disabled={currentIndex === 0}
						className="size-8 p-0"
						aria-label="Previous step">
						<ChevronLeftIcon className="size-4" />
					</Button>
					<Button
						size="sm"
						onClick={() => setPlaying((p) => !p)}
						disabled={currentIndex >= total - 1 && !playing}
						className="px-4 gap-1.5"
						aria-label={playing ? "Pause auto-play" : "Start auto-play"}>
						{playing ? (
							<PauseIcon className="size-3.5" />
						) : (
							<PlayIcon className="size-3.5" />
						)}
						{playing ? "Pause" : "Play"}
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={next}
						disabled={currentIndex >= total - 1}
						className="size-8 p-0"
						aria-label="Next step">
						<ChevronRightIcon className="size-4" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={last}
						disabled={currentIndex >= total - 1}
						className="size-8 p-0"
						aria-label="Last step">
						<SkipForwardIcon className="size-3.5" />
					</Button>
				</div>
				{/* Header: step counter + speed controls */}
				<div className="flex items-center justify-between gap-2 flex-wrap">
					<span className="text-sm text-muted-foreground font-mono">
						Step{" "}
						<span className="text-foreground font-semibold">
							{currentIndex + 1}
						</span>{" "}
						/ {total}
					</span>
					<div className="flex items-center gap-1">
						{SPEED_OPTIONS.map((opt, i) => (
							<button
								key={opt.label}
								onClick={() => setSpeedIndex(i)}
								aria-label={`Set speed to ${opt.label}`}
								aria-pressed={i === speedIndex}
								className={cn(
									"px-2 py-0.5 rounded text-xs font-mono transition-colors",
									i === speedIndex
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:bg-accent hover:text-foreground",
								)}>
								{opt.label}
							</button>
						))}
					</div>
				</div>
				{/* Progress slider */}
				<div className="space-y-1.5 mt-2">
					<Slider
						value={sliderValue}
						min={0}
						max={Math.max(total - 1, 0)}
						step={1}
						onValueChange={(value) => {
							setPlaying(false);
							goTo(value[0] ?? 0);
						}}
						aria-label="Step progress"
					/>
					<div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
						<span>Start</span>
						<span>End</span>
					</div>
				</div>
			</div>

			{/* Animated step card */}
			<div className="relative">
				<AnimatePresence mode="wait" initial={false}>
					<motion.div
						key={currentIndex}
						variants={fadeVariants}
						initial="enter"
						animate="center"
						exit="exit"
						transition={{ duration: 0.1, ease: "easeInOut" }}>
						<StepCard
							step={step}
							processCount={processCount}
							processLabels={pLabels}
							resourceLabels={rLabels}
							variant={variant}
						/>
					</motion.div>
				</AnimatePresence>
			</div>
		</div>
	);
}
