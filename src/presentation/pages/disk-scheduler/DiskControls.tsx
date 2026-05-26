import { Button } from '@components/ui/button';

interface DiskControlsProps {
  academicEnabled: boolean;
  explainEnabled: boolean;
  onToggleAcademic: () => void;
  onToggleExplain: () => void;
}

export function DiskControls({
  academicEnabled,
  explainEnabled,
  onToggleAcademic,
  onToggleExplain,
}: DiskControlsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={onToggleAcademic}>
        Academic: {academicEnabled ? 'On' : 'Off'}
      </Button>
      <Button variant="outline" size="sm" onClick={onToggleExplain}>
        Explain: {explainEnabled ? 'On' : 'Off'}
      </Button>
    </div>
  );
}
