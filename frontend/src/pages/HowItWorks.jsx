import { Link } from 'react-router-dom';
import { BarChart3, Database, Info, ListChecks, ShieldCheck, Sparkles } from 'lucide-react';
import { fetchModelInfo } from '../api/client.js';
import { Card, Skeleton } from '../components/ui.jsx';
import { useResource } from '../hooks/useResource.js';

const STEPS = [
  [ListChecks, 'Track', 'Log sleep, mood, habits, skill practice and activities in one quick daily check-in.'],
  [BarChart3, 'Understand', 'Analytics link your tracking together: which habits, sleep and routines go with better days.'],
  [Sparkles, 'Predict', 'The CGPA model turns your numbers into an estimate and shows which small change helps most.'],
];

const INPUTS = ['Age, gender and major', 'Attendance %', 'Study hours per day', 'Previous CGPA', 'Sleep hours', 'Social hours per week'];

export default function HowItWorks() {
  const { data: info, loading } = useResource(() => fetchModelInfo().catch(() => null), []);
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">How EduPredict works</h1>
      <p className="mt-3 max-w-2xl text-lg text-slate-500 dark:text-slate-400">Simple tracking, honest analytics and a prediction you can reason about.</p>

      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {STEPS.map(([Icon, title, text], i) => (
          <Card key={title} hover className="animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white"><Icon className="h-5 w-5" /></div>
            <h3 className="font-bold text-slate-900 dark:text-white">{i + 1}. {title}</h3>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{text}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white"><Database className="h-5 w-5 text-violet-500" /> The prediction model</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">A gradient-boosted regression model trained on a student dataset. It uses:</p>
        <ul className="mt-3 grid gap-1.5 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">{INPUTS.map((i) => <li key={i} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-violet-500" />{i}</li>)}</ul>
        <div className="mt-5">
          {loading ? <Skeleton className="h-16" /> : info?.available ? (
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[['Test MAE', info.mae], ['R²', info.r2], ['Within ±0.25', info.within_0_25_pct !== undefined ? `${info.within_0_25_pct}%` : '-'], ['Test rows', info.test_rows ?? '-']].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><dt className="text-xs text-slate-500">{k}</dt><dd className="text-lg font-bold text-slate-900 dark:text-white">{v ?? '-'}</dd></div>
              ))}
            </dl>
          ) : (
            <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500 dark:bg-slate-800">Model metrics appear here after the model is trained (<code>python train_model.py</code>).</p>
          )}
        </div>
      </Card>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Card><h3 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white"><Info className="h-5 w-5 text-amber-500" /> Read predictions carefully</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">The result is a statistical estimate from patterns in past data. It cannot know about your exam week, health or circumstances. Use it to compare scenarios, not as a promise of a grade.</p></Card>
        <Card><h3 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white"><ShieldCheck className="h-5 w-5 text-emerald-500" /> Your data stays yours</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Tracking data is private to your account. You can export everything or delete it at any time from your profile.</p></Card>
      </div>

      <div className="mt-10 text-center"><Link to="/predict" className="btn btn-primary !px-6 !py-3">Try the predictor</Link></div>
    </div>
  );
}
