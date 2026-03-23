import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SchedulerResult } from '@/types/scheduler';

interface ResultsTableProps {
  result: SchedulerResult;
  showPriority?: boolean;
}

export function ResultsTable({ result, showPriority = false }: ResultsTableProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Process</TableHead>
              <TableHead className="text-right">Arrival</TableHead>
              <TableHead className="text-right">Burst</TableHead>
              {showPriority && <TableHead className="text-right">Priority</TableHead>}
              <TableHead className="text-right">Waiting</TableHead>
              <TableHead className="text-right">Turnaround</TableHead>
              <TableHead className="text-right">Response</TableHead>
              <TableHead className="text-right">Completion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.processes.map((process) => (
              <TableRow key={process.processId}>
                <TableCell className="font-medium">{process.processName}</TableCell>
                <TableCell className="text-right">{process.arrivalTime}</TableCell>
                <TableCell className="text-right">{process.burstTime}</TableCell>
                {showPriority && (
                  <TableCell className="text-right">{process.priority ?? '-'}</TableCell>
                )}
                <TableCell className="text-right">{process.waitingTime.toFixed(2)}</TableCell>
                <TableCell className="text-right">{process.turnaroundTime.toFixed(2)}</TableCell>
                <TableCell className="text-right">{process.responseTime.toFixed(2)}</TableCell>
                <TableCell className="text-right">{process.completionTime}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Avg Waiting Time</div>
          <div className="text-2xl font-semibold">{result.averageWaitingTime.toFixed(2)}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Avg Turnaround</div>
          <div className="text-2xl font-semibold">{result.averageTurnaroundTime.toFixed(2)}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Avg Response</div>
          <div className="text-2xl font-semibold">{result.averageResponseTime.toFixed(2)}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">CPU Utilization</div>
          <div className="text-2xl font-semibold">{result.cpuUtilization.toFixed(2)}%</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Throughput</div>
          <div className="text-2xl font-semibold">{result.throughput.toFixed(2)}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Context Switches</div>
          <div className="text-2xl font-semibold">{result.contextSwitches}</div>
        </div>
      </div>
    </div>
  );
}
