import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from './AppContext.jsx';
import { useToast } from './ToastContext.jsx';
import { useAuth } from './AuthContext.jsx';

export const MODES = {
  focus: { label: 'Focus', minutes: 25 },
  short: { label: 'Short break', minutes: 5 },
  long: { label: 'Long break', minutes: 15 },
};

const FocusContext = createContext(null);

function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.25, 0.5].forEach((t, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 660 + i * 110;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.22);
    });
  } catch {
    /* audio is optional */
  }
}

/**
 * Global Pomodoro timer. Lives above the router so it keeps running while you
 * move between pages. Uses timestamps (not tick counting) so it stays accurate
 * even when the tab is throttled in the background.
 */
export function FocusProvider({ children }) {
  const { logFocus } = useApp();
  const { user } = useAuth();
  const toast = useToast();

  const [mode, setModeState] = useState('focus');
  const [minutes, setMinutes] = useState(MODES.focus.minutes);
  const [running, setRunning] = useState(false);
  const [endAt, setEndAt] = useState(null);
  const [remainingMs, setRemainingMs] = useState(MODES.focus.minutes * 60000);
  const [taskId, setTaskId] = useState(null);
  const [sessions, setSessions] = useState(0);
  const finishing = useRef(false);

  const reset = useCallback((m = mode, mins = null) => {
    const next = mins ?? MODES[m].minutes;
    setRunning(false);
    setEndAt(null);
    setMinutes(next);
    setRemainingMs(next * 60000);
  }, [mode]);

  const setMode = useCallback((m) => {
    setModeState(m);
    setRunning(false);
    setEndAt(null);
    setMinutes(MODES[m].minutes);
    setRemainingMs(MODES[m].minutes * 60000);
  }, []);

  const setCustomMinutes = useCallback((mins) => {
    const v = Math.max(1, Math.min(180, Math.round(mins)));
    setRunning(false);
    setEndAt(null);
    setMinutes(v);
    setRemainingMs(v * 60000);
  }, []);

  const start = useCallback(() => {
    setEndAt(Date.now() + remainingMs);
    setRunning(true);
  }, [remainingMs]);

  const pause = useCallback(() => {
    setRemainingMs(Math.max(0, (endAt ?? Date.now()) - Date.now()));
    setRunning(false);
    setEndAt(null);
  }, [endAt]);

  // `logged` = minutes actually focused. Defaults to the full block (timer ran out).
  const complete = useCallback(async (logged = minutes, silent = false) => {
    if (finishing.current) return;
    finishing.current = true;
    setRunning(false);
    setEndAt(null);
    if (!silent) beep();
    if (mode === 'focus') {
      if (logged >= 1) {
        setSessions((s) => s + 1);
        if (user) await logFocus({ minutes: logged, task_id: taskId || undefined });
        toast.info('Focus session saved', `${logged} min logged. Take a short break.`);
      }
      setModeState('short');
      setMinutes(MODES.short.minutes);
      setRemainingMs(MODES.short.minutes * 60000);
    } else {
      toast.info('Break over', 'Ready for the next focus block?');
      setModeState('focus');
      setMinutes(MODES.focus.minutes);
      setRemainingMs(MODES.focus.minutes * 60000);
    }
    finishing.current = false;
  }, [mode, minutes, taskId, user, logFocus, toast]);

  // tick
  useEffect(() => {
    if (!running || !endAt) return undefined;
    const id = setInterval(() => {
      const left = endAt - Date.now();
      if (left <= 0) {
        setRemainingMs(0);
        complete(minutes);
      } else setRemainingMs(left);
    }, 250);
    return () => clearInterval(id);
  }, [running, endAt, complete, minutes]);

  // show the countdown in the browser tab
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const base = 'EduPredict AI';
    if (running) {
      const total = Math.ceil(remainingMs / 1000);
      const mm = String(Math.floor(total / 60)).padStart(2, '0');
      const ss = String(total % 60).padStart(2, '0');
      document.title = `${mm}:${ss} · ${MODES[mode].label}`;
    } else document.title = base;
    return () => {
      document.title = base;
    };
  }, [running, remainingMs, mode]);

  const value = useMemo(
    () => ({
      mode, minutes, running, remainingMs, taskId, sessions,
      progress: 1 - remainingMs / (minutes * 60000),
      setMode, setCustomMinutes, setTaskId, start, pause, reset: () => reset(mode, minutes), skip: () => complete(Math.floor((minutes * 60000 - remainingMs) / 60000), true),
    }),
    [mode, minutes, running, remainingMs, taskId, sessions, setMode, setCustomMinutes, start, pause, reset, complete]
  );
  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
}

export function useFocus() {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error('useFocus must be used inside <FocusProvider>');
  return ctx;
}

export const formatClock = (ms) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};
