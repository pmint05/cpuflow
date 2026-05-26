import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DiskComparisonMetrics } from '@domain/types/disk-scheduling';

interface DiskAlgorithmComparisonProps {
  metrics: DiskComparisonMetrics[];
  onAlgorithmSelect?: (algorithm: DiskComparisonMetrics['algorithm']) => void;
}

export function DiskAlgorithmComparison({ metrics, onAlgorithmSelect }: DiskAlgorithmComparisonProps) {
  return (
    <Card className="shadow-none border-none bg-transparent">
      <CardHeader className="px-0">
        <CardTitle className="text-lg font-bold tracking-tight">Algorithm Comparison</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={metrics}
              barGap={12}
              onClick={(state) => {
                const payload = state?.activePayload?.[0]?.payload as DiskComparisonMetrics | undefined;
                if (payload && onAlgorithmSelect) {
                  onAlgorithmSelect(payload.algorithm);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis 
                dataKey="algorithm" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.2)', boxShadow: 'none', backgroundColor: "var(--card)" }}
              />
              <Legend 
                verticalAlign="bottom" 
                align="center" 
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ paddingTop: '30px' }}
                formatter={(value: string) => (
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mr-8 last:mr-0">
                    {value}
                  </span>
                )}
              />
              <Bar 
                dataKey="totalSeekDistance" 
                fill="#3b82f6" 
                name="Total Seek" 
                radius={[4, 4, 0, 0]}
                barSize={32}
              />
              <Bar 
                dataKey="averageSeekDistance" 
                fill="#10b981" 
                name="Average Seek" 
                radius={[4, 4, 0, 0]}
                barSize={32}
              />
              <Bar 
                dataKey="maxJump" 
                fill="#f59e0b" 
                name="Max Jump" 
                radius={[4, 4, 0, 0]}
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
