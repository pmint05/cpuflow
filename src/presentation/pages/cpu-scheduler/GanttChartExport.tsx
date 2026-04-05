import { Button } from '@components/ui/button';
import { useGanttChart } from '@presentation/hooks/useGanttChart';
import type { GanttBlock } from '@domain/types/cpu-scheduling';

interface GanttChartExportProps {
  blocks: GanttBlock[];
}

export function GanttChartExport({ blocks }: GanttChartExportProps) {
  const { exportToPNG } = useGanttChart();

  const handleExport = () => {
    if (blocks.length === 0) return;
    exportToPNG();
  };

  return (
    <Button
      onClick={handleExport}
      variant="outline"
      disabled={blocks.length === 0}
    >
      Export to PNG
    </Button>
  );
}
