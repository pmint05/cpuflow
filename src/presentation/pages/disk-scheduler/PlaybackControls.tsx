import { Button } from "@components/ui/button";
import { Slider } from "@components/ui/slider";
import {
	ChevronFirst,
	ChevronLast,
	ChevronLeft,
	ChevronRight,
	Play,
	Pause,
} from "lucide-react";

interface PlaybackControlsProps {
	isPlaying: boolean;
	step: number;
	maxStep: number;
	speed: number;
	onPlay: () => void;
	onPause: () => void;
	onNext: () => void;
	onPrevious: () => void;
	onSeek: (step: number) => void;
	onSpeedChange: (speed: number) => void;
}

const SPEEDS = [0.25, 0.5, 1, 2, 4] as const;

export function PlaybackControls({
	isPlaying,
	step,
	maxStep,
	speed,
	onPlay,
	onPause,
	onNext,
	onPrevious,
	onSeek,
	onSpeedChange,
}: PlaybackControlsProps) {
	return (
		<div className="space-y-3 rounded-xl border bg-card p-3 shadow-sm">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex flex-wrap items-center gap-1.5">
					<Button
						size="sm"
						variant="outline"
						onClick={() => onSeek(0)}
						disabled={step === 0}
						className="gap-1 h-7 px-2">
						<ChevronFirst className="size-3.5" />
						<span className="hidden sm:inline">First</span>
					</Button>

					<Button
						size="sm"
						variant="outline"
						onClick={onPrevious}
						disabled={step === 0}
						className="gap-1 h-7 px-2">
						<ChevronLeft className="size-3.5" />
						<span className="hidden sm:inline">Prev</span>
					</Button>

					<Button
						size="sm"
						onClick={isPlaying ? onPause : onPlay}
						className="gap-1 h-7 px-3 min-w-[70px]">
						{isPlaying ? (
							<>
								<Pause className="size-3.5 fill-current" />
								<span>Pause</span>
							</>
						) : (
							<>
								<Play className="size-3.5 fill-current" />
								<span>Play</span>
							</>
						)}
					</Button>

					<Button
						size="sm"
						variant="outline"
						onClick={onNext}
						disabled={step === maxStep}
						className="gap-1 h-7 px-2">
						<span className="hidden sm:inline">Next</span>
						<ChevronRight className="size-3.5" />
					</Button>

					<Button
						size="sm"
						variant="outline"
						onClick={() => onSeek(maxStep)}
						disabled={step === maxStep}
						className="gap-1 h-7 px-2">
						<span className="hidden sm:inline">Last</span>
						<ChevronLast className="size-3.5" />
					</Button>
				</div>

				<div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded-md border border-border/50">
					<span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
						Progress
					</span>
					<span className="font-mono text-xs font-bold">
						{step} <span className="text-muted-foreground/50">/</span> {maxStep}
					</span>
				</div>
			</div>

			<div className="px-1 py-1">
				<Slider
					value={[step]}
					min={0}
					max={Math.max(maxStep, 0)}
					step={1}
					onValueChange={(value) => onSeek(value[0] ?? 0)}
					className="cursor-pointer"
				/>
			</div>

			<div className="flex flex-wrap items-center gap-2 pt-0.5">
				<span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
					Speed
				</span>
				<div className="flex flex-wrap gap-1">
					{SPEEDS.map((candidate) => (
						<Button
							key={candidate}
							size="xs"
							variant={candidate === speed ? "default" : "ghost"}
							onClick={() => onSpeedChange(candidate)}
							className="h-6 w-11 text-[10px] font-bold">
							{candidate}x
						</Button>
					))}
				</div>
			</div>
		</div>
	);
}
