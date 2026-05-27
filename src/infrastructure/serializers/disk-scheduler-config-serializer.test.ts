import { describe, expect, it } from 'vitest';
import {
  decodeDiskSchedulerConfig,
  DISK_SCHEDULER_DEFAULTS,
  encodeDiskSchedulerConfig,
} from './disk-scheduler-config-serializer';

describe('disk scheduler config serializer', () => {
  it('round-trips a config through the query string', () => {
    const config = {
      algo: 'LOOK' as const,
      head: 120,
      direction: 'LEFT' as const,
      max: 300,
      queue: [10, 20, 30],
      speed: 2,
      ghost: false,
      academic: true,
      explain: false,
      includeEdges: false,
    };

    const encoded = encodeDiskSchedulerConfig(config as any);
    const decoded = decodeDiskSchedulerConfig(`?${encoded}`);

    expect(decoded).toEqual(config);
  });

  it('falls back to defaults when values are invalid', () => {
    const decoded = decodeDiskSchedulerConfig(
      '?algo=bad&head=oops&direction=up&max=-10&queue=-1,abc,99999&speed=NaN&ghost=maybe&academic=maybe&explain=maybe&includeEdges=maybe'
    );

    expect(decoded.algo).toBe(DISK_SCHEDULER_DEFAULTS.algo);
    expect(decoded.direction).toBe(DISK_SCHEDULER_DEFAULTS.direction);
    expect(decoded.max).toBe(1);
    expect(decoded.head).toBe(1);
    expect(decoded.queue).toEqual(DISK_SCHEDULER_DEFAULTS.queue);
    expect(decoded.speed).toBe(DISK_SCHEDULER_DEFAULTS.speed);
    expect(decoded.ghost).toBe(DISK_SCHEDULER_DEFAULTS.ghost);
    expect(decoded.academic).toBe(DISK_SCHEDULER_DEFAULTS.academic);
    expect(decoded.includeEdges).toBe(DISK_SCHEDULER_DEFAULTS.includeEdges);
  });
});
