import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Check, Droplets, Dumbbell, HeartPulse, Plus, Undo2, Users } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { Card, ENERGY, MOOD, ProgressBar, QUALITY, RatingPicker, STRESS, Stepper, TONES } from './ui.jsx';
import { cn, fmtHours } from '../utils/format.js';

const DEFAULTS = { sleep_hours: 7, sleep_quality: 3, mood: 3, stress: 3, energy_level: 3, water_ml: 0, exercise_min: 0, screen_time_hrs: 4, caffeine_cups: 0, notes: '' };

function PanelTitle({ icon: Icon, title, tone, right }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white', TONES[tone].grad)}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
      </div>
      {right}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <span className="label">{label}</span>
      {children}
    </div>
  );
}

/** Health check-in. Used by the Tracker, the quick-log modal and the Health page. */
export function HealthForm({ date, initial, compact = false }) {
  const { checkin } = useApp();
  const [form, setForm] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initial ? { ...DEFAULTS, ...initial, notes: initial.notes || '' } : DEFAULTS);
  }, [initial, date]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const glasses = Math.round((form.water_ml || 0) / 250);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { id, log_date, ...all } = form; // eslint-disable-line no-unused-vars
    // The compact form on a brand-new day only sends what the user could actually see.
    const fields = compact && !initial
      ? { sleep_hours: all.sleep_hours, mood: all.mood, stress: all.stress, water_ml: all.water_ml, exercise_min: all.exercise_min }
      : all;
    await checkin({ date, health: fields }, initial ? 'Health log updated' : 'Health check-in saved 💚');
    setSaving(false);
  };

  return (
    <Card>
      <PanelTitle icon={HeartPulse} title="Health check-in" tone="rose" right={initial && <span className="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"><Check className="h-3 w-3" /> Logged</span>} />
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Sleep (hours)"><Stepper value={form.sleep_hours} onChange={set('sleep_hours')} min={0} max={24} step={0.5} unit="h" /></Field>
          <Field label="Exercise (minutes)">
            <Stepper value={form.exercise_min} onChange={set('exercise_min')} min={0} max={600} step={5} unit="min" />
          </Field>
        </div>
        <Field label="Mood"><RatingPicker label="Mood" value={form.mood} onChange={set('mood')} options={MOOD} /></Field>
        <Field label="Stress"><RatingPicker label="Stress" value={form.stress} onChange={set('stress')} options={STRESS} /></Field>
        {!compact && (
          <>
            <Field label="Energy"><RatingPicker label="Energy" value={form.energy_level} onChange={set('energy_level')} options={ENERGY} /></Field>
            <Field label="Sleep quality"><RatingPicker label="Sleep quality" value={form.sleep_quality} onChange={set('sleep_quality')} options={QUALITY} /></Field>
          </>
        )}

        <Field label={`Water · ${glasses} glass${glasses === 1 ? '' : 'es'} (${form.water_ml || 0} ml)`}>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="chip" onClick={() => set('water_ml')(Math.max(0, (form.water_ml || 0) - 250))}>−250</button>
            <button type="button" className="chip inline-flex items-center gap-1" onClick={() => set('water_ml')(Math.min(10000, (form.water_ml || 0) + 250))}><Droplets className="h-3.5 w-3.5" /> +250 ml</button>
            <button type="button" className="chip" onClick={() => set('water_ml')(Math.min(10000, (form.water_ml || 0) + 500))}>+500</button>
            <div className="min-w-[6rem] flex-1"><ProgressBar value={form.water_ml || 0} max={2000} tone="cyan" label="Water goal" /></div>
          </div>
        </Field>

        {!compact && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Screen time (hours)"><Stepper value={form.screen_time_hrs} onChange={set('screen_time_hrs')} min={0} max={24} step={0.5} unit="h" /></Field>
            <Field label="Caffeine (cups)"><Stepper value={form.caffeine_cups} onChange={set('caffeine_cups')} min={0} max={20} step={1} unit="cups" /></Field>
          </div>
        )}
        {!compact && (
          <Field label="Notes (optional)">
            <textarea className="input min-h-[70px] resize-y" maxLength={1000} placeholder="Anything worth remembering about today?" value={form.notes} onChange={(e) => set('notes')(e.target.value)} />
          </Field>
        )}
        <button className="btn btn-primary w-full" disabled={saving}>{saving ? 'Saving…' : initial ? 'Update check-in' : 'Save check-in'}</button>
      </form>
    </Card>
  );
}

