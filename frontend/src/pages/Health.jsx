import { useEffect, useMemo, useState } from 'react';
import { Activity, Droplets, Dumbbell, Info, Loader2, Moon, Plus, Smile, Trash2 } from 'lucide-react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { deleteHealthLog, fetchHealthLogs, saveHealthLog } from '../api/client.js';

const localDateKey = (d = new Date()) => {
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 10);
};
const shortDate = (d) =>
  new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const emptyForm = () => ({
  log_date: localDateKey(),
  sleep_hours: '',
  sleep_quality: 3,
  mood: 3,
  stress: 3,
  water_ml: '',
  exercise_min: '',
  notes: '',
});

const INPUT =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';
const LABEL = 'mb-1.5 block text-xs font-semibold uppercase text-slate-500';
const CARD = 'rounded-2xl border border-slate-200 bg-white p-6';

function Slider({ label, icon: Icon, value, onChange, lowLabel, highLabel }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
          <Icon className="h-4 w-4 text-indigo-600" /> {label}
        </span>
        <span className="text-sm font-semibold text-indigo-600">{value} / 5</span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-600"
      />
      <div className="mt-1 flex justify-between text-[11px] text-slate-400">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <span className={`inline-flex rounded-xl p-2 ${accent}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

const avg = (arr) => (arr.length ? arr.reduce((s, n) => s + n, 0) / arr.length : 0);

export default function Health() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchHealthLogs()
      .then(setLogs)
      .catch(() => setError('Could not load health logs. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const loadIntoForm = (log) => {
    setForm({
      log_date: log.log_date,
      sleep_hours: log.sleep_hours,
      sleep_quality: log.sleep_quality,
      mood: log.mood,
      stress: log.stress,
      water_ml: log.water_ml,
      exercise_min: log.exercise_min,
      notes: log.notes || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const saved = await saveHealthLog({
        ...form,
        sleep_hours: Number(form.sleep_hours) || 0,
        water_ml: Number(form.water_ml) || 0,
        exercise_min: Number(form.exercise_min) || 0,
      });
      setLogs((prev) =>
        [saved, ...prev.filter((l) => l.log_date !== saved.log_date)].sort((a, b) =>
          b.log_date.localeCompare(a.log_date)
        )
      );
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

  const week = useMemo(() => logs.slice(0, 7), [logs]);
  const weekStats = useMemo(
    () => ({
      sleep: avg(week.map((l) => l.sleep_hours)),
      mood: avg(week.map((l) => l.mood)),
      stress: avg(week.map((l) => l.stress)),
      water: avg(week.map((l) => l.water_ml)),
    }),
    [week]
  );

  const chartData = useMemo(
    () =>
      [...logs]
        .slice(0, 14)
        .reverse()
        .map((l) => ({ day: shortDate(l.log_date), mood: l.mood, stress: l.stress, sleep: l.sleep_hours })),
    [logs]
  );

  const recent3 = logs.slice(0, 3);
  let nudge = 'Log a check-in each day to see your trends here.';
  if (recent3.length === 3 && recent3.every((l) => l.sleep_hours < 6)) {
    nudge = 'Your sleep has been under 6 hours for 3 days. Try an earlier bedtime tonight.';
  } else if (week.length >= 3 && weekStats.stress >= 4) {
    nudge = 'Stress has been high this week. A short walk or a break between study sessions can help.';
  } else if (week.length >= 3 && weekStats.mood >= 4) {
    nudge = 'Your mood has been good this week. Keep doing what is working.';
  }

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">My Health</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track daily wellbeing: sleep, mood, stress, water and movement.
        </p>
      </header>

      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          This is for self-tracking only and is not medical advice. If you have health concerns, please consult a
          doctor. Your entries are private to your account.
        </p>
      </div>

      {/* Weekly stats */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Moon} label="Avg sleep (7 days)" value={`${weekStats.sleep.toFixed(1)} hrs`} accent="bg-indigo-50 text-indigo-600" />
        <StatCard icon={Smile} label="Avg mood" value={`${weekStats.mood.toFixed(1)} / 5`} accent="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Activity} label="Avg stress" value={`${weekStats.stress.toFixed(1)} / 5`} accent="bg-rose-50 text-rose-600" />
        <StatCard icon={Droplets} label="Avg water" value={`${Math.round(weekStats.water)} ml`} accent="bg-cyan-50 text-cyan-600" />
      </section>

      {/* Nudge */}
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 text-sm text-slate-700">
        {nudge}
      </div>

      {/* Trend chart */}
      <section className={CARD}>
        <h2 className="text-lg font-semibold text-slate-900">Mood and stress trend</h2>
        <p className="mb-4 text-sm text-slate-500">Last 14 check-ins (1 = low, 5 = high).</p>
        {chartData.length < 2 ? (
          <p className="py-10 text-center text-sm text-slate-500">Add at least two check-ins to see a trend.</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
      </section>

      {/* Check-in form */}
      <section className={CARD}>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Plus className="h-5 w-5 text-indigo-600" /> Add a Daily Check-in
        </h2>

        <form onSubmit={handleSubmit} className="mt-5 space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <div>
              <label className={LABEL}>Date</label>
              <input name="log_date" type="date" value={form.log_date} onChange={handleChange} required className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Sleep (hrs)</label>
              <input name="sleep_hours" type="number" min="0" max="24" step="0.5" value={form.sleep_hours} onChange={handleChange} placeholder="e.g. 7" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Water (ml)</label>
              <input name="water_ml" type="number" min="0" step="100" value={form.water_ml} onChange={handleChange} placeholder="e.g. 2000" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Exercise (min)</label>
              <input name="exercise_min" type="number" min="0" step="5" value={form.exercise_min} onChange={handleChange} placeholder="e.g. 30" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Notes</label>
              <input name="notes" value={form.notes} onChange={handleChange} placeholder="Optional" className={INPUT} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Slider label="Sleep quality" icon={Moon} value={form.sleep_quality} onChange={(v) => setForm((p) => ({ ...p, sleep_quality: v }))} lowLabel="Poor" highLabel="Great" />
            <Slider label="Mood" icon={Smile} value={form.mood} onChange={(v) => setForm((p) => ({ ...p, mood: v }))} lowLabel="Low" highLabel="Great" />
            <Slider label="Stress" icon={Activity} value={form.stress} onChange={(v) => setForm((p) => ({ ...p, stress: v }))} lowLabel="Calm" highLabel="Very stressed" />
          </div>

          <div className="flex flex-col">
            {error && <p className="mb-2 text-sm text-rose-600">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 self-start rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Check-in
            </button>
          </div>
        </form>
      </section>

      {/* History */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">History</h2>
        {loading && <p className="text-sm text-slate-500">Loading...</p>}
        {!loading && logs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
            No check-ins yet. Add your first one above to start tracking.
          </div>
        )}
        <div className="grid gap-3 md:grid-cols-2">
          {logs.map((l) => (
            <article
              key={l.id}
              onClick={() => loadIntoForm(l)}
              className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">{shortDate(l.log_date)}</p>
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
              <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                <div className="rounded-lg bg-indigo-50 p-2"><p className="font-bold text-indigo-700">{l.sleep_hours}h</p><p className="text-slate-500">Sleep</p></div>
                <div className="rounded-lg bg-emerald-50 p-2"><p className="font-bold text-emerald-700">{l.mood}/5</p><p className="text-slate-500">Mood</p></div>
                <div className="rounded-lg bg-rose-50 p-2"><p className="font-bold text-rose-700">{l.stress}/5</p><p className="text-slate-500">Stress</p></div>
                <div className="rounded-lg bg-cyan-50 p-2"><p className="font-bold text-cyan-700">{l.water_ml}</p><p className="text-slate-500">ml</p></div>
              </div>
              {l.exercise_min > 0 && (
                <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                  <Dumbbell className="h-3.5 w-3.5" /> {l.exercise_min} min movement
                </p>
              )}
              {l.notes && <p className="mt-2 text-xs text-slate-500">{l.notes}</p>}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}