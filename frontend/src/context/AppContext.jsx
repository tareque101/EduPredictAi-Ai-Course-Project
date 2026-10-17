import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

// Date theke current semester bar kore: Jan-May = Spring, Jun-Aug = Summer, Sep-Dec = Fall
export function getCurrentSemester(date = new Date()) {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  if (month >= 1 && month <= 5) return `Spring ${year}`;
  if (month >= 6 && month <= 8) return `Summer ${year}`;
  return `Fall ${year}`;
}

const AppContext = createContext(null);
const timeLabel = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export function AppProvider({ children }) {
  const { user } = useAuth();
  const semester = getCurrentSemester();

  const [habits, setHabits] = useState([]);
  const [activity, setActivity] = useState([]);
  const [cgpa] = useState(3.42);
  const [attendance] = useState(88);

  useEffect(() => {
    if (!user) {
      setHabits([]);
      return;
    }
    api.fetchHabits().then(setHabits).catch((err) => console.error('Load habits failed', err));
  }, [user]);

  const pushActivity = useCallback((text, dot) => {
    setActivity((prev) => [{ id: Date.now(), text, time: `Today, ${timeLabel()}`, dot }, ...prev].slice(0, 20));
  }, []);

  const logHabit = useCallback(
    async (id) => {
      try {
        const updated = await api.logHabit(id);
        setHabits((prev) => prev.map((h) => (h.id === id ? updated : h)));
        pushActivity(`Logged ${updated.step} ${updated.unit} of ${updated.name}`, 'bg-emerald-500');
      } catch (err) {
        console.error('Log failed', err);
      }
    },
    [pushActivity]
  );

  const addHabit = useCallback(
    async (payload) => {
      try {
        const created = await api.createHabit(payload);
        setHabits((prev) => [...prev, created]);
        pushActivity(`Created new habit: ${created.name}`, 'bg-indigo-500');
      } catch (err) {
        console.error('Create failed', err);
      }
    },
    [pushActivity]
  );

  const removeHabit = useCallback(async (id) => {
    try {
      await api.deleteHabit(id);
      setHabits((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      console.error('Delete failed', err);
    }
  }, []);

  const value = useMemo(
    () => ({ semester, habits, addHabit, logHabit, removeHabit, activity, cgpa, attendance }),
    [semester, habits, addHabit, logHabit, removeHabit, activity, cgpa, attendance]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}