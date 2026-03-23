/**
 * Export canvas to PNG file
 * @param canvas - HTMLCanvasElement to export
 * @param filename - Name of the file (default: gantt-chart-{timestamp}.png)
 */
export function exportCanvasToPNG(
	canvas: HTMLCanvasElement,
	filename?: string,
): void {
	const dataUrl = canvas.toDataURL("image/png");
	const link = document.createElement("a");
	console.log(dataUrl);
	link.download = filename || `gantt-chart-${Date.now()}.png`;
	link.href = dataUrl;
	link.click();
}

/**
 * Get canvas data URL
 * @param canvas - HTMLCanvasElement
 * @param format - Image format (default: 'image/png')
 * @returns Data URL string
 */
export function getCanvasDataURL(
	canvas: HTMLCanvasElement,
	format: string = "image/png",
): string {
	return canvas.toDataURL(format);
}

/**
 * Copy canvas to clipboard
 * @param canvas - HTMLCanvasElement to copy
 */
export async function copyCanvasToClipboard(
	canvas: HTMLCanvasElement,
): Promise<void> {
	try {
		const blob = await new Promise<Blob>((resolve, reject) => {
			canvas.toBlob((blob) => {
				if (blob) {
					resolve(blob);
				} else {
					reject(new Error("Failed to create blob from canvas"));
				}
			}, "image/png");
		});

		await navigator.clipboard.write([
			new ClipboardItem({
				"image/png": blob,
			}),
		]);
	} catch (error) {
		console.error("Failed to copy canvas to clipboard:", error);
		throw error;
	}
}
