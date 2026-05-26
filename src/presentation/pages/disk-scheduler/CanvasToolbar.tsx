import { DownloadIcon, Maximize2Icon, RotateCcwIcon } from 'lucide-react';
import { Button } from '@components/ui/button';
import { DiskExportDialog } from './DiskExportDialog';

interface CanvasToolbarProps {
  onResetView: () => void;
  onFitToScreen: () => void;
  onExport: (options: {
    format: 'PNG' | 'JPEG';
    quality: number;
    scale: number;
    includeGhost: boolean;
    includeAcademic: boolean;
    includeGrid: boolean;
    includeHead: boolean;
    highlightCurrent: boolean;
  }) => void;
}

export function CanvasToolbar({ onResetView, onFitToScreen, onExport }: CanvasToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button type="button" variant="outline" size="sm" onClick={onFitToScreen}>
        <Maximize2Icon className="mr-2 size-4" />
        Fit to Screen
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onResetView}>
        <RotateCcwIcon className="mr-2 size-4" />
        Reset View
      </Button>
      <DiskExportDialog
        trigger={
          <Button type="button" variant="outline" size="sm">
            <DownloadIcon className="mr-2 size-4" />
            Export
          </Button>
        }
        onExport={onExport}
      />
    </div>
  );
}
