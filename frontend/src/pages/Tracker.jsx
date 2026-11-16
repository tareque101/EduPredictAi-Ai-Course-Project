import { useState } from 'react';
import { Check, Circle, Flame, ListChecks, Zap } from 'lucide-react';
import { fetchHealthLogs, fetchToday } from '../api/client.js';
import ActivityFeed from '../components/ActivityFeed.jsx';
import { EcaPanel, HabitsPanel, HealthForm, SkillsPanel } from '../components/TrackerPanels.jsx';
import { Card, PageHeader, ProgressRing, Skeleton } from '../components/ui.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useResource } from '../hooks/useResource.js';
import { addDays, cn, localDateKey, parseKey, weekdayShort } from '../utils/format.js';

function DateStrip({ value, onChange, logged }) {
  const today = localDateKey();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  return (
    <div className="grid grid-cols-7 gap-2" role="tablist" aria-label="Choose a day">
      {days.map((d) => {
        const active = d === value;
        return (
          <button key={d} role="tab" aria-selected={active} onClick={() => onChange(d)}
            className={cn('relative flex flex-col items-center rounded-2xl border py-2.5 transition',
              active ? 'border-transparent bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30'
                : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300')}>
            <span className={cn('text-[11px] font-semibold uppercase', active ? 'text-white/80' : 'text-slate-400')}>{d === today ? 'Today' : weekdayShort(d)}</span>
            <span className="text-lg font-bold">{parseKey(d).getDate()}</span>
            <span className={cn('mt-0.5 h-1.5 w-1.5 rounded-full', logged.has(d) ? (active ? 'bg-white' : 'bg-emerald-500') : 'bg-transparent')} />
          </button>
        );
      })}
    </div>
  );
}

export default function Tracker() {
  const { version } = useApp();
  const today = localDateKey();
  const [date, setDate] = useState(today);
  const { data: snap, loading } = useResource(() => fetchToday(date), [date, version]);
  const { data: recent } = useResource(() => fetchHealthLogs(10), [version], { initial: [] });
  const logged = new Set((recent || []).map((l) => l.log_date));
  const isToday = date === today;
  const p = snap?.progress;

  return (
    <div className="animate-fade-up">
      <PageHeader
        icon={ListChecks}
        title="Daily Tracker"
        subtitle="Everything you do today in one place. Your analytics update automatically."
        actions={snap && (
          <>
            <span className="badge !px-3 !py-1.5 bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300"><Flame className="h-4 w-4" /> {snap.streak} day streak</span>
            <span className="badge !px-3 !py-1.5 bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"><Zap className="h-4 w-4" /> Best {snap.best_streak}</span>
          </>
        )}
      />

      <DateStrip value={date} onChange={setDate} logged={logged} />
      {!isToday && <p className="mt-3 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">You're logging for a past day. Health, skills and activities are saved to that date.</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <h3 className="mb-4 font-bold text-slate-900 dark:text-white">{isToday ? "Today's progress" : 'Progress that day'}</h3>
            {loading && !snap ? <Skeleton className="h-40" /> : (
              <>
                <div className="flex items-center gap-5">
                  <ProgressRing value={p?.pct || 0} size={104} stroke={10} color={p?.pct === 100 ? '#10b981' : '#8b5cf6'}>
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{p?.pct || 0}%</span>
                  </ProgressRing>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{p?.done}/{p?.total} done{p?.pct === 100 ? ' 🎉 Perfect day!' : ''}</p>
                </div>
                <ul className="mt-5 space-y-2">
                  {p?.items.map((it) => (
                    <li key={it.key} className="flex items-center gap-2.5 text-sm">
                      {it.done ? <Check className="h-5 w-5 rounded-full bg-emerald-500 p-1 text-white" /> : <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600" />}
                      <span className={it.done ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}>{it.label}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
          <Card>
            <h3 className="mb-3 font-bold text-slate-900 dark:text-white">Recent activity</h3>
            <ActivityFeed />
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <HealthForm date={date} initial={snap?.health} />
          <div className="grid gap-6 md:grid-cols-2">
            <HabitsPanel enabled={isToday} />
            <div className="space-y-6">
              <SkillsPanel date={date} logged={snap?.skills} />
              <EcaPanel date={date} logged={snap?.eca} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
