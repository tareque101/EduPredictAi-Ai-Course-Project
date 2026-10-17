import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Clock, Loader2, Plus, Target, Trash2, Trophy } from 'lucide-react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { createSkill, deleteSkill, fetchSkills, logSkillPractice } from '../api/client.js';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const CATEGORIES = ['Programming', 'Language', 'Design', 'Communication', 'Leadership', 'Other'];
const EMPTY = { name: '', category: 'Programming', level: 1, goal_level: 2 };
const INPUT =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100';

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-violet-100">
      <span className={`inline-flex rounded-xl p-2 ${accent}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

export default function Skills() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSkills()
      .then(setItems)
      .catch(() => setError('Could not load skills. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const created = await createSkill({
        ...form,
        level: Number(form.level),
        goal_level: Number(form.goal_level),
      });
      setItems((prev) => [...prev, created]);
      setForm(EMPTY);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save skill. Check the fields.');
    } finally {
      setSaving(false);
    }
  };

  const handlePractice = async (id, hours = 1) => {
    try {
      const updated = await logSkillPractice(id, hours);
      setItems((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch {
      setError('Could not log practice. Try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this skill?')) return;
    try {
      await deleteSkill(id);
      setItems((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError('Could not delete. Try again.');
    }
  };

  const stats = useMemo(() => {
    const totalHours = items.reduce((sum, s) => sum + (s.practice_hours || 0), 0);
    const atGoal = items.filter((s) => s.level >= s.goal_level).length;
    const expert = items.filter((s) => s.level === 4).length;
    return { count: items.length, totalHours: Math.round(totalHours * 10) / 10, atGoal, expert };
  }, [items]);

  const radarData = useMemo(
    () => items.map((s) => ({ skill: s.name, current: s.level, goal: s.goal_level })),
    [items]
  );

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">My Skills</h1>
        <p className="text-sm text-slate-500">Track proficiency, practice hours and goals for each skill.</p>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="Skills tracked" value={stats.count} accent="bg-violet-50 text-violet-600" />
        <StatCard icon={Clock} label="Practice hours" value={stats.totalHours} accent="bg-cyan-50 text-cyan-600" />
        <StatCard icon={Target} label="Goals reached" value={`${stats.atGoal}/${stats.count || 0}`} accent="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Trophy} label="Expert level" value={stats.expert} accent="bg-amber-50 text-amber-600" />
      </section>

      {/* Radar chart */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-violet-100">
        <h2 className="text-lg font-semibold text-slate-900">Skill profile</h2>
        <p className="mb-2 text-sm text-slate-500">Current level (violet) against your goal (dashed).</p>
        {radarData.length < 3 ? (
          <p className="py-10 text-center text-sm text-slate-500">Add at least 3 skills to see your radar chart.</p>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: '#64748b', fontSize: 12 }} />
                <PolarRadiusAxis domain={[0, 4]} tickCount={5} tick={false} axisLine={false} />
                <Radar name="Goal" dataKey="goal" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.1} strokeDasharray="4 4" />
                <Radar name="Current" dataKey="current" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.35} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Add form */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-violet-100">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Plus className="h-5 w-5 text-violet-500" /> Add a skill
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Skill name</label>
            <input name="name" value={form.name} onChange={handleChange} required placeholder="e.g. React" className={INPUT} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Category</label>
            <select name="category" value={form.category} onChange={handleChange} className={INPUT}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Current level</label>
            <select name="level" value={form.level} onChange={handleChange} className={INPUT}>
              {LEVELS.map((l, i) => (
                <option key={l} value={i + 1}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Goal level</label>
            <select name="goal_level" value={form.goal_level} onChange={handleChange} className={INPUT}>
              {LEVELS.map((l, i) => (
                <option key={l} value={i + 1}>{l}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col justify-end md:col-span-5">
            {error && <p className="mb-2 text-sm text-rose-600">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 self-start rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save skill
            </button>
          </div>
        </form>
      </section>

      {/* List */}
      <section className="grid gap-4 md:grid-cols-2">
        {loading && <p className="text-sm text-slate-500">Loading...</p>}
        {!loading && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 md:col-span-2">
            No skills yet. Add your first skill above.
          </div>
        )}
        {items.map((s) => {
          const pct = (s.level / 4) * 100;
          const goalPct = (s.goal_level / 4) * 100;
          const reached = s.level >= s.goal_level;
          return (
            <article key={s.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-violet-100">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="inline-block rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700 ring-1 ring-violet-200">
                    {s.category}
                  </span>
                  <h3 className="mt-2 truncate text-base font-semibold text-slate-900">{s.name}</h3>
                  <p className="text-sm text-slate-500">
                    {LEVELS[s.level - 1]} · Goal: {LEVELS[s.goal_level - 1]}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePractice(s.id, 1)}
                    className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
                  >
                    +1 hr
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Delete ${s.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="relative mt-4 h-2.5 w-full rounded-full bg-violet-50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
                <span
                  className="absolute -top-1 h-4 w-0.5 bg-slate-400"
                  style={{ left: `${goalPct}%` }}
                  title="Goal"
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{s.practice_hours} hrs practised</span>
                <span className={reached ? 'font-semibold text-emerald-600' : ''}>
                  {reached ? 'Goal reached' : 'In progress'}
                </span>
              </div>
              {s.last_practiced && (
                <p className="mt-1 text-xs text-slate-400">Last practised: {s.last_practiced}</p>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}