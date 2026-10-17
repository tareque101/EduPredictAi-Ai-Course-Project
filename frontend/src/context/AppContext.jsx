import { createContext, useCallback, useContext, useMemo, useState } from 'react';

export const SEMESTERS = ['Fall 2026', 'Spring 2026', 'Summer 2026'];

const HABIT_COLORS = ['#6366f1', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const todayKey = () => new Date().toISOString().slice(0, 10);
const nowLabel = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const round2 = (n) => Math.round(n * 100) / 100;

const INITIAL_HABITS = [
  { id: 1, name: 'Deep Study', category: 'Study', goal: 'at-least', unit: 'hrs', target: 4, current: 3.2, step: 0.5, streak: 14, lastLogged: null, color: '#6366f1' },
  { id: 2, name: 'Sleep', category: 'Recovery', goal: 'at-least', unit: 'hrs', target: 7.5, current: 6.5, step: 0.5, streak: 5, lastLogged: null, color: '#06b6d4' },
  { id: 3, name: 'Compiler Design Revision', category: 'Study', goal: 'at-least', unit: 'hrs', target: 1.5, current: 1.5, step: 0.5, streak: 9, lastLogged: null, color: '#8b5cf6' },
  { id: 4, name: 'Exercise', category: 'Health', goal: 'at-least', unit: 'min', target: 30, current: 15, step: 15, streak: 3, lastLogged: null, color: '#10b981' },
  { id: 5, name: 'Social Media / Leisure', category: 'Lifestyle', goal: 'at-most', unit: 'hrs', target: 2, current: 2.5, step: 0.5, streak: 0, lastLogged: null, color: '#f59e0b' },
];

const INITIAL_ACTIVITY = [
  { id: 1, text: 'Logged 3.2 hrs of Deep Study', time: 'Today, 08:40 AM', dot: 'bg-indigo-500' },
  { id: 2, text: 'Logged 6.5 hrs of Sleep', time: 'Yesterday, 11:15 PM', dot: 'bg-cyan-500' },
  { id: 3, text: 'Completed Compiler Design revision', time: 'Yesterday, 04:20 PM', dot: 'bg-violet-500' },
  { id: 4, text: 'Missed Exercise target', time: 'Oct 14, 07:05 PM', dot: 'bg-rose-500' },
  { id: 5, text: 'Attendance recorded at 88%', time: 'Oct 13, 09:00 AM', dot: 'bg-emerald-500' },
];

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [semester, setSemester] = useState(SEMESTERS[0]);
  const [habits, setHabits] = useState(INITIAL_HABITS);
  const [activity, setActivity] = useState(INITIAL_ACTIVITY);
  const [cgpa] = useState(3.42);
  const [attendance] = useState(88);

  const pushActivity = useCallback((text, dot) => {
    setActivity((prev) => [
      { id: Date.now(), text, time: `Today, ${nowLabel()}`, dot },
      ...prev,
    ]);
  }, []);

  const logHabit = useCallback(
    (id) => {
      const habit = habits.find((h) => h.id === id);
      if (!habit) return;
      const today = todayKey();
      const firstLogToday = habit.lastLogged !== today;

      setHabits((prev) =>
        prev.map((h) =>
          h.id === id
            ? {
                ...h,
                current: round2(h.current + h.step),
                streak: firstLogToday ? h.streak + 1 : h.streak,
                lastLogged: today,
              }
            : h
        )
      );
      pushActivity(`Logged ${habit.step} ${habit.unit} of ${habit.name}`, 'bg-emerald-500');
    },
    [habits, pushActivity]
  );

  const addHabit = useCallback(
    (payload) => {
      const newHabit = {
        id: Date.now(),
        ...payload,
        current: 0,
        streak: 0,
        lastLogged: null,
        color: HABIT_COLORS[habits.length % HABIT_COLORS.length],
      };
      setHabits((prev) => [...prev, newHabit]);
      pushActivity(`Created new habit: ${payload.name}`, 'bg-indigo-500');
    },
    [habits.length, pushActivity]
  );

  const removeHabit = useCallback((id) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      semester,
      setSemester,
      habits,
      addHabit,
      logHabit,
      removeHabit,
      activity,
      cgpa,
      attendance,
    }),
    [semester, habits, addHabit, logHabit, removeHabit, activity, cgpa, attendance]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}