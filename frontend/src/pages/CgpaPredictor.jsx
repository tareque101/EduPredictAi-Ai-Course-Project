import { useState } from 'react';
import { AlertTriangle, CheckCircle2, GraduationCap, Info, Loader2, Sparkles } from 'lucide-react';
import { predictCgpa } from '../api/client.js';

const MAJORS = [
  'Engineering',
  'Business',
  'Mathematics',
  'Economics',
  'Psychology',
  'Computer Science',
];

const FIELDS = [
  { name: 'age', label: 'Age', hint: 'Years', min: 15, max: 40, step: 1 },
  { name: 'attendancePct', label: 'Attendance', hint: 'Percent (0-100)', min: 0, max: 100, step: 0.1 },
  { name: 'studyHours', label: 'Study hours', hint: 'Per day', min: 0, max: 24, step: 0.1 },
  { name: 'previousCgpa', label: 'Previous CGPA', hint: 'Scale 0-4', min: 0, max: 4, step: 0.01 },
  { name: 'sleepHours', label: 'Sleep hours', hint: 'Per day', min: 0, max: 24, step: 0.1 },
  { name: 'socialHours', label: 'Social time', hint: 'Hours per week', min: 0, max: 168, step: 0.5 },
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
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100';

const LABEL = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500';

const RISK = {
  Low: {
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    bar: 'bg-emerald-500',
    text: 'Your habits look well balanced for the current estimate.',
  },
  Moderate: {
    badge: 'bg-amber-50 text-amber-700 ring-amber-200',
    bar: 'bg-amber-500',
    text: 'There is room to improve. Small changes in sleep, study or attendance can help.',
  },
  High: {
    badge: 'bg-rose-50 text-rose-700 ring-rose-200',
    bar: 'bg-rose-500',
    text: 'The estimate is on the low side. Consider talking to your academic advisor.',
  },
};

export default function CgpaPredictor() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await predictCgpa({
        ...form,
        age: Number(form.age),
        attendancePct: Number(form.attendancePct),
        studyHours: Number(form.studyHours),
        previousCgpa: Number(form.previousCgpa),
        sleepHours: Number(form.sleepHours),
        socialHours: Number(form.socialHours),
      });
      setResult(data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          (err.code === 'ECONNABORTED'
            ? 'Prediction took too long. Please try again.'
            : 'Cannot reach the server. Make sure the backend is running on port 5000.')
      );
    } finally {
      setLoading(false);
    }
  };

  const risk = result ? RISK[result.riskLevel] || RISK.Moderate : null;
  const scorePct = result ? Math.min(100, Math.max(0, (result.predictedCgpa / 4) * 100)) : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 ring-1 ring-rose-100">
          <Sparkles className="h-3.5 w-3.5" /> Machine learning estimate
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">CGPA Predictor</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
          Enter your habits and previous CGPA to get an estimate of your final CGPA. This is a
          guide for self-tracking, not a guaranteed result.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8 lg:col-span-3"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className={LABEL}>Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange} className={INPUT}>
                <option>Male</option>
                <option>Female</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Major</label>
              <select name="major" value={form.major} onChange={handleChange} className={INPUT}>
                {MAJORS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>

            {FIELDS.map((f) => (
              <div key={f.name}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{f.label}</label>
                  <span className="text-[11px] text-slate-400">{f.hint}</span>
                </div>
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
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <Info className="h-3.5 w-3.5" /> All fields are required
            </p>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-500/25 transition hover:shadow-lg hover:shadow-rose-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />}
              {loading ? 'Predicting...' : 'Predict CGPA'}
            </button>
          </div>
        </form>

        {/* Result */}
        <aside className="lg:col-span-2">
          {!result && !loading && (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
              <span className="rounded-2xl bg-rose-50 p-4 text-rose-500">
                <GraduationCap className="h-8 w-8" />
              </span>
              <p className="mt-4 font-semibold text-slate-900">Your estimate appears here</p>
              <p className="mt-1 text-sm text-slate-500">Fill in the form and press Predict CGPA.</p>
            </div>
          )}

          {loading && (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-3xl bg-white p-8 ring-1 ring-slate-200">
              <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
              <p className="mt-4 text-sm text-slate-500">Running the model...</p>
            </div>
          )}

          {result && risk && (
            <div className="space-y-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> Prediction ready
              </div>

              <div>
                <p className="text-sm text-slate-500">Predicted final CGPA</p>
                <p className="mt-1 text-5xl font-extrabold tracking-tight text-slate-900">
                  {result.predictedCgpa.toFixed(2)}
                </p>
                <span
                  className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${risk.badge}`}
                >
                  Risk: {result.riskLevel}
                </span>
              </div>

              <div>
                <div className="mb-1.5 flex justify-between text-xs text-slate-400">
                  <span>0.0</span>
                  <span>4.0</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${risk.bar}`}
                    style={{ width: `${scorePct}%` }}
                  />
                </div>
              </div>

              <p className="text-sm leading-relaxed text-slate-600">{risk.text}</p>

              <p className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
                This is an estimate, not a guarantee. It is based on a model trained on limited data and is
                meant for self-tracking only.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}