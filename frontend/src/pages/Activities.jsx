import { useEffect, useMemo, useState } from 'react';
import { Award, Clock, ExternalLink, Loader2, Plus, Trash2, Trophy, Users } from 'lucide-react';
import { createActivity, deleteActivity, fetchActivities } from '../api/client.js';

const CATEGORIES = ['Academic', 'Sports', 'Cultural', 'Social Service', 'Tech', 'Other'];
const EMPTY = {
  title: '',
  organisation: '',
  category: 'Tech',
  role: '',
  start_date: '',
  end_date: '',
  hours: '',
  certificate_url: '',
  notes: '',
};
const INPUT =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';

const CATEGORY_STYLE = {
  Academic: 'bg-blue-50 text-blue-700 ring-blue-200',
  Sports: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Cultural: 'bg-pink-50 text-pink-700 ring-pink-200',
  'Social Service': 'bg-amber-50 text-amber-700 ring-amber-200',
  Tech: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  Other: 'bg-slate-100 text-slate-700 ring-slate-200',
};

const formatDate = (d) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <span className={`inline-flex rounded-xl p-2 ${accent}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

export default function Activities() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [filter, setFilter] = useState('All');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchActivities()
      .then(setItems)
      .catch(() => setError('Could not load activities. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const created = await createActivity({ ...form, hours: Number(form.hours) || 0 });
      setItems((prev) => [created, ...prev]);
      setForm(EMPTY);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save. Check the fields and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this activity?')) return;
    try {
      await deleteActivity(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      setError('Could not delete. Try again.');
    }
  };

  const stats = useMemo(() => {
    const totalHours = items.reduce((sum, i) => sum + (i.hours || 0), 0);
    const leadership = items.filter((i) => /lead|coordinator|president|secretary|captain|head/i.test(i.role || '')).length;
    const categories = new Set(items.map((i) => i.category)).size;
    return { count: items.length, totalHours: Math.round(totalHours * 10) / 10, leadership, categories };
  }, [items]);

  const visible = filter === 'All' ? items : items.filter((i) => i.category === filter);

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">My Extra-Curricular Activities</h1>
        <p className="text-sm text-slate-500">Clubs, events, competitions and volunteering, all in one place.</p>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Award} label="Activities" value={stats.count} accent="bg-indigo-50 text-indigo-600" />
        <StatCard icon={Clock} label="Total hours" value={stats.totalHours} accent="bg-cyan-50 text-cyan-600" />
        <StatCard icon={Users} label="Leadership roles" value={stats.leadership} accent="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Trophy} label="Categories covered" value={`${stats.categories}/${CATEGORIES.length}`} accent="bg-amber-50 text-amber-600" />
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Plus className="h-5 w-5 text-indigo-500" /> Add an activity
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Title</label>
            <input name="title" value={form.title} onChange={handleChange} required placeholder="e.g. Annual Tech Fest" className={INPUT} />
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
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Organisation</label>
            <input name="organisation" value={form.organisation} onChange={handleChange} placeholder="e.g. CSE Club" className={INPUT} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Your role</label>
            <input name="role" value={form.role} onChange={handleChange} placeholder="e.g. Coordinator" className={INPUT} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Hours contributed</label>
            <input name="hours" type="number" min="0" step="0.5" value={form.hours} onChange={handleChange} placeholder="e.g. 12" className={INPUT} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Start date</label>
            <input name="start_date" type="date" value={form.start_date} onChange={handleChange} required className={INPUT} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">End date (optional)</label>
            <input name="end_date" type="date" value={form.end_date} onChange={handleChange} className={INPUT} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Certificate link (optional)</label>
            <input name="certificate_url" value={form.certificate_url} onChange={handleChange} placeholder="https://..." className={INPUT} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Notes (optional)</label>
            <input name="notes" value={form.notes} onChange={handleChange} placeholder="Achievement, outcome..." className={INPUT} />
          </div>

          <div className="flex flex-col justify-end md:col-span-3">
            {error && <p className="mb-2 text-sm text-rose-600">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 self-start rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save activity
            </button>
          </div>
        </form>
      </section>

      <section className="flex flex-wrap gap-2">
        {['All', ...CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${
              filter === c ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {c}
          </button>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {loading && <p className="text-sm text-slate-500">Loading...</p>}
        {!loading && visible.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 md:col-span-2">
            No activities yet. Add your first club, event or volunteering role above.
          </div>
        )}
        {visible.map((a) => (
          <article key={a.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${CATEGORY_STYLE[a.category] || CATEGORY_STYLE.Other}`}>
                  {a.category}
                </span>
                <h3 className="mt-2 truncate text-base font-semibold text-slate-900">{a.title}</h3>
                <p className="truncate text-sm text-slate-500">
                  {[a.organisation, a.role].filter(Boolean).join(' · ') || 'No organisation given'}
                </p>
              </div>
              <button
                onClick={() => handleDelete(a.id)}
                className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                aria-label={`Delete ${a.title}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{a.hours} hrs</span>
              <span>
                {formatDate(a.start_date)}
                {a.end_date ? ` – ${formatDate(a.end_date)}` : ''}
              </span>
              {a.certificate_url && (
                <a href={a.certificate_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:underline">
                  Certificate <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            {a.notes && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{a.notes}</p>}
          </article>
        ))}
      </section>
    </div>
  );
}