export function HabitsPanel({ enabled = true }) {
  const { habits, habitActions } = useApp();
  return (
    <Card>
      <PanelTitle icon={Brain} title="Habits" tone="violet" right={<Link to="/habits" className="text-xs font-semibold text-violet-600 hover:underline dark:text-violet-400">Manage</Link>} />
      {!enabled && <p className="mb-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">Habits can only be logged for today. Switch the date back to today.</p>}
      {habits.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No habits yet. <Link to="/habits" className="font-semibold text-violet-600 hover:underline dark:text-violet-400">Create your first habit</Link>.</p>
      ) : (
        <ul className="space-y-3">
          {habits.map((h) => {
            const atMost = h.goal === 'at-most';
            const done = atMost ? h.current > 0 && h.current <= h.target : h.current >= h.target;
            const over = atMost && h.current > h.target;
            return (
              <li key={h.id} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{h.name} {done && !over && <Check className="ml-0.5 inline h-4 w-4 text-emerald-500" />}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{h.current}/{h.target} {h.unit}{atMost ? ' max' : ''} · 🔥 {h.streak}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button disabled={!enabled || h.current <= 0} onClick={() => habitActions.undo(h.id)} className="icon-btn !h-8 !w-8 disabled:opacity-30" aria-label={`Undo ${h.name}`}><Undo2 className="h-4 w-4" /></button>
                    <button disabled={!enabled} onClick={() => habitActions.log(h.id)} className="btn btn-soft !px-3 !py-1.5 text-xs"><Plus className="h-3.5 w-3.5" />{h.step}</button>
                  </div>
                </div>
                <ProgressBar className="mt-2" height="h-1.5" value={h.current} max={h.target} tone={over ? 'rose' : done ? 'emerald' : 'violet'} label={h.name} />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

const DURATIONS = [{ label: '15m', h: 0.25 }, { label: '30m', h: 0.5 }, { label: '1h', h: 1 }, { label: '2h', h: 2 }];

export function SkillsPanel({ date, logged = [] }) {
  const { skills, checkin } = useApp();
  const byId = Object.fromEntries(logged.map((s) => [s.id, s.hours]));
  return (
    <Card>
      <PanelTitle icon={Dumbbell} title="Skill practice" tone="cyan" right={<Link to="/skills" className="text-xs font-semibold text-violet-600 hover:underline dark:text-violet-400">Manage</Link>} />
      {skills.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No skills yet. <Link to="/skills" className="font-semibold text-violet-600 hover:underline dark:text-violet-400">Add one</Link> and log practice in a tap.</p>
      ) : (
        <ul className="space-y-3">
          {skills.map((s) => (
            <li key={s.id} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{s.name}</p>
                {byId[s.id] ? <span className="badge bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300">{fmtHours(byId[s.id])} today</span> : <span className="text-xs text-slate-400">{fmtHours(s.practice_hours)} total</span>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DURATIONS.map((d) => (
                  <button key={d.label} className="chip" onClick={() => checkin({ date, skills: [{ id: s.id, hours: d.h }] }, `Logged ${d.label} of ${s.name}`)}>+{d.label}</button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function EcaPanel({ date, logged = [] }) {
  const { activities, checkin } = useApp();
  const open = activities.filter((a) => a.status === 'ongoing');
  const [selected, setSelected] = useState('');
  const current = selected || open[0]?.id || '';

  return (
    <Card>
      <PanelTitle icon={Users} title="Activities (ECA)" tone="amber" right={<Link to="/activities" className="text-xs font-semibold text-violet-600 hover:underline dark:text-violet-400">Manage</Link>} />
      {open.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No ongoing activities. <Link to="/activities" className="font-semibold text-violet-600 hover:underline dark:text-violet-400">Add one</Link> to track your time.</p>
      ) : (
        <div className="space-y-3">
          <select className="input" value={current} onChange={(e) => setSelected(Number(e.target.value))} aria-label="Activity">
            {open.map((a) => <option key={a.id} value={a.id}>{a.title}{a.role ? ` · ${a.role}` : ''}</option>)}
          </select>
          <div className="flex flex-wrap gap-1.5">
            {[0.5, 1, 2, 3].map((h) => (
              <button key={h} className="chip" onClick={() => checkin({ date, eca: [{ id: Number(current), hours: h }] }, `Logged ${fmtHours(h)}`)}>+{fmtHours(h)}</button>
            ))}
          </div>
          {logged.length > 0 && <p className="text-xs text-slate-500 dark:text-slate-400">Today: {logged.map((l) => `${l.title} (${fmtHours(l.hours)})`).join(', ')}</p>}
        </div>
      )}
    </Card>
  );
}
