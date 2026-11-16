import { useMemo, useState } from 'react';
import { AlertCircle, CalendarClock, CheckCircle2, CheckSquare, Circle, Clock, Columns3, Flame, Grid2x2, List, Pencil, Play, Plus, Search, Timer, Trash2 } from 'lucide-react';
import FocusTimer from '../components/FocusTimer.jsx';
import TaskModal, { CATEGORIES, PRIORITY } from '../components/TaskModal.jsx';
import { Badge, Card, ConfirmDialog, EmptyState, PageHeader, Segmented } from '../components/ui.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useFocus } from '../context/FocusContext.jsx';
import { cn, fmtMinutes, localDateKey, relativeDay } from '../utils/format.js';
import { parseQuickAdd } from '../utils/quickAdd.js';

const PRIORITY_STYLE = {
  3: { bar: 'bg-rose-500', badge: 'rose' },
  2: { bar: 'bg-amber-500', badge: 'amber' },
  1: { bar: 'bg-emerald-500', badge: 'emerald' },
};
const COLUMNS = [['todo', 'To do', Circle], ['doing', 'In progress', Clock], ['done', 'Done', CheckCircle2]];

function TaskCard({ task, onEdit, onDelete, compact = false }) {
  const { taskActions } = useApp();
  const focus = useFocus();
  const done = task.status === 'done';
  const style = PRIORITY_STYLE[task.priority] || PRIORITY_STYLE[2];
  const pct = task.estimate_min ? Math.min(100, Math.round((task.spent_min / task.estimate_min) * 100)) : null;

  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/task', String(task.id))}
      className={cn('group relative cursor-grab overflow-hidden rounded-xl border border-slate-200 bg-white p-3 pl-4 shadow-sm transition hover:shadow-md active:cursor-grabbing dark:border-slate-800 dark:bg-slate-900', done && 'opacity-60')}
    >
      <span className={cn('absolute inset-y-0 left-0 w-1', style.bar)} />
      <div className="flex items-start gap-2.5">
        <button onClick={() => taskActions.setStatus(task.id, done ? 'todo' : 'done')} className="mt-0.5 shrink-0 text-slate-300 transition hover:text-emerald-500" aria-label={done ? 'Mark as not done' : 'Mark as done'}>
          {done ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm font-semibold text-slate-800 dark:text-slate-100', done && 'line-through')}>{task.title}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone="slate">{task.category}</Badge>
            {!compact && <Badge tone={style.badge}>{PRIORITY[task.priority]}</Badge>}
            {task.due_date && (
              <Badge tone={task.overdue ? 'rose' : task.due_date === localDateKey() ? 'amber' : 'slate'}>
                {task.overdue ? <AlertCircle className="h-3 w-3" /> : <CalendarClock className="h-3 w-3" />}{relativeDay(task.due_date)}
              </Badge>
            )}
            {task.estimate_min && <span className="text-xs text-slate-400">{fmtMinutes(task.spent_min)} / {fmtMinutes(task.estimate_min)}</span>}
          </div>
          {pct !== null && !done && <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${pct}%` }} /></div>}
        </div>
        <div className="flex shrink-0 gap-0.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          {!done && <button onClick={() => { focus.setTaskId(task.id); document.getElementById('focus-timer')?.scrollIntoView({ behavior: 'smooth' }); }} className="icon-btn !h-7 !w-7" aria-label="Focus on this task" title="Focus on this"><Play className="h-3.5 w-3.5" /></button>}
          <button onClick={() => onEdit(task)} className="icon-btn !h-7 !w-7" aria-label="Edit task"><Pencil className="h-3.5 w-3.5" /></button>
          <button onClick={() => onDelete(task)} className="icon-btn !h-7 !w-7 hover:!text-rose-600" aria-label="Delete task"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    </div>
  );
}

function Board({ tasks, ...handlers }) {
  const { taskActions } = useApp();
  const [over, setOver] = useState(null);
  const drop = (status) => (e) => {
    e.preventDefault();
    setOver(null);
    const id = Number(e.dataTransfer.getData('text/task'));
    const task = tasks.find((t) => t.id === id);
    if (task && task.status !== status) taskActions.setStatus(id, status);
  };
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {COLUMNS.map(([status, label, Icon]) => {
        const items = tasks.filter((t) => t.status === status);
        return (
          <div key={status} onDragOver={(e) => { e.preventDefault(); setOver(status); }} onDragLeave={() => setOver(null)} onDrop={drop(status)}
            className={cn('min-h-[200px] rounded-2xl border-2 border-dashed p-3 transition', over === status ? 'border-violet-400 bg-violet-50/60 dark:bg-violet-500/10' : 'border-transparent bg-slate-100/70 dark:bg-slate-900/60')}>
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200"><Icon className="h-4 w-4" /> {label}</h3>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-500 dark:bg-slate-800">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map((t) => <TaskCard key={t.id} task={t} compact {...handlers} />)}
              {items.length === 0 && <p className="py-6 text-center text-xs text-slate-400">Drop tasks here</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const urgent = (t, today) => t.due_date && t.due_date <= new Date(new Date(`${today}T00:00:00`).getTime() + 2 * 86400000).toISOString().slice(0, 10);

function Matrix({ tasks, ...handlers }) {
  const today = localDateKey();
  const open = tasks.filter((t) => t.status !== 'done');
  const quads = [
    ['Do now', 'Important & urgent', (t) => t.priority === 3 && urgent(t, today), 'border-rose-300 bg-rose-50/60 dark:border-rose-500/30 dark:bg-rose-500/5'],
    ['Plan it', 'Important, not urgent', (t) => t.priority === 3 && !urgent(t, today), 'border-violet-300 bg-violet-50/60 dark:border-violet-500/30 dark:bg-violet-500/5'],
    ['Quick wins', 'Urgent, less important', (t) => t.priority < 3 && urgent(t, today), 'border-amber-300 bg-amber-50/60 dark:border-amber-500/30 dark:bg-amber-500/5'],
    ['Later', 'Neither', (t) => t.priority < 3 && !urgent(t, today), 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900'],
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {quads.map(([title, sub, test, cls]) => {
        const items = open.filter(test);
        return (
          <div key={title} className={cn('min-h-[160px] rounded-2xl border p-4', cls)}>
            <div className="mb-3 flex items-baseline justify-between"><h3 className="font-bold text-slate-800 dark:text-slate-100">{title}</h3><span className="text-xs text-slate-500">{sub}</span></div>
            <div className="space-y-2">{items.map((t) => <TaskCard key={t.id} task={t} compact {...handlers} />)}{items.length === 0 && <p className="py-4 text-center text-xs text-slate-400">Nothing here</p>}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function Tasks() {
  const { tasks, taskActions, ready } = useApp();
  const [view, setView] = useState('board');
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [quick, setQuick] = useState('');
  const [editing, setEditing] = useState(null);
  const [modal, setModal] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const parsed = useMemo(() => parseQuickAdd(quick), [quick]);
  const visible = useMemo(() => tasks.filter((t) => (category === 'All' || t.category === category) && t.title.toLowerCase().includes(query.toLowerCase())), [tasks, category, query]);
  const open = tasks.filter((t) => t.status !== 'done');
  const topThree = open.slice(0, 3); // already sorted by the server's priority score
  const today = localDateKey();
  const stats = { open: open.length, today: open.filter((t) => t.due_date === today).length, overdue: open.filter((t) => t.overdue).length, done: tasks.filter((t) => t.status === 'done').length };

  const addQuick = async (e) => {
    e.preventDefault();
    if (!parsed.title) return;
    const result = await taskActions.add({ title: parsed.title, priority: parsed.priority, category: parsed.category, due_date: parsed.due_date, estimate_min: parsed.estimate_min });
    if (result) setQuick('');
  };

  const handlers = { onEdit: (t) => { setEditing(t); setModal(true); }, onDelete: setDeleting };

  return (
    <div className="animate-fade-up">
      <PageHeader icon={CheckSquare} tone="emerald" title="Planner" subtitle="Plan tasks, prioritise smartly and stay focused."
        actions={<button className="btn btn-primary" onClick={() => { setEditing(null); setModal(true); }}><Plus className="h-4 w-4" /> New task</button>} />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <form onSubmit={addQuick}>
              <label className="label" htmlFor="quick-add">Quick add</label>
              <div className="flex gap-2">
                <input id="quick-add" className="input" value={quick} onChange={(e) => setQuick(e.target.value)} placeholder="Finish lab report !high #study fri ~1h30m" autoComplete="off" />
                <button className="btn btn-primary" disabled={!parsed.title}><Plus className="h-4 w-4" /> Add</button>
              </div>
            </form>
            {quick.trim() ? (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs" aria-live="polite">
                <span className="text-slate-400">Will create:</span>
                <Badge tone="violet">{parsed.title || '(add a title)'}</Badge>
                <Badge tone={PRIORITY_STYLE[parsed.priority].badge}>{PRIORITY[parsed.priority]}</Badge>
                <Badge tone="slate">{parsed.category}</Badge>
                {parsed.due_date && <Badge tone="cyan"><CalendarClock className="h-3 w-3" />{parsed.due_date}</Badge>}
                {parsed.estimate_min && <Badge tone="slate"><Timer className="h-3 w-3" />{fmtMinutes(parsed.estimate_min)}</Badge>}
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-400">Tips: <code>!high</code> priority · <code>#eca</code> category · <code>tomorrow</code>, <code>fri</code>, <code>+3d</code> due date · <code>~45m</code> estimate</p>
            )}
          </Card>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[['Open', stats.open, 'text-violet-600'], ['Due today', stats.today, 'text-amber-600'], ['Overdue', stats.overdue, 'text-rose-600'], ['Done', stats.done, 'text-emerald-600']].map(([k, v, c]) => (
              <Card key={k} className="!p-4 text-center"><p className={cn('text-2xl font-extrabold', c)}>{v}</p><p className="text-xs font-semibold text-slate-400">{k}</p></Card>
            ))}
          </div>

          {topThree.length > 0 && (
            <Card className="!border-violet-200 !bg-gradient-to-br !from-violet-50 !to-white dark:!border-violet-500/30 dark:!from-violet-500/10 dark:!to-slate-900">
              <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900 dark:text-white"><Flame className="h-5 w-5 text-orange-500" /> Do these first</h3>
              <div className="space-y-2">{topThree.map((t) => <TaskCard key={t.id} task={t} {...handlers} />)}</div>
              <p className="mt-3 text-xs text-slate-400">Ranked by priority, due date and effort.</p>
            </Card>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Segmented value={view} onChange={setView} options={[{ value: 'board', label: 'Board', icon: Columns3 }, { value: 'list', label: 'List', icon: List }, { value: 'matrix', label: 'Matrix', icon: Grid2x2 }]} />
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="input !w-48 !pl-9" placeholder="Search tasks" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search tasks" /></div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['All', ...CATEGORIES].map((c) => <button key={c} onClick={() => setCategory(c)} className={cn('chip', category === c && 'chip-active')}>{c}</button>)}
          </div>

          {ready && tasks.length === 0 ? (
            <EmptyState icon={CheckSquare} title="No tasks yet" text="Type a task above (try “Read chapter 4 !high tomorrow”) to get started." />
          ) : view === 'board' ? <Board tasks={visible} {...handlers} />
            : view === 'matrix' ? <Matrix tasks={visible} {...handlers} />
            : <div className="space-y-2">{visible.map((t) => <TaskCard key={t.id} task={t} {...handlers} />)}{visible.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No matching tasks.</p>}</div>}
        </div>

        <div id="focus-timer" className="xl:sticky xl:top-24 xl:self-start"><FocusTimer /></div>
      </div>

      <TaskModal open={modal} task={editing} onClose={() => setModal(false)} />
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => taskActions.remove(deleting.id)} title="Delete task?" message={`“${deleting?.title}” will be removed permanently.`} />
    </div>
  );
}
