import { useState } from 'react';
import { GraduationCap, Loader2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const MAJORS = [
  'Engineering', 'Business', 'Mathematics',
  'Economics', 'Psychology', 'Computer Science',
];

const NUMERIC_FIELDS = [
  { name: 'age', label: 'Age', min: 15, max: 40, step: 1 },
  { name: 'attendancePct', label: 'Attendance (%)', min: 0, max: 100, step: 0.1 },
  { name: 'studyHours', label: 'Study hours / day', min: 0, max: 24, step: 0.1 },
  { name: 'previousCgpa', label: 'Previous CGPA', min: 0, max: 4, step: 0.01 },
  { name: 'sleepHours', label: 'Sleep hours / day', min: 0, max: 24, step: 0.1 },
  { name: 'socialHours', label: 'Social hours / week', min: 0, max: 168, step: 0.5 },
];

const INITIAL_FORM = {
  gender: 'Male',
  age: '',
  major: 'Engineering',
  attendancePct: '',
  studyHours: '',
  previousCgpa: '',
  sleepHours: '',
  socialHours: '',
};

const INPUT =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100';

const RISK_STYLE = {
  Low: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Moderate: 'bg-amber-50 text-amber-700 ring-amber-200',
  High: 'bg-rose-50 text-rose-700 ring-rose-200',
};

export default function CgpaPredictor() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Prediction failed.');
      setResult(data);
    } catch (err) {
      setError(err.message || 'Server-e connect kora jacche na.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-10">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">CGPA Predictor</h1>
        <p className="text-sm text-slate-500">
          Apnar habit ar previous CGPA diye final CGPA-r estimate paben.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-rose-100 md:grid-cols-2"
      >
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Gender</label>
          <select name="gender" value={form.gender} onChange={handleChange} className={INPUT}>
            <option>Male</option>
            <option>Female</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Major</label>
          <select name="major" value={form.major} onChange={handleChange} className={INPUT}>
            {MAJORS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>

        {NUMERIC_FIELDS.map((f) => (
          <div key={f.name}>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">{f.label}</label>
            <input
              type="number"
              name={f.name}
              value={form[f.name]}
              onChange={handleChange}
              min={f.min}
              max={f.max}
              step={f.step}
              required
              className={INPUT}
            />
          </div>
        ))}

        <div className="flex flex-col md:col-span-2">
          {error && <p className="mb-2 text-sm text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 self-start rounded-lg bg-rose-500 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Predict
          </button>
        </div>
      </form>

      {result && (
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-rose-100">
          <div className="flex items-center gap-4">
            <span className="rounded-xl bg-rose-50 p-3 text-rose-600">
              <GraduationCap className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm text-slate-500">Predicted final CGPA</p>
              <p className="text-4xl font-bold text-slate-900">{result.predictedCgpa}</p>
            </div>
          </div>
          <span
            className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
              RISK_STYLE[result.riskLevel] || ''
            }`}
          >
            Risk: {result.riskLevel}
          </span>
          <p className="mt-4 text-xs text-slate-400">
            Eta ekta estimate, ekhane sheshe result nischito na. Ei tool shudhu self-tracking-er jonno.
          </p>
        </section>
      )}
    </div>
  );
}