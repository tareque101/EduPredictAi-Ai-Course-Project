import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CalendarCheck,
  Flame,
  Moon,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';

const FEATURES = [
  {
    icon: BrainCircuit,
    title: 'CGPA Estimate',
    desc: 'A machine learning model estimates your end-of-semester CGPA from your daily habits.',
    tint: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
  },
  {
    icon: Target,
    title: 'Habit Tracking',
    desc: 'Set targets, log progress each day and keep your streaks alive with clear status badges.',
    tint: 'bg-teal-50 text-teal-600 ring-teal-100',
  },
  {
    icon: Sparkles,
    title: 'Smart Nudges',
    desc: 'Get practical suggestions, such as how a little more sleep can affect your estimate.',
    tint: 'bg-amber-50 text-amber-600 ring-amber-100',
  },
  {
    icon: BarChart3,
    title: 'Deep Analytics',
    desc: 'Trend charts and correlation views that show what is linked to your performance.',
    tint: 'bg-violet-50 text-violet-600 ring-violet-100',
  },
];

const STEPS = [
  { n: '01', title: 'Log your habits', desc: 'Track study, sleep, social time and attendance in seconds.' },
  { n: '02', title: 'Run the predictor', desc: 'Enter your numbers and see your estimated CGPA instantly.' },
  { n: '03', title: 'Follow the nudges', desc: 'Try the suggested changes and watch how the estimate responds.' },
];

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-indigo-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 h-[28rem] w-[28rem] rounded-full bg-teal-500/15 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-1.5 text-xs font-medium text-teal-200">
              <Sparkles className="h-3.5 w-3.5" /> Machine learning for students
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Understand your progress.
              <span className="mt-2 block bg-gradient-to-r from-teal-300 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                Build habits that last.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
              EduPredict AI looks at your study, sleep, social time and attendance, estimates your academic
              performance, and suggests what to try next.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/predict"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-teal-500 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:shadow-indigo-500/40"
              >
                <BrainCircuit className="h-4 w-4" /> Predict CGPA
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/10"
              >
                Open Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Preview card */}
          <div className="relative">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl sm:p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-300">Estimated CGPA</p>
                  <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Sample
                  </span>
                </div>
                <span className="rounded-full bg-teal-400/15 px-3 py-1 text-xs font-semibold text-teal-300 ring-1 ring-teal-400/30">
                  Low risk
                </span>
              </div>

              <p className="mt-4 text-7xl font-extrabold tracking-tight">3.42</p>
              <p className="mt-1 text-sm text-slate-400">Example output based on sample habits</p>

              <div className="mt-8 space-y-4">
                {[
                  { label: 'Study', value: 78, icon: BarChart3, color: 'bg-indigo-400' },
                  { label: 'Sleep', value: 86, icon: Moon, color: 'bg-teal-400' },
                  { label: 'Attendance', value: 88, icon: CalendarCheck, color: 'bg-amber-400' },
                ].map((bar) => (
                  <div key={bar.label}>
                    <div className="mb-1.5 flex items-center justify-between text-xs text-slate-300">
                      <span className="flex items-center gap-2">
                        <bar.icon className="h-3.5 w-3.5" /> {bar.label}
                      </span>
                      <span>{bar.value}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div className={`h-full rounded-full ${bar.color}`} style={{ width: `${bar.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-start gap-3 rounded-2xl bg-indigo-400/10 p-4 ring-1 ring-indigo-400/20">
                <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-indigo-300" />
                <p className="text-sm text-indigo-100">
                  Sleeping 7.5 hours instead of 6.5 can lift the estimate by about <strong>+0.10</strong>.
                </p>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10">
                <span className="rounded-xl bg-amber-400/15 p-2 text-amber-300">
                  <Flame className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs text-slate-400">Longest streak</p>
                  <p className="text-lg font-bold">14 days</p>
                </div>
              </div>

              <p className="mt-5 text-xs text-slate-500">
                Estimate only, not a guarantee. This preview uses sample numbers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-teal-600">Features</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything you need to plan your semester
            </h2>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl bg-white p-6 ring-1 ring-slate-200/80 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5"
              >
                <span className={`inline-flex rounded-xl p-3 ring-1 ${f.tint}`}>
                  <f.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">How it works</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Three steps to plan better
            </h2>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            {STEPS.map((step) => (
              <div
                key={step.n}
                className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-8"
              >
                <span className="text-5xl font-extrabold bg-gradient-to-r from-indigo-500 to-teal-400 bg-clip-text text-transparent">
                  {step.n}
                </span>
                <h3 className="mt-4 text-xl font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-slate-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-50 px-6 py-24">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-slate-950 p-10 text-center text-white shadow-2xl sm:p-16">
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-teal-400/20 blur-3xl" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to see your estimate?</h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-300">
              Try the CGPA predictor, or log in and add your habits to see where to focus.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/predict"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5"
              >
                Predict CGPA <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/habits"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Track Habits
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} EduPredict AI. Built for CSE students.</p>
          <div className="flex items-center gap-6">
            <Link to="/how-it-works" className="transition hover:text-indigo-600">How it works</Link>
            <Link to="/analytics" className="transition hover:text-indigo-600">Analytics</Link>
            <span>Flask · React · Scikit-Learn</span>
          </div>
        </div>
      </footer>
    </div>
  );
}