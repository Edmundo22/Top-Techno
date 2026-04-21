import { useCallback, useEffect, useRef, useState } from 'react';
import { api, extractErrorMessage } from '../services/api';
import { logData, logError, logSuccess } from '../utils/logger';

interface UseLivePollOptions {
  enabled?: boolean;
  intervalMs: number;
}

export interface LivePollState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdate: number | null;
  refetch: () => void;
}

export function useLivePoll<T>(url: string, options: UseLivePollOptions): LivePollState<T> {
  const { enabled = true, intervalMs } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchOnce = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    try {
      const res = await api.get<{ data: T }>(url, { signal: ctrl.signal });
      logData(`poll ${url}`, res.data.data);
      setData(res.data.data);
      setError(null);
      setLastUpdate(Date.now());
      logSuccess(`poll ${url}`);
    } catch (err) {
      if (ctrl.signal.aborted) return;
      logError(`poll ${url}`, err);
      setError(extractErrorMessage(err, 'Falha ao atualizar dados.'));
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (!enabled) return;
    fetchOnce();
    const id = window.setInterval(fetchOnce, intervalMs);
    return () => {
      window.clearInterval(id);
      abortRef.current?.abort();
    };
  }, [enabled, intervalMs, fetchOnce]);

  return { data, loading, error, lastUpdate, refetch: fetchOnce };
}
