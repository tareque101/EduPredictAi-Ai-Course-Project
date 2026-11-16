import { Pause, Play, RotateCcw, SkipForward, Timer } from 'lucide-react';
import { MODES, formatClock, useFocus } from '../context/FocusContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { Card, ProgressRing, Segmented } from './ui.jsx';

/** Pomodoro card. Sessions are saved to the chosen task (and its linked skill). */
export default function FocusTimer() {
  const f = useFocus();
  const { tasks, snapshot } = useApp();
  const open = tasks.filter((t) => t.status !== 'done');
  const color = f.mode === 'focus' ? '#8b5cf6' : '#10b981';

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white"><Timer className="h-5 w-5 text-violet-500" /> Focus timer</h3>
        <span className="text-xs text-slate-400">{f.sessions} session{f.sessions === 1 ? '' : 's'} this visit</span>
      </div>
      <Segmented size="sm" className="w-full" value={f.mode} onChange={f.setMode} options={Object.entries(MODES).map(([value, m]) => ({ value, label: m.label }))} />

      <div className="my-6 flex justify-center">
        <ProgressRing value={f.progress * 100} size={176} stroke={12} color={color}>
          <span className="text-4xl font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white" aria-live="off">{formatClock(f.remainingMs)}</span>
          <span className="text-xs font-semibold text-slate-400">{f.running ? (f.mode === 'focus' ? 'Stay focused' : 'Relax') : 'Ready'}</span>
        </ProgressRing>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button onClick={f.reset} className="icon-btn" aria-label="Reset timer"><RotateCcw className="h-5 w-5" /></button>
        <button onClick={f.running ? f.pause : f.start} className="btn btn-primary !px-8 !py-3">
          {f.running ? <><Pause className="h-5 w-5" /> Pause</> : <><Play className="h-5 w-5" /> Start</>}
        </button>
        <button onClick={f.skip} className="icon-btn" aria-label="Finish early" title="Finish early (saves the time so far)"><SkipForward className="h-5 w-5" /></button>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {[15, 25, 45, 60].map((m) => (
          <button key={m} onClick={() => f.setCustomMinutes(m)} disabled={f.running} className="chip disabled:opacity-40">{m} min</button>
        ))}
      </div>

      <label className="mt-5 block"><span className="label">Working on</span>
        <select className="input" value={f.taskId || ''} onChange={(e) => f.setTaskId(e.target.value ? Number(e.target.value) : null)}>
          <option value="">No specific task</option>
          {open.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
      </label>
      {snapshot?.focus_minutes > 0 && <p className="mt-3 text-center text-xs text-slate-400">Focused today: <span className="font-semibold text-slate-600 dark:text-slate-300">{snapshot.focus_minutes} min</span></p>}
    </Card>
  );
}
