import { useState, type ReactNode } from 'react';
import { Button } from '@components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { Slider } from '@components/ui/slider';
import { Label } from '@components/ui/label';
import { Switch } from '@components/ui/switch';

interface DiskExportDialogProps {
  trigger?: ReactNode;
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

export function DiskExportDialog({ trigger, onExport }: DiskExportDialogProps) {
  const [format, setFormat] = useState<'PNG' | 'JPEG'>('PNG');
  const [quality, setQuality] = useState(0.92);
  const [scale, setScale] = useState(2);
  const [includeGhost, setIncludeGhost] = useState(true);
  const [includeAcademic, setIncludeAcademic] = useState(true);
  const [includeGrid, setIncludeGrid] = useState(true);
  const [includeHead, setIncludeHead] = useState(true);
  const [highlightCurrent, setHighlightCurrent] = useState(true);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline" size="sm">Export</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Disk Visualization</DialogTitle>
          <DialogDescription>
            Configure image output options for the current simulation state.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground">Format</Label>
              <Select value={format} onValueChange={(value) => setFormat(value as 'PNG' | 'JPEG')}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PNG">PNG</SelectItem>
                  <SelectItem value="JPEG">JPEG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground">Scale ({scale.toFixed(1)}x)</Label>
              <Slider
                value={[scale]}
                min={1}
                max={4}
                step={0.5}
                onValueChange={(value) => setScale(value[0] ?? 2)}
                className="py-2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground text-right block">Quality ({Math.round(quality * 100)}%)</Label>
            <Slider
              value={[quality]}
              min={0.1}
              max={1}
              step={0.01}
              onValueChange={(value) => setQuality(value[0] ?? 0.92)}
            />
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Include Background Grid</Label>
              <Switch checked={includeGrid} onCheckedChange={setIncludeGrid} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Include Disk Head</Label>
              <Switch checked={includeHead} onCheckedChange={setIncludeHead} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Highlight Current Cylinder</Label>
              <Switch checked={highlightCurrent} onCheckedChange={setHighlightCurrent} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Include Ghost Path</Label>
              <Switch checked={includeGhost} onCheckedChange={setIncludeGhost} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            className="w-full"
            onClick={() =>
              onExport({
                format,
                quality,
                scale,
                includeGhost,
                includeAcademic,
                includeGrid,
                includeHead,
                highlightCurrent,
              })
            }
          >
            Export Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
