import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Load data with loading/error state and a reload() function.
 * Re-runs when `deps` change. Stale responses are ignored.
 */
export function useResource(load, deps = [], { initial = null } = {}) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const ticket = useRef(0);

  const run = useCallback(async () => {
    const mine = ++ticket.current;
    setLoading(true);
    try {
      const result = await load();
      if (mine === ticket.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (mine === ticket.current) setError(err);
    } finally {
      if (mine === ticket.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { data, setData, loading, error, reload: run };
}
