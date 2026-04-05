# HOW IT WORKS

Tài liệu này giải thích chi tiết cách các thuật toán lập lịch CPU trong project được cài đặt, cách tính các chỉ số, và cách dữ liệu được đưa sang Gantt renderer để vẽ biểu đồ.

## 1) Bức tranh tổng thể

Luồng xử lý chính:

1. Người dùng nhập danh sách process và chọn thuật toán.
2. `useScheduler` chuyển `ProcessInput[]` -> `Process[]` (gán id, tên, màu, remainingTime).
3. Thuật toán trong `src/lib/algorithms` chạy và trả về `SchedulerResult`.
4. Thành phần `GanttChart` gọi `useGanttChart.render(...)` với `result.ganttChart`.
5. `GanttChartRenderer` scale timeline, bố trí nhãn, vẽ block/process/time label/context-switch lên canvas.

Code điểm nối thuật toán:

```ts
// src/hooks/useScheduler.ts
const algorithmFn = getAlgorithm(algorithm);
const calculatedResult = algorithmFn(fullProcesses, config);
setResult(calculatedResult);
```

Code điểm nối renderer:

```ts
// src/components/scheduler/GanttChart.tsx
render(
  blocks,
  colorful,
  darkMode,
  processAnnotationMode,
  timeLabelRenderMode,
  allowProcessNameInBlock,
  showQueueAnnotation,
);
```

---

## 2) Mô hình dữ liệu cốt lõi

Các type quan trọng nằm ở `src/types/scheduler.ts`.

### Process đầu vào runtime

```ts
export interface Process {
  id: string;
  name: string;
  arrivalTime: number;
  burstTime: number;
  remainingTime: number;
  priority?: number;
  queueLevel?: number;
  color: string;
}
```

### Block dùng để vẽ Gantt

```ts
export interface GanttBlock {
  processId: string;
  processName: string;
  startTime: number;
  endTime: number;
  duration: number;
  color: string;
  queueId?: string;
}
```

### Kết quả thuật toán

```ts
export interface SchedulerResult {
  processes: ProcessResult[];
  ganttChart: GanttBlock[];
  averageWaitingTime: number;
  averageTurnaroundTime: number;
  averageResponseTime: number;
  cpuUtilization: number;
  throughput: number;
  contextSwitches: number;
}
```

---

## 3) Công thức đang dùng để giải bài toán

Cài đặt tại `src/lib/algorithms/types.ts` và trong từng thuật toán.

Với mỗi process $i$:

- Completion time: $CT_i$
- Arrival time: $AT_i$
- Burst time: $BT_i$
- Start time lần đầu chạy: $ST_i$

Công thức:

$$
TAT_i = CT_i - AT_i
$$

$$
WT_i = TAT_i - BT_i
$$

$$
RT_i = ST_i - AT_i
$$

Trung bình:

$$
\overline{WT} = \frac{1}{n}\sum_{i=1}^{n} WT_i,
\quad
\overline{TAT} = \frac{1}{n}\sum_{i=1}^{n} TAT_i,
\quad
\overline{RT} = \frac{1}{n}\sum_{i=1}^{n} RT_i
$$

CPU Utilization:

$$
CPU\% = \frac{\text{busyTime}}{\text{totalTime}} \times 100
$$

Trong code, `busyTime` là tổng duration của các block có `processId !== 'idle'`.

Throughput:

$$
Throughput = \frac{\text{processCount}}{\text{totalTime}}
$$

Context switch:

- Được tính bằng số lần đổi từ process này sang process khác khi duyệt chuỗi `ganttBlocks`.
- Block `idle` không được tính là context switch.

---

## 4) Ý tưởng từng thuật toán đã cài đặt

## 4.1 FCFS (First Come First Serve)

File: `src/lib/algorithms/fcfs.ts`

Ý tưởng:

1. Sort theo `arrivalTime` tăng dần.
2. Chạy tuần tự từng process, không ngắt giữa chừng (non-preemptive).
3. Nếu CPU rảnh trước khi process tiếp theo đến, chèn block `idle`.

Code lõi:

```ts
const sorted = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);

for (const process of sorted) {
  if (currentTime < process.arrivalTime) {
    ganttBlocks.push(createIdleBlock(currentTime, process.arrivalTime));
    currentTime = process.arrivalTime;
  }

  const startTime = currentTime;
  const completionTime = currentTime + process.burstTime;
  // ... tính WT/TAT/RT
}
```

Đặc tính:

- Đơn giản, dễ hiểu.
- Có hiệu ứng convoy: job ngắn có thể phải đợi job dài.

## 4.2 SJF Non-Preemptive

File: `src/lib/algorithms/sjf-non-preemptive.ts`

Ý tưởng:

1. Ở thời điểm `currentTime`, lấy tập process đã đến và chưa hoàn thành.
2. Chọn process có `burstTime` nhỏ nhất.
3. Chạy đến hết process đó.

Code lõi:

```ts
const available = processes.filter(
  (p) => p.arrivalTime <= currentTime && !completed.has(p.id)
);

const selected = available.reduce((shortest, p) =>
  p.burstTime < shortest.burstTime ? p : shortest
);
```

