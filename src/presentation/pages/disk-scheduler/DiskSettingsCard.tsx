import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Label } from '@components/ui/label';
import { Switch } from '@components/ui/switch';
import { Slider } from '@components/ui/slider';
import type { DiskSchedulingAlgorithm } from '@domain/types/disk-scheduling';

interface DiskSettingsCardProps {
  algorithm: DiskSchedulingAlgorithm;
  ghostEnabled: boolean;
  academicEnabled: boolean;
  scannerEnabled: boolean;
  includeEdges: boolean;
  showGrid: boolean;
  showHead: boolean;
  highlightCurrent: boolean;
  markerLabelSize: number;
  tickLabelSize: number;
  verticalSpacing: number;
  showMarkerLabels: boolean;
  showTickLabels: boolean;
  showSequenceTicks: boolean;
  onGhostChange: (value: boolean) => void;
  onAcademicChange: (value: boolean) => void;
  onScannerChange: (value: boolean) => void;
  onIncludeEdgesChange: (value: boolean) => void;
  onShowGridChange: (value: boolean) => void;
  onShowHeadChange: (value: boolean) => void;
  onHighlightCurrentChange: (value: boolean) => void;
  onMarkerLabelSizeChange: (value: number) => void;
  onTickLabelSizeChange: (value: number) => void;
  onVerticalSpacingChange: (value: number) => void;
  onShowMarkerLabelsChange: (value: boolean) => void;
  onShowTickLabelsChange: (value: boolean) => void;
  onShowSequenceTicksChange: (value: boolean) => void;
}

export function DiskSettingsCard({
  algorithm,
  ghostEnabled,
  academicEnabled,
  scannerEnabled,
  includeEdges,
  showGrid,
  showHead,
  highlightCurrent,
  markerLabelSize,
  tickLabelSize,
  verticalSpacing,
  showMarkerLabels,
  showTickLabels,
  showSequenceTicks,
  onGhostChange,
  onAcademicChange,
  onScannerChange,
  onIncludeEdgesChange,
  onShowGridChange,
  onShowHeadChange,
  onHighlightCurrentChange,
  onMarkerLabelSizeChange,
  onTickLabelSizeChange,
  onVerticalSpacingChange,
  onShowMarkerLabelsChange,
  onShowTickLabelsChange,
  onShowSequenceTicksChange,
}: DiskSettingsCardProps) {
  const showIncludeEdges = algorithm === 'SCAN' || algorithm === 'C_SCAN';

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Visualization Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm font-medium">Scanner Head Mode</Label>
            <Switch checked={scannerEnabled} onCheckedChange={onScannerChange} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm font-medium">Ghost Preview Path</Label>
            <Switch checked={ghostEnabled} onCheckedChange={onGhostChange} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm font-medium">Academic Mode</Label>
            <Switch checked={academicEnabled} onCheckedChange={onAcademicChange} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm font-medium">Show Background Grid</Label>
            <Switch checked={showGrid} onCheckedChange={onShowGridChange} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm font-medium">Show Disk Head</Label>
            <Switch checked={showHead} onCheckedChange={onShowHeadChange} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm font-medium">Highlight Current</Label>
            <Switch checked={highlightCurrent} onCheckedChange={onHighlightCurrentChange} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm font-medium">Show Marker Labels</Label>
            <Switch checked={showMarkerLabels} onCheckedChange={onShowMarkerLabelsChange} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm font-medium">Show Tick Labels</Label>
            <Switch checked={showTickLabels} onCheckedChange={onShowTickLabelsChange} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm font-medium">Show Sequence Ticks</Label>
            <Switch checked={showSequenceTicks} onCheckedChange={onShowSequenceTicksChange} />
          </div>

          {showIncludeEdges && (
            <div className="flex items-center justify-between gap-4">
              <Label className="text-sm font-medium">Include Disk Edges</Label>
              <Switch checked={includeEdges} onCheckedChange={onIncludeEdgesChange} />
            </div>
          )}
        </div>

        <div className="space-y-4 pt-2 border-t mt-4">
          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm font-medium">Marker Label Size</Label>
            <span className="text-xs font-mono font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
              {markerLabelSize}px
            </span>
          </div>
          <Slider
            min={10}
            max={20}
            step={1}
            value={[markerLabelSize]}
            onValueChange={([value]) => onMarkerLabelSizeChange(value)}
            className="py-2"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm font-medium">Tick Label Size</Label>
            <span className="text-xs font-mono font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
              {tickLabelSize}px
            </span>
          </div>
          <Slider
            min={8}
            max={32}
            step={1}
            value={[tickLabelSize]}
            onValueChange={([value]) => onTickLabelSizeChange(value)}
            className="py-2"
          />
        </div>

        <div className="space-y-4 pt-2 border-t">
          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm font-medium">Vertical Spacing (Y)</Label>
            <span className="text-xs font-mono font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
              {verticalSpacing}px
            </span>
          </div>
          <Slider
            min={40}
            max={200}
            step={5}
            value={[verticalSpacing]}
            onValueChange={([value]) => onVerticalSpacingChange(value)}
            className="py-2"
          />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Adjust the spacing between seek steps and toggle various axis labels.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
