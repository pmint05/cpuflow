export type ResourceCellValue = number;

export function createMatrix(
	rows: number,
	cols: number,
	fillValue = 0,
): ResourceCellValue[][] {
	return Array.from({ length: rows }, () =>
		Array.from({ length: cols }, () => fillValue),
	);
}

export function createVector(length: number, fillValue = 0): ResourceCellValue[] {
	return Array.from({ length }, () => fillValue);
}

export function resizeMatrix(
	matrix: ResourceCellValue[][],
	rows: number,
	cols: number,
	fillValue = 0,
): ResourceCellValue[][] {
	return Array.from({ length: rows }, (_, rowIndex) =>
		Array.from({ length: cols }, (_, colIndex) =>
			matrix[rowIndex]?.[colIndex] ?? fillValue,
		),
	);
}

export function resizeVector(
	vector: ResourceCellValue[],
	length: number,
	fillValue = 0,
): ResourceCellValue[] {
	return Array.from({ length }, (_, index) => vector[index] ?? fillValue);
}

export function matrixToString(matrix: ResourceCellValue[][]): string {
	return matrix.map((row) => row.join(',')).join('\n');
}

export function vectorToString(vector: ResourceCellValue[]): string {
	return vector.join(',');
}

export function makeLabels(count: number, prefix: string): string[] {
	return Array.from({ length: count }, (_, index) => `${prefix}${index}`);
}
