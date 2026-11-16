import { BookOpen, CheckCircle2, Dumbbell, HeartPulse, Repeat, Users } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { relativeDay } from '../utils/format.js';

const ICONS = {
  habit: [Repeat, 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300'],
  skill: [Dumbbell, 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300'],
  eca: [Users, 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300'],
  health: [HeartPulse, 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300'],
  task: [CheckCircle2, 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300'],
};

/** Latest tracked events, straight from the server (survives reloads). */
export default function ActivityFeed({ limit = 8 }) {
  const { feed } = useApp();
  const items = feed.slice(0, limit);
  if (!items.length) {
    return (
      <p className="flex items-center gap-2 text-sm text-slate-400"><BookOpen className="h-4 w-4" /> Nothing logged yet. Your activity will show up here.</p>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((e, i) => {
        const [Icon, tone] = ICONS[e.type] || ICONS.task;
        return (
          <li key={`${e.type}-${e.order}-${i}`} className="flex items-start gap-3">
            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon className="h-4 w-4" /></span>
            <div className="min-w-0">
              <p className="text-sm text-slate-700 dark:text-slate-200">{e.title}</p>
              <p className="text-xs text-slate-400">{relativeDay(e.date)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
