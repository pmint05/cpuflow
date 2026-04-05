# HOW IT WORKS

This document explains how each algorithm in cpuflow is implemented, how data flows through the Clean Architecture layers, and what formulas are used for metrics.

---

## Table of Contents

1. [Clean Architecture Data Flow](#1-clean-architecture-data-flow)
2. [Core Data Models](#2-core-data-models)
3. [CPU Scheduling Algorithms](#3-cpu-scheduling-algorithms)
4. [Banker's Algorithm](#4-bankers-algorithm)
5. [Deadlock Detection](#5-deadlock-detection)
6. [URL Config Persistence](#6-url-config-persistence)
7. [Gantt Chart Renderer](#7-gantt-chart-renderer)

---

## 1) Clean Architecture Data Flow

All three simulators follow the same layered flow:

```
User Input (Presentation)
    ↓
Application Hook (parse → validate → compute)
    ↓
Domain Algorithm (pure function: inputs → results)
    ↓
Domain Types (Result + StepTrace[])
    ↓
Presentation (Results Panel + StepViewer)
```

Each layer has a strict dependency rule: **inner layers never import from outer layers**.

---

## 2) Core Data Models

### Shared Step Trace

All three simulators produce a `StepTrace[]` for the animated step viewer:

```ts
export interface StepTrace {
  stepNumber: number;
  action: string;        // Human-readable description
  processId: number;     // -1 for summary steps
  work: number[];        // Current Work (available) vector
  need: number[];        // Need[i] (Banker's) or Request[i] (Deadlock)
  allocation: number[];  // Allocation[i]
  canFinish: boolean;    // Whether this process can proceed
  finished: boolean;     // Whether this step completes the process
  finishFlags: boolean[]; // Finish[*] snapshot for all processes
}
```

### Safe Sequence Result (Banker's)

```ts
export interface SafeSequenceResult {
  safe: boolean;
  sequence: number[];   // Process IDs in safe execution order
  steps: StepTrace[];
}
```

### Deadlock Result

```ts
export interface DeadlockResult {
  deadlocked: boolean;
  deadlockedProcesses: number[];  // 0-indexed IDs of stuck processes
  work: number[];                 // Final work vector
  finish: boolean[];              // false = deadlocked
  steps: StepTrace[];
}
```

---

## 3) CPU Scheduling Algorithms

### Formulas

For each process *i*:
- **Completion Time** = CT_i (time at which process finishes)
- **Turnaround Time** = CT_i − AT_i
- **Waiting Time** = TAT_i − BT_i
- **Response Time** = first_run_i − AT_i

Averages across n processes:
- **Avg WT / TAT / RT** = (1/n) × Σ metric_i
- **CPU Utilization** = busyTime / totalTime × 100
- **Throughput** = n / totalTime
- **Context Switches** = number of process-to-process transitions in the Gantt sequence (idle→process is not counted)

### 3.1 FCFS

Sort by `arrivalTime`. Run each process to completion. Insert idle blocks for CPU gaps.

### 3.2 SJF Non-Preemptive

At `currentTime`, pick the available process with the smallest `burstTime`. Run to completion.

### 3.3 SRTF (SJF Preemptive)

Each tick: pick available process with smallest `remainingTime`. Decrement, advance time. Preempt if a shorter job arrives.

### 3.4 Round Robin

Maintain a FIFO ready queue. Each turn: run up to `quantum` units. Re-enqueue if not finished.

```ts
const executionTime = Math.min(quantum, current.remainingTime);
current.remainingTime -= executionTime;
currentTime += executionTime;
```

### 3.5 Priority Non-Preemptive

Pick available process with lowest priority number (higher priority = lower number). Run to completion.

### 3.6 Priority Preemptive

Each tick: pick available process with lowest priority number. Preempt if higher-priority process arrives.

### 3.7 Multi-Level Queue

Three queues by default: `{RR, q=2}` > `{RR, q=4}` > `{FCFS}`. Each process is assigned a queue level. Always run the non-empty highest-priority queue first. Gantt blocks carry a `queueId` for rendering.

---

## 4) Banker's Algorithm

**Purpose**: Guarantee deadlock *avoidance* by only granting requests that keep the system in a *safe state*.

### Key Matrices

| Matrix | Dimension | Meaning |
|---|---|---|
| `Allocation[i][j]` | n × m | Resources of type j held by process i |
| `Max[i][j]` | n × m | Maximum resources of type j process i may ever claim |
| `Need[i][j]` | n × m | Max[i][j] − Allocation[i][j] |
| `Available[j]` | m | Free resources of type j not held by any process |

### 4.1 Safety Algorithm

```
Work = Available
Finish[i] = false for all i

loop:
  find i: Finish[i] = false AND Need[i] ≤ Work (element-wise)
  if found:
    Work += Allocation[i]
    Finish[i] = true
    add i to safe sequence
  else:
    break

safe = all Finish[i] are true
```

**Complexity**: O(n² × m) — two nested loops over processes × resources.

### 4.2 Resource Request Algorithm

When process P_i requests `Request[i]`:

```
1. if Request[i] > Need[i]         → error (exceeds max claim)
2. if Request[i] > Available       → block (insufficient resources)
3. pretend to allocate:
     Available  -= Request[i]
     Allocation[i] += Request[i]
     Need[i]    -= Request[i]
4. run Safety Algorithm on new state
5. if safe → grant; else → rollback and deny
```

### 4.3 Implementation Files

```
src/domain/algorithms/bankers-algorithm/
├── calculate.ts         # calculateNeedMatrix, canProcessFinish, applyRequest
├── safe-sequence.ts     # findSafeSequence → SafeSequenceResult + StepTrace[]
├── request-simulator.ts # simulateRequest → RequestResult
└── index.ts

src/domain/validators/resource-allocation.ts  # validateBankersInput, validateResourceRequest
src/app/bankers-algorithm/useBankersAlgorithm.ts  # parse → validate → compute hook
src/presentation/pages/bankers-algorithm/BankersPage.tsx
```

### 4.4 Example (Classic Textbook)

5 processes (P0–P4), 3 resources (A/B/C):

| | Allocation | Max | Need |
|---|---|---|---|
| P0 | 0,1,0 | 7,5,3 | 7,4,3 |
| P1 | 2,0,0 | 3,2,2 | 1,2,2 |
| P2 | 3,0,2 | 9,0,2 | 6,0,0 |
| P3 | 2,1,1 | 2,2,2 | 0,1,1 |
| P4 | 0,0,2 | 4,3,3 | 4,3,1 |

Available: [3,3,2] → **Safe sequence: P1 → P3 → P4 → P0 → P2**

---

## 5) Deadlock Detection

**Purpose**: Find which processes are *already* deadlocked in a given system snapshot. Unlike Banker's, this runs *after the fact* on the actual allocation state.

### Algorithm (Resource-Allocation Graph Reduction)

```
Work = Available
Finish[i] = (Allocation[i] is all-zero)  // processes with no resources aren't stuck

loop:
  find i: Finish[i] = false AND Request[i] ≤ Work
  if found:
    Work += Allocation[i]   // process can finish, release resources
    Finish[i] = true
  else:
    break

Deadlocked = { i : Finish[i] = false }
```

**Key difference from Banker's**: uses the actual `Request` matrix (what processes are *currently waiting for*) instead of `Need` (their maximum *future* claim).

**Complexity**: O(n² × m).

### Initialization Detail

A process with **zero allocation** (holds no resources) is immediately marked `Finish[i] = true` — it cannot be part of a deadlock cycle since deadlocks require a circular *hold-and-wait*.

### 5.1 Implementation Files

```
src/domain/algorithms/deadlock-detection/
├── detect.ts    # detectDeadlock → DeadlockResult + StepTrace[]
└── index.ts

src/domain/validators/deadlock-validators.ts   # validateDeadlockInput
src/app/deadlock-detection/useDeadlockDetection.ts
src/presentation/pages/deadlock-detection/DeadlockPage.tsx
```

### 5.2 Example (3-way Circular Deadlock)

3 processes (P0–P2), 3 resources (R0/R1/R2). Available: [0,0,0].

| | Allocation | Request |
|---|---|---|
| P0 | 1,0,0 | 0,1,0 |
| P1 | 0,1,0 | 0,0,1 |
| P2 | 0,0,1 | 1,0,0 |

- P0 holds R0, waiting for R1
- P1 holds R1, waiting for R2
- P2 holds R2, waiting for R0

No process can proceed. **All three are deadlocked.** Final Work = [0,0,0].

---

## 6) URL Config Persistence

All three pages serialize their configuration to a URL `?config=` parameter using **URL-safe Base64**.

```
Encode:  config object → JSON.stringify → TextEncoder → btoa → replace +/= → URL
Decode:  URL param → replace -_ → atob → TextDecoder → JSON.parse → typed config
```

Files:
```
src/infrastructure/serializers/
├── common-serializer.ts          # encodeBase64URL, decodeBase64URL
├── scheduler-config-serializer.ts
├── bankers-config-serializer.ts
└── deadlock-config-serializer.ts
```

Matrix data is stored as a multiline string: `"1,2,3\n4,5,6"` — one row per line, values comma-separated. The matrix parser (`src/infrastructure/parsers/matrix-parser.ts`) accepts both commas and spaces as delimiters.

---

## 7) Gantt Chart Renderer

File: `src/infrastructure/canvas/gantt-renderer.ts`. Uses Canvas 2D API.

### Pipeline

1. **Normalize blocks** — fix invalid duration/start/end values.
2. **Compute timeline bounds** — `minStartTime`, `maxEndTime`.
3. **Time scale** — `timeScale = availableWidth / totalDuration`.
4. **Coordinate mapping**:
   - `x = startX + (block.startTime − baseStartTime) × timeScale`
   - `width = (block.endTime − block.startTime) × timeScale`
5. **Annotation strategy** — three modes:
   - `POINTER_LEVELING`: draw pointer lines from narrow blocks to external labels, leveled to avoid overlap.
   - `LEGEND`: show a legend instead of inline labels.
   - `HIDDEN`: no labels.
6. **Time label strategy** — three modes:
   - `MAJOR_ONLY`: only labels spaced ≥ `TIME_LABEL_MIN_SPACING`.
   - `LINE_LEVELING`: all labels, pushed down by level when crowded.
   - `FORCE_SHRINK`: same level but font shrinks near neighbours.
7. **Export PNG** — re-renders at 1920px width with recalculated scale; font sizes are re-optimized.

---

## Summary

| Layer | Responsibility |
|---|---|
| `domain/algorithms` | Correctness: compute the right answer (pure functions) |
| `domain/validators` | Input validation before algorithm execution |
| `app/` | Orchestration: parse strings → validate → call domain → manage React state |
| `infrastructure/` | I/O adapters: URL serialization, string parsing, Canvas rendering |
| `presentation/` | UI: forms, results, animations, routing — no business logic |

Each simulator is fully independent. Adding a new simulator means adding a new domain algorithm, a new application hook, new infrastructure serializer, and a new page — without touching any existing code.