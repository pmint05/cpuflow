export type DiskExportFormat = 'image/png' | 'image/jpeg';

export interface DiskExportOptions {
  format: DiskExportFormat;
  quality?: number;
  pixelRatio?: number;
  fileName?: string;
}

export function downloadDataUrl(dataUrl: string, fileName: string): void {
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = fileName;
  anchor.click();
}