Đặc tính:

- Tối ưu WT trung bình khá tốt trong nhiều trường hợp.
- Job dài có thể bị chờ lâu (starvation tương đối).

## 4.3 SJF Preemptive (SRTF)

File: `src/lib/algorithms/sjf-preemptive.ts`

Ý tưởng:

1. Mỗi tick thời gian (1 đơn vị), chọn process có `remainingTime` nhỏ nhất trong tập available.
2. Nếu process mới đến có `remainingTime` ngắn hơn, process đang chạy bị ngắt (preempt).
3. Ghi block Gantt theo từng đoạn chạy liên tiếp, sau đó merge block liền kề cùng process.

Code lõi:

```ts
const selected = available.reduce((shortest, p) =>
  p.remainingTime < shortest.remainingTime ? p : shortest
);

selected.remainingTime--;
currentTime++;

if (selected.remainingTime === 0) {
  selected.completionTime = currentTime;
  completed++;
}
```

Đặc tính:

- Giảm WT trung bình tốt hơn SJF non-preemptive trong workload động.
- Context switch có thể tăng.

## 4.4 Round Robin (RR)

File: `src/lib/algorithms/round-robin.ts`

Ý tưởng:

1. Duy trì `readyQueue` FIFO.
2. Mỗi lượt, process chạy tối đa `quantum`.
3. Nếu chưa xong thì đưa lại cuối queue.

Code lõi:

```ts
const executionTime = Math.min(quantum, current.remainingTime);
current.remainingTime -= executionTime;
currentTime += executionTime;

if (current.remainingTime === 0) {
  current.completionTime = currentTime;
} else {
  readyQueue.push(current);
}
```

Đặc tính:

- Công bằng hơn cho hệ interactive.
- Quantum quá nhỏ -> nhiều context switch.
- Quantum quá lớn -> gần FCFS.

## 4.5 Priority Non-Preemptive

File: `src/lib/algorithms/priority-non-preemptive.ts`

Ý tưởng:

1. Trong tập available, chọn process có priority cao nhất.
2. Quy ước của project: số priority nhỏ hơn nghĩa là ưu tiên cao hơn.
3. Chạy đến hết process đã chọn.

Code lõi:

```ts
const selected = available.reduce((highest, p) =>
  p.priority! < highest.priority! ? p : highest
);
```

Đặc tính:

- Điều phối theo mức quan trọng.
- Có nguy cơ starvation cho process ưu tiên thấp.

## 4.6 Priority Preemptive

File: `src/lib/algorithms/priority-preemptive.ts`

Ý tưởng:

1. Mỗi tick, chọn process available có priority cao nhất (số nhỏ nhất).
2. Nếu process mới đến có priority cao hơn, ngắt process đang chạy.
3. Cuối cùng merge block liên tiếp cùng process.

Code lõi:

```ts
const selected = available.reduce((highest, p) =>
  p.priority! < highest.priority! ? p : highest
);

selected.remainingTime--;
currentTime++;
```

Đặc tính:

- Phản ứng nhanh cho job ưu tiên cao.
- Dễ gây starvation cho priority thấp.

## 4.7 Multi-Level Queue (MLQ) trong algorithms

File: `src/lib/algorithms/multi-level-queue.ts`

Ý tưởng:

1. Chia process theo `queueLevel`.
2. Mỗi queue có `algorithm` riêng (`FCFS`, `RR`, `SJF`) và priority queue.
3. Luôn chọn queue không rỗng có queue-priority cao nhất.
4. Chạy process theo luật của queue đó.

Default config:

```ts
[
  { level: 0, algorithm: 'RR', quantum: 2, priority: 3 },
  { level: 1, algorithm: 'RR', quantum: 4, priority: 2 },
  { level: 2, algorithm: 'FCFS', priority: 1 },
]
```

Lưu ý implementation:

- Queue priority được sort giảm dần theo `priority` (số lớn hơn là ưu tiên queue cao hơn).
- Đây là logic MLQ trong tầng thuật toán tổng quát.

---

## 5) Một luồng multi-queue khác trong useScheduler

Ngoài `calculateMultiLevelQueue`, project còn có `calculateMultiQueue(...)` trong `src/hooks/useScheduler.ts`.

Cơ chế:

1. Mỗi queue chạy độc lập bằng thuật toán do queue đó chọn (`getAlgorithm(queue.algorithm)`).
2. Kết quả từng queue được tịnh tiến thời gian bằng `gateTime = queueStartOffset`.
3. `queueId` được gắn vào mỗi `GanttBlock` để renderer biết block thuộc queue nào.

Code minh họa:

```ts
const queueGanttBlocks = queueResult.ganttChart.map((block) => ({
  ...block,
  startTime: block.startTime + gateTime,
  endTime: block.endTime + gateTime,
  queueId: queue.id,
}));
```

Ý nghĩa:

