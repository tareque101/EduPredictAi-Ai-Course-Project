import { useState } from 'react';
import { Flame, Plus, Target, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

const CATEGORIES = ['Study', 'Recovery', 'Health', 'Lifestyle', 'Other'];

const EMPTY_FORM = {
  name: '',
  category: 'Study',
  goal: 'at-least',
  unit: 'hrs',
  target: '',
  step: '0.5',
};

function getStatus(habit) {
  const pct = habit.target ? habit.current / habit.target : 0;

  if (habit.goal === 'at-most') {
    if (habit.current <= habit.target) {
      return { label: 'Within limit', badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500' };
    }
    if (habit.current <= habit.target * 1.25) {
      return { label: 'Slightly over', badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500' };
    }
    return { label: 'Over limit', badge: 'bg-rose-100 text-rose-700', bar: 'bg-rose-500' };
  }

  if (pct >= 1) return { label: 'Achieved', badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500' };
  if (pct >= 0.7) return { label: 'On track', badge: 'bg-blue-100 text-blue-700', bar: 'bg-blue-500' };
  if (pct >= 0.4) return { label: 'Behind', badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500' };
  return { label: 'At risk', badge: 'bg-rose-100 text-rose-700', bar: 'bg-rose-500' };
}

export default function MyHabits() {
  const { habits, addHabit, logHabit, removeHabit } = useApp();
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const target = Number(form.target);
    const step = Number(form.step);

    if (!form.name.trim()) {
      setFormError('Habit name is required.');
      return;
    }
    if (!Number.isFinite(target) || target <= 0) {
      setFormError('Target must be a positive number.');
      return;
    }
    if (!Number.isFinite(step) || step <= 0) {
      setFormError('Log step must be a positive number.');
      return;
    }

    addHabit({
      name: form.name.trim(),
      category: form.category,
      goal: form.goal,
      unit: form.unit.trim() || 'units',
      target,
      step,
    });
    setForm(EMPTY_FORM);
    setFormError('');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Habits</h1>
        <p className="text-sm text-slate-500">
          Track daily habits, monitor progress against targets, and keep your streaks alive.
        </p>
      </div>

      {/* Add habit form */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Plus className="h-5 w-5 text-indigo-500" /> Add a New Habit
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Habit name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Read research papers"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Goal type</label>
            <select
              name="goal"
              value={form.goal}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            >
              <option value="at-least">At least</option>
              <option value="at-most">At most (limit)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Target</label>
            <input
              name="target"
              type="number"
              min="0"
              step="any"
              value={form.target}
              onChange={handleChange}
              placeholder="e.g. 2"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Unit / Step</label>
            <div className="flex gap-2">
              <input
                name="unit"
                value={form.unit}
                onChange={handleChange}
                className="w-1/2 rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none focus:border-indigo-400"
              />
              <input
                name="step"
                type="number"
                min="0"
                step="any"
                value={form.step}
                onChange={handleChange}
                className="w-1/2 rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>
          </div>
          <div className="flex flex-col justify-end md:col-span-6">
            {formError && <p className="mb-2 text-sm text-rose-600">{formError}</p>}
            <button
              type="submit"
              className="self-start rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Add Habit
            </button>
          </div>
        </form>
      </section>

      {/* Habit list */}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {habits.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 md:col-span-2">
            No habits yet. Add your first habit above to start tracking.
          </div>
        )}

        {habits.map((habit) => {
          const status = getStatus(habit);
          const pct = habit.target ? Math.min(habit.current / habit.target, 1) * 100 : 0;
          return (
            <article key={habit.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: habit.color }}>
                    {habit.category}
                  </p>
                  <h3 className="text-base font-semibold text-slate-900">{habit.name}</h3>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${status.badge}`}>
                  {status.label}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-slate-500">
                  <Target className="h-4 w-4" />
                  {habit.goal === 'at-most' ? 'Limit' : 'Target'}:{' '}
                  <span className="font-semibold text-slate-800">
                    {habit.target} {habit.unit}
                  </span>
                </span>
                <span className="text-slate-500">
                  Current: <span className="font-semibold text-slate-800">{habit.current} {habit.unit}</span>
                </span>
              </div>

              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${status.bar}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1.5 text-right text-xs text-slate-400">{Math.round(pct)}% of target</p>

              <div className="mt-4 flex items-center justify-between">
                <span className="rounded-lg bg-orange-50 px-2.5 py-1 text-sm font-semibold text-orange-600">
                  <Flame className="mr-1 inline h-4 w-4" />
                  {habit.streak} {habit.streak === 1 ? 'Day' : 'Days'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => removeHabit(habit.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Delete ${habit.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => logHabit(habit.id)}
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    Log +{habit.step} {habit.unit}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}