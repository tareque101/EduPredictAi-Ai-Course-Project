import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Coffee,
  Download,
  Droplets,
  Dumbbell,
  Flame,
  Info,
  Loader2,
  Minus,
  Monitor,
  Moon,
  Pencil,
  Plus,
  Smile,
  Sparkles,
  Target,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { deleteHealthLog, fetchHealthLogs, saveHealthLog } from '../api/client.js';

const GOALS = { sleep: 8, water: 2000, movement: 30 };
const MOOD_EMOJI = ['😞', '🙁', '😐', '🙂', '😄'];
const STRESS_EMOJI = ['😌', '🙂', '😐', '😣', '😫'];
const ENERGY_EMOJI = ['🪫', '😴', '😐', '⚡', '🚀'];
const SLEEP_EMOJI = ['😵', '😕', '😐', '😊', '😴'];
const MOOD_WORDS = ['Very low', 'Low', 'Okay', 'Good', 'Great'];
const STRESS_WORDS = ['Calm', 'Relaxed', 'Okay', 'Stressed', 'Overwhelmed'];
const ENERGY_WORDS = ['Drained', 'Tired', 'Okay', 'Energetic', 'Super energetic'];
const SLEEP_WORDS = ['Terrible', 'Poor', 'Okay', 'Good', 'Restful'];

const TONE = {
  rose: 'bg-rose-50 text-rose-700 ring-rose-100',
  cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  violet: 'bg-violet-50 text-violet-700 ring-violet-100',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
};

const localDateKey = (d = new Date()) => {
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 10);
};
const shortDate = (d) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const avg = (arr) => (arr.length ? arr.reduce((s, n) => s + n, 0) / arr.length : 0);

// Simple self-tracking score out of 100 (not a medical measure)
const wellnessScore = (l) => {
  const parts = [
    Math.min((l.sleep_hours || 0) / GOALS.sleep, 1) * 25,
    ((l.mood - 1) / 4) * 20,
    ((5 - l.stress) / 4) * 20,
    Math.min((l.water_ml || 0) / GOALS.water, 1) * 15,
    Math.min((l.exercise_min || 0) / GOALS.movement, 1) * 20,
  ];
  return Math.round(parts.reduce((s, n) => s + n, 0));
};

const emptyForm = () => ({
  log_date: localDateKey(),
  sleep_hours: '',
  sleep_quality: 3,
  mood: 3,
  stress: 3,
  energy_level: 3,
  water_ml: 0,
  exercise_min: 0,
  screen_time_hrs: 0,
  caffeine_cups: 0,
  notes: '',
});

const LABEL = 'text-xs font-semibold uppercase tracking-wide text-slate-500';
const FIELD_LABEL = `mb-1.5 block ${LABEL}`;
const INPUT =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100';
const CARD = 'rounded-2xl border border-slate-200 bg-white p-6';

function ScoreRing({ value }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
      <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="#ffffff"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          className="transition-all duration-700"
        />
      </svg>
      <span className="text-2xl font-extrabold">{value ?? '–'}</span>
    </div>
  );
}

