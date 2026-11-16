import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext({ dark: false, toggle: () => {} });
const KEY = 'edupredict_theme';

const initialDark = () => {
  if (typeof window === 'undefined') return false;
  try {
    const saved = window.localStorage.getItem(KEY);
    if (saved) return saved === 'dark';
  } catch {
    /* ignore */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
};

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(initialDark);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      window.localStorage.setItem(KEY, dark ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
  }, [dark]);

  const toggle = useCallback(() => setDark((d) => !d), []);
  const value = useMemo(() => ({ dark, toggle }), [dark, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

/** Colours for Recharts, which cannot read Tailwind classes. */
export function useChartTheme() {
  const { dark } = useTheme();
  return {
    grid: dark ? '#1e293b' : '#e2e8f0',
    axis: dark ? '#64748b' : '#94a3b8',
    text: dark ? '#cbd5e1' : '#475569',
    tooltip: {
      contentStyle: {
        background: dark ? '#0f172a' : '#ffffff',
        border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
        borderRadius: 12,
        color: dark ? '#e2e8f0' : '#0f172a',
        fontSize: 12,
        boxShadow: '0 10px 30px rgba(0,0,0,.12)',
      },
      labelStyle: { color: dark ? '#cbd5e1' : '#334155', fontWeight: 600 },
      cursor: { fill: dark ? 'rgba(148,163,184,.08)' : 'rgba(124,58,237,.06)' },
    },
  };
}