- Giúp hiển thị rõ từng queue theo từng đoạn timeline nối tiếp.
- Khác với MLQ cổ điển chạy tranh chấp đồng thời giữa queue; ở đây có bước offset để ghép dòng thời gian dễ nhìn.

---

## 6) Ý tưởng vẽ Gantt chart trong GanttChartRenderer

File chính: `src/lib/canvas/gantt-renderer.ts`

Renderer dùng Canvas 2D và thực hiện theo pipeline:

1. Chuẩn hóa block bằng `prepareRenderableBlocks(...)`:
   - Sửa các giá trị duration/start/end không hợp lệ.
2. Tính timeline bounds (`minStartTime`, `maxEndTime`).
3. Tính `timeScale = availableWidth / totalDuration` để fit chiều ngang.
4. Quyết định strategy cho nhãn:
   - Process annotation mode: `POINTER_LEVELING`, `POINTER_FIRST_ONLY`, `LEGEND`, `HIDDEN`.
   - Time label mode: `MAJOR_ONLY`, `LINE_LEVELING`, `FORCE_SHRINK`.
5. Vẽ block, text trong block, pointer line ngoài block, time labels, context switch text.
6. Nếu multi-queue và bật tùy chọn, vẽ queue markers (`Q1`, `Q2`, ...).

## 6.1 Công thức ánh xạ thời gian -> tọa độ X

Với block bất kỳ:

$$
x = startX + (block.startTime - timelineStartTime) \times timeScale
$$

$$
width = (block.endTime - block.startTime) \times timeScale
$$

Trong code (rút gọn):

```ts
const width = this.getBlockSpan(block) * timeScale;
const currentX =
  startX + Math.max(0, block.startTime - baseStartTime) * timeScale;
```

## 6.2 Bố trí nhãn thời gian chống đè

Renderer có 3 chế độ:

1. `MAJOR_ONLY`: chỉ hiện các mốc cách nhau tối thiểu `TIME_LABEL_MIN_SPACING`.
2. `LINE_LEVELING`: tất cả nhãn đều hiện, nhãn gần nhau được đẩy xuống level thấp hơn bằng thuật toán phân lớp va chạm.
3. `FORCE_SHRINK`: giữ cùng level nhưng tự co font theo khoảng cách lân cận.

Điều này giúp timeline dày đặc vẫn đọc được.

## 6.3 Nhãn process cho block hẹp

Nếu tên process không fit trong block, renderer:

1. Đánh dấu block cần annotation.
2. Tính level cho pointer line để tránh đè nhau (`buildPointerLevels`).
3. Vẽ nét đứt từ block lên nhãn tên.

Code lõi:

```ts
if (this.config.showProcessNames && canRenderInside) {
  this.renderProcessName(...);
}

if (annotationBlockKeys.has(blockKey)) {
  this.renderPointerLine(...);
}
```

## 6.4 Hiển thị context switch

Renderer kiểm tra gap giữa block hiện tại và block kế tiếp:

```ts
const contextSwitchTime = nextBlock.startTime - block.endTime;
if (contextSwitchTime > 0) {
  this.renderContextSwitchTime(...); // hiển thị CS:x
}
```

Ý nghĩa:

- Nếu có khoảng trống thời gian giữa 2 block, nó được xem như chi phí chuyển ngữ cảnh/đợi và được annotate rõ dưới timeline.

## 6.5 Export PNG

`exportToPNG()` tạo canvas tạm với width cố định 1920px, tính lại scale/font/height động rồi render lại để xuất ảnh sắc nét.

Điểm nổi bật:

- Tối ưu co chữ time-label khi export bằng `tightenTimeLabelFontScalesForExport`.
- Giữ đúng style annotation mode đã render trước đó (`lastRenderOptions`).

---

## 7) Ví dụ end-to-end ngắn

Giả sử input:

- P1: $AT=0, BT=5$
- P2: $AT=1, BT=3$
- P3: $AT=2, BT=1$

Với SRTF:

1. $t=0$: chạy P1.
2. $t=1$: P2 đến, $RT_{P2}=3 < RT_{P1}=4$ -> chuyển sang P2.
3. $t=2$: P3 đến, $RT_{P3}=1 < RT_{P2}=2$ -> chuyển sang P3.
4. P3 xong, quay lại process có remaining nhỏ nhất.

Kết quả thuật toán tạo danh sách `ganttChart` dạng các đoạn liên tục theo process. Renderer nhận danh sách này, scale theo chiều ngang canvas, rồi vẽ block + nhãn thời gian + annotation để tạo Gantt chart cuối cùng.

---

## 8) Tổng kết

- Tầng thuật toán chịu trách nhiệm tính đúng timeline và metrics.
- Tầng renderer chỉ nhận `GanttBlock[]` và tối ưu khả năng đọc biểu đồ.
- Chất lượng biểu đồ phụ thuộc trực tiếp vào tính nhất quán của `startTime`, `endTime`, `duration`, `queueId` (nếu multi-queue).

Nếu bạn muốn, có thể mở rộng tài liệu này thêm phần so sánh độ phức tạp thời gian (Big-O) của từng thuật toán dựa trên đúng implementation hiện tại.