import { useEffect, useMemo, useState } from 'react';
import {
  decodeDiskSchedulerConfig,
  DISK_SCHEDULER_DEFAULTS,
  encodeDiskSchedulerConfig,
  type DiskSchedulerConfig,
} from '@infra/serializers/disk-scheduler-config-serializer';

export function useDiskUrlState(debounceMs = 300): [DiskSchedulerConfig, (next: DiskSchedulerConfig) => void] {
  const initialConfig = useMemo(
    () => decodeDiskSchedulerConfig(window.location.search),
    []
  );
  const [config, setConfig] = useState<DiskSchedulerConfig>(initialConfig);

  useEffect(() => {
    const handlePopState = () => {
      setConfig(decodeDiskSchedulerConfig(window.location.search));
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const query = encodeDiskSchedulerConfig(config);
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}?${query}`
      );
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [config, debounceMs]);

  return [config, setConfig];
}

export { DISK_SCHEDULER_DEFAULTS };
