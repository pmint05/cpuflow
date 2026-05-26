import { Button } from '@components/ui/button';

interface GhostPathToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export function GhostPathToggle({ enabled, onToggle }: GhostPathToggleProps) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div>
        <p className="text-sm font-medium">Ghost Preview Path</p>
        <p className="text-xs text-muted-foreground">
          Toggle future traversal preview layer.
        </p>
      </div>
      <Button size="sm" variant={enabled ? 'default' : 'outline'} onClick={onToggle}>
        {enabled ? 'On' : 'Off'}
      </Button>
    </div>
  );
}