function ScalePicker({ label, value, onChange, emojis, words }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className={LABEL}>{label}</span>
        <span className="text-xs font-semibold text-indigo-600">{words[value - 1]}</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {emojis.map((emoji, i) => {
          const v = i + 1;
          const active = value === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              aria-label={`${label}: ${words[i]}`}
              className={`flex h-11 items-center justify-center rounded-xl text-xl transition ${
                active ? 'scale-105 bg-indigo-600 shadow-md shadow-indigo-500/30' : 'bg-slate-50 hover:bg-indigo-50'
              }`}
            >
              {emoji}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Stepper({ value, onChange, min = 0, max = 20, step = 1, unit }) {
  const current = Number(value) || 0;
  const set = (n) => onChange(Math.min(max, Math.max(min, n)));
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => set(current - step)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
        aria-label={`Decrease ${unit}`}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-[4.5rem] text-center text-lg font-bold text-slate-900">
        {current} <span className="text-xs font-normal text-slate-400">{unit}</span>
      </span>
      <button
        type="button"
        onClick={() => set(current + step)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
        aria-label={`Increase ${unit}`}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <span className={`inline-flex rounded-xl p-2 ${accent}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function GoalBar({ label, value, goal, unit, color }) {
  const pct = Math.min(100, Math.round(((value || 0) / goal) * 100));
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="text-slate-400">
          {value ?? 0} / {goal} {unit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Health() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  const [saving, setSaving] = useState(false);
  const [range, setRange] = useState(14);

  useEffect(() => {
    fetchHealthLogs()
      .then(setLogs)
      .catch(() => setError('Could not load health logs. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  const today = localDateKey();
  const todayLog = logs.find((l) => l.log_date === today);
  const week = useMemo(() => logs.slice(0, 7), [logs]);
  const hasWeek = week.length > 0;

  const weekStats = useMemo(
    () => ({
      sleep: avg(week.map((l) => l.sleep_hours || 0)),
      mood: avg(week.map((l) => l.mood)),
      stress: avg(week.map((l) => l.stress)),
      energy: avg(week.map((l) => l.energy_level ?? 3)),
      water: avg(week.map((l) => l.water_ml || 0)),
      screenTime: avg(week.map((l) => l.screen_time_hrs || 0)),
      caffeine: avg(week.map((l) => l.caffeine_cups || 0)),
      movement: week.reduce((s, l) => s + (l.exercise_min || 0), 0),
    }),
    [week]
  );

  // Consecutive days with a check-in; today may be empty without breaking the streak
  const streak = useMemo(() => {
    const dates = new Set(logs.map((l) => l.log_date));
    const d = new Date();
    if (!dates.has(localDateKey(d))) d.setDate(d.getDate() - 1);
    let count = 0;
    while (dates.has(localDateKey(d))) {
      count += 1;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [logs]);

  const chartData = useMemo(
    () =>
      [...logs]
        .slice(0, range)
        .reverse()
        .map((l) => ({
          day: shortDate(l.log_date),
          mood: l.mood,
          stress: l.stress,
          sleep: l.sleep_hours || 0,
          score: wellnessScore(l),
        })),
    [logs, range]
  );

  const insights = useMemo(() => {
    if (!hasWeek) return [];
    const list = [];
    if (weekStats.sleep && weekStats.sleep < 6)
      list.push({ tone: 'rose', text: 'Average sleep this week is under 6 hours. Aim for 7 to 8 hours and a fixed bedtime.' });
    if (weekStats.stress >= 4)
      list.push({ tone: 'rose', text: 'Stress has been high. Try a 5-minute breathing break or a short walk between study sessions.' });
    if (weekStats.water && weekStats.water < 1500)
      list.push({ tone: 'cyan', text: 'Water intake is low this week. Keep a bottle on your desk and sip every hour.' });
    if (weekStats.movement < 90)
      list.push({ tone: 'emerald', text: 'Less than 90 minutes of movement this week. Even a 15-minute daily walk makes a difference.' });
    if (weekStats.caffeine >= 3)
      list.push({ tone: 'amber', text: 'Caffeine is above 3 cups a day on average. Cutting it after noon can protect your sleep.' });
    if (weekStats.screenTime > 8)
      list.push({ tone: 'violet', text: 'Screen time is above 8 hours. Try the 20-20-20 rule: every 20 minutes, look 20 feet away for 20 seconds.' });
    if (weekStats.mood >= 4)
      list.push({ tone: 'emerald', text: 'Mood has been good this week. Keep doing what is working.' });
    return list.slice(0, 3);
  }, [hasWeek, week, weekStats]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const setField = (name) => (value) => setForm((prev) => ({ ...prev, [name]: value }));

  const addWater = (ml) => setForm((prev) => ({ ...prev, water_ml: (Number(prev.water_ml) || 0) + ml }));

  const resetForm = () => {
    setForm(emptyForm());
    setEditing(false);
  };

  const startEdit = (log) => {
    setForm({
      log_date: log.log_date,
      sleep_hours: log.sleep_hours ?? '',
      sleep_quality: log.sleep_quality ?? 3,
      mood: log.mood ?? 3,
      stress: log.stress ?? 3,
      energy_level: log.energy_level ?? 3,
      water_ml: log.water_ml ?? 0,
      exercise_min: log.exercise_min ?? 0,
      screen_time_hrs: log.screen_time_hrs ?? 0,
      caffeine_cups: log.caffeine_cups ?? 0,
      notes: log.notes || '',
    });
    setEditing(true);
    setError('');
    document.getElementById('checkin-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const saved = await saveHealthLog({
        ...form,
        sleep_hours: Number(form.sleep_hours) || 0,
        sleep_quality: Number(form.sleep_quality),
        mood: Number(form.mood),
        stress: Number(form.stress),
        energy_level: Number(form.energy_level),
        water_ml: Number(form.water_ml) || 0,
        exercise_min: Number(form.exercise_min) || 0,
        screen_time_hrs: Number(form.screen_time_hrs) || 0,
        caffeine_cups: Number(form.caffeine_cups) || 0,
      });
      setLogs((prev) =>
        [saved, ...prev.filter((l) => l.log_date !== saved.log_date)].sort((a, b) =>
          b.log_date.localeCompare(a.log_date)
        )
      );
      setFlash(editing ? 'Entry updated' : 'Check-in saved');
      setTimeout(() => setFlash(''), 2500);
      resetForm();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save. Check the values.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await deleteHealthLog(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
    } catch {
      setError('Could not delete. Try again.');
    }
  };

  const exportCsv = () => {
    const header = ['date', 'sleep_hours', 'sleep_quality', 'mood', 'stress', 'energy_level', 'water_ml', 'exercise_min', 'screen_time_hrs', 'caffeine_cups', 'score', 'notes'];
    const rows = logs.map((l) => [
      l.log_date,
      l.sleep_hours ?? '',
      l.sleep_quality ?? '',
      l.mood,
      l.stress,
      l.energy_level ?? '',
      l.water_ml ?? '',
      l.exercise_min ?? '',
      l.screen_time_hrs ?? '',
      l.caffeine_cups ?? '',
      wellnessScore(l),
      `"${(l.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-logs-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const todayScore = todayLog ? wellnessScore(todayLog) : null;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 ring-1 ring-rose-100">
            <Sparkles className="h-3.5 w-3.5" /> Wellbeing
          </span>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">My Health</h1>
          <p className="mt-1 text-sm text-slate-500">Daily check-ins for sleep, mood, stress, movement and energy.</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={logs.length === 0}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </header>

      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          For self-tracking only, not medical advice. If you have health concerns, please consult a doctor. Your entries
          are private to your account.
        </p>
      </div>

      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>}

      {/* Today hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-rose-500 p-6 text-white shadow-lg shadow-indigo-500/20 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <ScoreRing value={todayScore} />
            <div>
              <p className="text-sm text-indigo-100">{todayLabel}</p>
              <p className="mt-0.5 text-xl font-bold">
                {todayLog ? 'Today is logged' : 'You have not checked in today'}
              </p>
              <p className="mt-1 text-xs text-indigo-100">
                {todayLog ? 'Wellness score out of 100' : 'Log today to see your wellness score'}
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                <Flame className="h-3.5 w-3.5" /> {streak}-day check-in streak
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => document.getElementById('checkin-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 shadow-md transition hover:scale-[1.02] md:self-center"
          >
            <Plus className="h-4 w-4" /> {todayLog ? 'Update today' : 'Check in now'}
          </button>
        </div>
      </section>

      {/* Today's goals */}
      <section className={CARD}>
        <div className="mb-5 flex items-center gap-2">
          <Target className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">Today's goals</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <GoalBar label="Sleep" value={todayLog?.sleep_hours} goal={GOALS.sleep} unit="hrs" color="bg-indigo-500" />
          <GoalBar label="Water" value={todayLog?.water_ml} goal={GOALS.water} unit="ml" color="bg-cyan-500" />
          <GoalBar label="Movement" value={todayLog?.exercise_min} goal={GOALS.movement} unit="min" color="bg-emerald-500" />
        </div>
      </section>

      {/* Weekly stats */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Moon} label="Avg sleep (7 days)" value={hasWeek ? `${weekStats.sleep.toFixed(1)} hrs` : '–'} accent="bg-indigo-50 text-indigo-600" />
        <StatCard icon={Smile} label="Avg mood" value={hasWeek ? `${weekStats.mood.toFixed(1)} / 5` : '–'} accent="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Activity} label="Avg stress" value={hasWeek ? `${weekStats.stress.toFixed(1)} / 5` : '–'} accent="bg-rose-50 text-rose-600" />
        <StatCard icon={Droplets} label="Avg water" value={hasWeek ? `${Math.round(weekStats.water)} ml` : '–'} accent="bg-cyan-50 text-cyan-600" />
        <StatCard icon={Dumbbell} label="Movement (7 days)" value={hasWeek ? `${weekStats.movement} min` : '–'} accent="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Monitor} label="Avg screen time" value={hasWeek ? `${weekStats.screenTime.toFixed(1)} hrs` : '–'} accent="bg-violet-50 text-violet-600" />
        <StatCard icon={Coffee} label="Avg caffeine" value={hasWeek ? `${weekStats.caffeine.toFixed(1)} cups` : '–'} accent="bg-amber-50 text-amber-600" />
        <StatCard icon={Zap} label="Avg energy" value={hasWeek ? `${weekStats.energy.toFixed(1)} / 5` : '–'} accent="bg-yellow-50 text-yellow-600" />
      </section>

      {/* Insights */}
      <section className={CARD}>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-600" />
          <h2 className="text-lg font-semibold text-slate-900">Insights for this week</h2>
        </div>
        {insights.length === 0 ? (
          <p className="text-sm text-slate-500">
            {hasWeek ? 'Looking good. No concerns this week.' : 'Log a few check-ins and personalised insights will appear here.'}
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {insights.map((i) => (
              <p key={i.text} className={`rounded-xl p-4 text-sm leading-relaxed ring-1 ${TONE[i.tone]}`}>
                {i.text}
              </p>
            ))}
          </div>
        )}
      </section>

      {/* Charts */}
      <section className="grid gap-6 lg:grid-cols-5">
        <div className={`${CARD} lg:col-span-3`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Mood and stress</h2>
              <p className="text-sm text-slate-500">1 = low, 5 = high</p>
            </div>
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              {[7, 14, 30].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRange(n)}
                  className={`rounded-lg px-3 py-1.5 transition ${range === n ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
                >
                  {n}d
                </button>
              ))}
            </div>
          </div>
          {chartData.length < 2 ? (
            <p className="py-16 text-center text-sm text-slate-500">Add at least two check-ins to see a trend.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#94a3b8" fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="mood" name="Mood" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="stress" name="Stress" stroke="#f43f5e" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className={`${CARD} lg:col-span-2`}>
          <h2 className="text-lg font-semibold text-slate-900">Sleep hours</h2>
          <p className="mb-4 text-sm text-slate-500">Goal: {GOALS.sleep} hours</p>
          {chartData.length < 2 ? (
            <p className="py-16 text-center text-sm text-slate-500">No sleep data yet.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 12]} />
                  <Tooltip />
                  <Bar dataKey="sleep" name="Sleep (hrs)" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {/* Check-in form */}
      <section id="checkin-form" className={`${CARD} scroll-mt-24`}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            {editing ? <Pencil className="h-5 w-5 text-indigo-600" /> : <Plus className="h-5 w-5 text-indigo-600" />}
            {editing ? `Editing entry for ${shortDate(form.log_date)}` : 'Daily check-in'}
          </h2>
          <div className="flex items-center gap-3">
            {flash && <span className="text-sm font-semibold text-emerald-600">{flash}</span>}
            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" /> Cancel edit
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={FIELD_LABEL}>Date</label>
              <input name="log_date" type="date" value={form.log_date} onChange={handleChange} required className={INPUT} />
            </div>
            <div>
              <label className={FIELD_LABEL}>Sleep (hrs)</label>
              <input
                name="sleep_hours"
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={form.sleep_hours}
                onChange={handleChange}
                placeholder="e.g. 7"
                className={INPUT}
              />
            </div>
            <div>
              <label className={FIELD_LABEL}>Exercise / walking</label>
              <div className="flex flex-wrap gap-1.5">
                {[0, 15, 30, 45, 60].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setField('exercise_min')(m)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                      Number(form.exercise_min) === m
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-emerald-50'
                    }`}
                  >
                    {m === 0 ? 'None' : `${m}m`}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={FIELD_LABEL}>Caffeine</label>
              <Stepper value={form.caffeine_cups} onChange={setField('caffeine_cups')} max={20} unit="cups" />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={FIELD_LABEL}>Water</label>
              <div className="flex flex-wrap items-center gap-2">
                <Stepper value={form.water_ml} onChange={setField('water_ml')} min={0} max={10000} step={250} unit="ml" />
                <button
                  type="button"
                  onClick={() => addWater(250)}
                  className="rounded-lg bg-cyan-50 px-2.5 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-100"
                >
                  +250 ml
                </button>
                <button
                  type="button"
                  onClick={() => addWater(500)}
                  className="rounded-lg bg-cyan-50 px-2.5 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-100"
                >
                  +500 ml
                </button>
              </div>
            </div>
            <div>
              <label className={FIELD_LABEL}>Screen time</label>
              <Stepper value={form.screen_time_hrs} onChange={setField('screen_time_hrs')} min={0} max={24} step={0.5} unit="hrs" />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <ScalePicker label="Sleep quality" value={form.sleep_quality} onChange={setField('sleep_quality')} emojis={SLEEP_EMOJI} words={SLEEP_WORDS} />
            <ScalePicker label="Mood" value={form.mood} onChange={setField('mood')} emojis={MOOD_EMOJI} words={MOOD_WORDS} />
            <ScalePicker label="Stress" value={form.stress} onChange={setField('stress')} emojis={STRESS_EMOJI} words={STRESS_WORDS} />
            <ScalePicker label="Energy" value={form.energy_level} onChange={setField('energy_level')} emojis={ENERGY_EMOJI} words={ENERGY_WORDS} />
          </div>

          <div>
            <label className={FIELD_LABEL}>Notes (optional)</label>
            <input name="notes" value={form.notes} onChange={handleChange} placeholder="Anything that affected your day" className={INPUT} />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:shadow-lg disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? 'Update entry' : 'Save check-in'}
          </button>
        </form>
      </section>

      {/* History */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">History</h2>
        {loading && <p className="text-sm text-slate-500">Loading...</p>}
        {!loading && logs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
            No check-ins yet. Save your first one above to start tracking.
          </div>
        )}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {logs.map((l) => {
            const score = wellnessScore(l);
            return (
              <article
                key={l.id}
                onClick={() => startEdit(l)}
                className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{shortDate(l.log_date)}</p>
                    <p className="text-xs text-slate-400">Score {score} / 100</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Pencil className="h-3.5 w-3.5 text-slate-300 opacity-0 transition group-hover:opacity-100" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(l.id);
                      }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Delete entry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-indigo-50 p-2">
                    <p className="font-bold text-indigo-700">{l.sleep_hours ?? 0}h</p>
                    <p className="text-slate-500">Sleep</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-2">
                    <p className="font-bold text-emerald-700">{MOOD_EMOJI[l.mood - 1]}</p>
                    <p className="text-slate-500">Mood</p>
                  </div>
                  <div className="rounded-lg bg-rose-50 p-2">
                    <p className="font-bold text-rose-700">{STRESS_EMOJI[l.stress - 1]}</p>
                    <p className="text-slate-500">Stress</p>
                  </div>
                  <div className="rounded-lg bg-cyan-50 p-2">
                    <p className="font-bold text-cyan-700">{l.water_ml ?? 0}</p>
                    <p className="text-slate-500">ml</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                  {l.exercise_min > 0 && (
                    <span className="flex items-center gap-1">
                      <Dumbbell className="h-3.5 w-3.5" /> {l.exercise_min} min
                    </span>
                  )}
                  {l.screen_time_hrs > 0 && (
                    <span className="flex items-center gap-1">
                      <Monitor className="h-3.5 w-3.5" /> {l.screen_time_hrs} hrs screen
                    </span>
                  )}
                  {l.caffeine_cups > 0 && (
                    <span className="flex items-center gap-1">
                      <Coffee className="h-3.5 w-3.5" /> {l.caffeine_cups} cups
                    </span>
                  )}
                </div>
                {l.notes && <p className="mt-2 text-xs text-slate-500">{l.notes}</p>}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}