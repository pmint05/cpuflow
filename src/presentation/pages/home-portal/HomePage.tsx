import { Link } from 'react-router-dom';
import { CpuIcon, ShieldCheckIcon, AlertTriangleIcon, ArrowRightIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';

const SIMULATORS = [
  {
    title: 'CPU Scheduler',
    description:
      'Simulate and compare CPU scheduling algorithms including FCFS, SJF, Round Robin, Priority, and Multi-Level Queue with interactive Gantt charts.',
    icon: CpuIcon,
    path: '/cpu-scheduler',
    features: [
      '7 scheduling algorithms',
      'Interactive Gantt chart',
      'Multi-queue support',
      'Export to PNG',
    ],
    color: 'from-blue-500/20 to-cyan-500/20',
    iconColor: 'text-blue-500',
  },
  {
    title: "Banker's Algorithm",
    description:
      'Determine safe states and evaluate resource requests using the Banker\'s Algorithm for deadlock avoidance with step-by-step visualization.',
    icon: ShieldCheckIcon,
    path: '/algo/banker',
    features: [
      'Safe sequence detection',
      'Resource request testing',
      'Step-by-step trace',
      'Matrix visualization',
    ],
    color: 'from-emerald-500/20 to-green-500/20',
    iconColor: 'text-emerald-500',
  },
  {
    title: 'Deadlock Detection',
    description:
      'Detect deadlocked processes in a resource allocation system using the Wait-For graph approach with animated detection steps.',
    icon: AlertTriangleIcon,
    path: '/algo/deadlock-detection',
    features: [
      'Deadlock detection',
      'Process identification',
      'Step-by-step trace',
      'Work progression view',
    ],
    color: 'from-amber-500/20 to-orange-500/20',
    iconColor: 'text-amber-500',
  },
] as const;

export function HomePage() {
  return (
    <div className="p-4 lg:p-8">
      <div className="container mx-auto max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-12 pt-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <CpuIcon className="size-10 text-primary" />
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">cpuflow</h1>
          </div>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
            Interactive OS resource allocation simulators for learning and visualization.
            Explore CPU scheduling, deadlock avoidance, and deadlock detection algorithms.
          </p>
        </div>

        {/* Simulator Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {SIMULATORS.map((sim) => (
            <Card
              key={sim.path}
              className="group relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/30"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${sim.color} opacity-0 group-hover:opacity-100 transition-opacity`} />

              <CardHeader className="relative">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2.5 rounded-lg bg-accent ${sim.iconColor}`}>
                    <sim.icon className="size-6" />
                  </div>
                  <CardTitle className="text-xl">{sim.title}</CardTitle>
                </div>
              </CardHeader>

              <CardContent className="relative space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {sim.description}
                </p>

                <ul className="space-y-1.5">
                  {sim.features.map((feature) => (
                    <li key={feature} className="text-sm flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-primary/60 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link to={sim.path}>
                  <Button className="w-full mt-2 group/btn">
                    Open Simulator
                    <ArrowRightIcon className="size-4 ml-1 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
