import { useCallback, useState } from 'react';

/** useState that survives reloads. Failures (private mode, quota) are ignored. */
export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      return raw !== null ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });

  const set = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          /* ignore */
        }
        return resolved;
      });
    },
    [key]
  );

  return [value, set];
}
