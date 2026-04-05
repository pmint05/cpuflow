# cpuflow

**cpuflow** is an interactive OS resource allocation simulator suite built with React 19, TypeScript, and Vite. It provides three distinct simulators for learning and visualizing core operating systems algorithms.

## Simulators

| Simulator | Route | Description |
|---|---|---|
| **CPU Scheduler** | `/cpu-scheduler` | Simulate & compare 7 scheduling algorithms with interactive Gantt charts |
| **Banker's Algorithm** | `/algo/banker` | Deadlock avoidance — find safe sequences and test resource requests |
| **Deadlock Detection** | `/algo/deadlock-detection` | Detect deadlocked processes using resource-allocation graph reduction |

All simulators persist configuration in the URL as base64-encoded JSON — shareable links work out of the box.

---

## CPU Scheduler Features

- **7 algorithms**: FCFS, SJF (non-preemptive), SRTF (preemptive SJF), Round Robin, Priority (preemptive & non-preemptive), Multi-Level Queue
- **Interactive Gantt chart** rendered on Canvas with annotation leveling and zoom
- **Metrics**: waiting time, turnaround time, response time, CPU utilization, throughput, context switches
- **Multi-queue mode**: stack multiple algorithms sequentially on independent queues
- **Export**: save Gantt chart as PNG at 1920px width

## Banker's Algorithm Features

- **Safe sequence detection** using the Banker's Safety Algorithm
- **Resource request testing**: tentatively grant a request and verify the resulting state is still safe
- **Step-by-step trace**: visualize Work vector progression, per-process Need/Allocation evaluation, and Finish flags
- **URL config persistence**: share exact matrix state via URL

## Deadlock Detection Features

- **Deadlock detection** via resource-allocation graph reduction (analogous to Banker's safety check on the current request)
- **Deadlocked process identification** with color-coded status grid
- **Allocation & Request matrix display** with deadlocked cells highlighted
- **Step-by-step trace** with animated Work vector updates and process finish decisions

---

## Architecture — Clean Architecture Layers

```
src/
├── domain/                     # Pure business logic (no React, no I/O)
│   ├── types/
│   │   ├── cpu-scheduling.ts   # Process, SchedulerResult, GanttBlock …
│   │   └── resource-allocation.ts  # StepTrace, SafeSequenceResult, DeadlockResult …
│   ├── algorithms/
│   │   ├── cpu-scheduling/     # FCFS, SJF, RR, Priority, MLQ algorithms
│   │   ├── bankers-algorithm/  # calculate, safe-sequence, request-simulator
│   │   └── deadlock-detection/ # detect
│   └── validators/
│       ├── matrix-validators.ts        # Shared dimension & non-negativity helpers
│       ├── resource-allocation.ts      # Banker's input + request validation
│       └── deadlock-validators.ts      # Deadlock input validation
│
├── app/                        # Application orchestration hooks
│   ├── cpu-scheduler/
│   │   └── useScheduler.ts
│   ├── bankers-algorithm/
│   │   └── useBankersAlgorithm.ts
│   └── deadlock-detection/
│       └── useDeadlockDetection.ts
│
├── infrastructure/             # Adapters: URL serialization, canvas, parsers
│   ├── serializers/
│   │   ├── common-serializer.ts          # Base64 URL-safe encode/decode
│   │   ├── scheduler-config-serializer.ts
│   │   ├── bankers-config-serializer.ts
│   │   └── deadlock-config-serializer.ts
│   ├── parsers/
│   │   ├── scheduler-parser.ts
│   │   └── matrix-parser.ts              # parseMatrixString, parseVectorString
│   └── canvas/
│       └── gantt-renderer.ts
│
└── presentation/               # React UI layer
    ├── components/
    │   ├── layout/             # TopNav, Footer, MainLayout, ThemeProvider …
    │   ├── shared/             # MatrixInput, MatrixDisplay, StepCard, StepViewer
    │   └── ui/                 # shadcn/ui components
    ├── hooks/
    │   └── useUrlState.ts      # Generic URL ↔ React state sync
    ├── pages/
    │   ├── home-portal/        # HomePage
    │   ├── cpu-scheduler/      # SchedulerPage, ConfigPanel, ResultsSection …
    │   ├── bankers-algorithm/  # BankersPage
    │   └── deadlock-detection/ # DeadlockPage
    └── routing/
        └── router.tsx
```

### Path Aliases

| Alias | Resolves to |
|---|---|
| `@domain/*` | `src/domain/*` |
| `@app/*` | `src/app/*` |
| `@infra/*` | `src/infrastructure/*` |
| `@presentation/*` | `src/presentation/*` |
| `@components/*` | `src/presentation/components/*` |
| `@/*` | `src/*` |

---

## Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| TypeScript (strict) | Type safety across all layers |
| Vite 8 | Build tool with HMR |
| Tailwind CSS v4 | Utility-first styling |
| shadcn/ui | Base component primitives |
| react-router-dom v7 | Client-side routing + URL state |
| framer-motion | Step viewer animations |
| Recharts | Metrics charts |
| Sonner | Toast notifications |

---

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Type-check + production bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run `tsc --noEmit` |
| `npm run deploy` | Deploy to Vercel production |

## Deployment

- **Production**: https://cpuflow.vercel.app
- **SPA routing**: `vercel.json` rewrites all non-asset routes to `index.html`
- **Caching**: asset files are cached for 1 year; `index.html` is `no-cache`
