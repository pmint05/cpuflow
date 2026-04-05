import { Input } from "@components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@components/ui/table";
import { cn } from "@/lib/utils";
import type { ResourceCellValue } from "./resource-matrix-utils";

interface ResourceMatrixGridProps {
	title: string;
	rowLabels: string[];
	colLabels: string[];
	values: ResourceCellValue[][];
	onChange: (nextValues: ResourceCellValue[][]) => void;
	errorMessage?: string | null;
	helpText?: string;
	className?: string;
	compact?: boolean;
}

export function ResourceMatrixGrid({
	title,
	rowLabels,
	colLabels,
	values,
	onChange,
	errorMessage,
	helpText,
	className,
	compact = false,
}: ResourceMatrixGridProps) {
	const cellSize = compact ? "w-16 h-8" : "w-20 h-10";
	const labelSize = compact ? "text-xs" : "text-sm";
	const normalizedValues = Array.from(
		{ length: rowLabels.length },
		(_, rowIndex) => {
			const row = values[rowIndex] ?? [];
			return Array.from(
				{ length: colLabels.length },
				(_, colIndex) => row[colIndex] ?? 0,
			);
		},
	);

	const updateCell = (
		rowIndex: number,
		colIndex: number,
		nextValue: string,
	) => {
		const parsedValue = nextValue === "" ? 0 : Number(nextValue);
		if (!Number.isFinite(parsedValue) || parsedValue < 0) return;

		const nextValues = normalizedValues.map((row, currentRow) =>
			row.map((cell, currentCol) =>
				currentRow === rowIndex && currentCol === colIndex ? parsedValue : cell,
			),
		);
		onChange(nextValues);
	};

	return (
		<div className={cn("space-y-2", className)}>
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-sm font-semibold">{title}</p>
					{helpText && (
						<p className="text-xs text-muted-foreground">{helpText}</p>
					)}
				</div>
				{errorMessage ? (
					<span className="text-xs font-medium text-destructive">
						{errorMessage}
					</span>
				) : null}
			</div>

			{/* <div className="overflow-auto rounded-lg border max-h-96"> */}
			<Table
				className="min-w-max border-separate border-spacing-0"
				containerClassName="h-fit max-h-80 overflow-y-auto relative">
				<TableHeader>
					<TableRow>
						{/* ✅ Corner cell: fixed cả trục X lẫn Y */}
						<TableHead
							className={cn(
								"sticky left-0 top-0 z-50 w-px min-w-10 whitespace-nowrap bg-background px-2 font-mono text-muted-foreground border-b border-r",
								labelSize,
							)}
						/>
						{colLabels.map((label, index) => (
							<TableHead
								key={`${label}-${index}`}
								className={cn(
									// ✅ sticky top-0 trực tiếp trên th — không phải trên thead/tr
									"sticky top-0 z-40 bg-background text-center font-mono text-muted-foreground border-b",
									labelSize,
									cellSize,
								)}>
								{label}
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{normalizedValues.map((row, rowIndex) => (
						<TableRow key={`row-${rowIndex}`} className="hover:bg-transparent">
							{/* ✅ Row label: chỉ sticky trục X */}
							<TableHead
								scope="row"
								className={cn(
									"sticky left-0 z-30 w-px min-w-10 whitespace-nowrap bg-background px-2 font-mono text-muted-foreground border-r",
									labelSize,
								)}>
								{rowLabels[rowIndex] ?? `R${rowIndex}`}
							</TableHead>
							{row.map((value, colIndex) => (
								<TableCell
									key={`${rowIndex}-${colIndex}`}
									className={cn("bg-background p-1 z-10", cellSize)}>
									<Input
										type="number"
										min={0}
										step={1}
										value={value}
										onChange={(event) =>
											updateCell(rowIndex, colIndex, event.target.value)
										}
										className={cn(
											"h-8! w-14! p-0! border-0 bg-transparent text-right font-mono text-sm shadow-none focus-visible:ring-1 transition ring-ring/15 ring-1",
											cellSize,
										)}
									/>
								</TableCell>
							))}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
		// </div>
	);
}
