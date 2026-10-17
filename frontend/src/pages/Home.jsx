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
    title: 'AI CGPA Prediction',
    desc: 'Machine learning model forecasts your end-of-semester CGPA from your daily habits.',
    gradient: 'from-indigo-500 to-violet-500',
  },
  {
    icon: Target,
    title: 'Habit Tracking',
    desc: 'Set targets, log progress daily and watch your streaks grow with color-coded status.',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Sparkles,
    title: 'Smart Nudges',
    desc: 'Get actionable insights like "Sleeping 7.5 hours boosts your CGPA by +0.15".',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: BarChart3,
    title: 'Deep Analytics',
    desc: 'Trend charts, peer benchmarks and correlation analysis to understand what really matters.',
    gradient: 'from-emerald-500 to-teal-500',
  },
];

const STEPS = [
  { n: '01', title: 'Log your habits', desc: 'Track study, sleep, social time and attendance in seconds.' },
  { n: '02', title: 'Run the simulator', desc: 'Adjust sliders and see your predicted CGPA update live.' },
  { n: '03', title: 'Follow the nudges', desc: 'Apply the AI recommendations and watch your risk level drop.' },
];

const STATS = [
  { value: '5,000+', label: 'Training records' },
  { value: '4', label: 'Habit factors analysed' },
  { value: '24/7', label: 'Study assistant' },
  { value: '0.92', label: 'Attendance-quiz correlation' },
];

export default function Home() {
  return (
    <div className="-mx-4 -mt-6 md:-mx-6">
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-indigo-200 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Powered by Machine Learning
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Predict your CGPA.
              <span className="block bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Build habits that win.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
              EduPredict AI analyses your study, sleep, social time and attendance to forecast your
              academic performance, then tells you exactly what to change.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.02] hover:shadow-indigo-500/50"
              >
                Open Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/analytics"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/10"
              >
                Explore Analytics
              </Link>
            </div>
          </div>

          {/* Live preview card */}
          <div className="relative">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-300">Predicted CGPA</p>
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
                  Low Risk
                </span>
              </div>
              <p className="mt-3 text-7xl font-extrabold tracking-tight">3.42</p>
              <p className="mt-1 text-sm text-slate-400">Based on your last 15 weeks of habits</p>

              <div className="mt-8 space-y-4">
                {[
                  { label: 'Study', value: 78, icon: BarChart3, color: 'bg-indigo-500' },
                  { label: 'Sleep', value: 86, icon: Moon, color: 'bg-cyan-500' },
                  { label: 'Attendance', value: 88, icon: CalendarCheck, color: 'bg-emerald-500' },
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

              <div className="mt-6 flex items-start gap-3 rounded-2xl bg-indigo-500/10 p-4 ring-1 ring-indigo-400/20">
                <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-indigo-300" />
                <p className="text-sm text-indigo-100">
                  Sleeping 7.5 hours instead of 6.5 can lift your CGPA by about <strong>+0.10</strong>.
                </p>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-xl backdrop-blur md:block">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-orange-500/20 p-2 text-orange-300">
                  <Flame className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs text-slate-400">Longest streak</p>
                  <p className="text-lg font-bold">14 Days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-12 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-extrabold text-slate-900">{s.value}</p>
              <p className="mt-1 text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Features</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
              Everything you need to level up your semester
            </h2>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <span className={`inline-flex rounded-xl bg-gradient-to-br ${f.gradient} p-3 text-white shadow-lg`}>
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
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">How it works</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Three steps to a better CGPA</h2>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.n} className="relative rounded-2xl border border-slate-200 p-8">
                <span className="text-5xl font-extrabold text-indigo-100">{step.n}</span>
                <h3 className="mt-4 text-xl font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-slate-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 p-10 text-center text-white shadow-2xl sm:p-14">
          <h2 className="text-3xl font-bold sm:text-4xl">Ready to see your future CGPA?</h2>
          <p className="mx-auto mt-4 max-w-xl text-indigo-100">
            Start with the simulator, log today's habits and let the AI show you where to focus.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-indigo-700 shadow-lg transition hover:scale-[1.02]"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/habits"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Track Habits
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} EduPredict AI. Built for CSE students.</p>
          <p>Flask · React · Scikit-Learn</p>
        </div>
      </footer>
    </div>
  );
}