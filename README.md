# cpuflow

cpuflow is an interactive CPU scheduling simulator built with React, TypeScript, and Vite.

## Features

- Simulate major CPU scheduling algorithms:
  - FCFS
  - SJF (Preemptive and Non-preemptive)
  - Round Robin
  - Priority (Preemptive and Non-preemptive)
  - Multi-level Queue
- Visualize execution with dynamic Gantt charts
- Compare scheduling metrics:
  - Waiting time
  - Turnaround time
  - Completion time
  - Throughput and utilization insights
- Customize process names, quantum, priorities, and chart rendering options
- Export rendered Gantt charts

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Recharts

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run linting
- `npm run type-check` - Run TypeScript checks
- `npm run deploy` - Deploy to Vercel production

## Deployment URL

- https://cpuflow.vercel.app
